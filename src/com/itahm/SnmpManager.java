package com.itahm;

import java.io.Closeable;
import java.io.File;
import java.io.IOException;
import java.nio.channels.SocketChannel;
import java.util.Calendar;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;
import java.util.Timer;
import java.util.TimerTask;

import org.json.JSONException;
import org.json.JSONObject;
import org.snmp4j.PDU;
import org.snmp4j.event.ResponseEvent;
import org.snmp4j.event.ResponseListener;
import org.snmp4j.smi.VariableBinding;
import org.snmp4j.transport.DefaultUdpTransportMapping;

import com.itahm.http.Message;
import com.itahm.json.JSONFile;
import com.itahm.snmp.Constants;
import com.itahm.snmp.Node;

public class SnmpManager extends TimerTask implements ResponseListener, Closeable  {

	private final org.snmp4j.Snmp snmp;
	private final EventListener itahm;
	private final Timer timer;
	private final File root;
	private final JSONFile snmpFile = new JSONFile();
	private final JSONFile addrFile = new JSONFile();
	
	public static enum FILE {
		SNMP, ADDRESS
	}
	
	private final Map<String, Node> nodeList = new HashMap<String, Node>();
	private final Set<String> realTimeNodeList = new HashSet<String>();
	
	private final static PDU pdu = new PDU();
	{
		pdu.setType(PDU.GETNEXT);
		pdu.add(new VariableBinding(Constants.sysDescr));
		pdu.add(new VariableBinding(Constants.sysObjectID));
		pdu.add(new VariableBinding(Constants.sysName));
		pdu.add(new VariableBinding(Constants.sysServices));
		pdu.add(new VariableBinding(Constants.ifIndex));
		pdu.add(new VariableBinding(Constants.ifDescr));
		pdu.add(new VariableBinding(Constants.ifType));
		pdu.add(new VariableBinding(Constants.ifSpeed));
		pdu.add(new VariableBinding(Constants.ifPhysAddress));
		pdu.add(new VariableBinding(Constants.ifAdminStatus));
		pdu.add(new VariableBinding(Constants.ifOperStatus));
		pdu.add(new VariableBinding(Constants.ifName));
		pdu.add(new VariableBinding(Constants.ifInOctets));
		pdu.add(new VariableBinding(Constants.ifOutOctets));
		pdu.add(new VariableBinding(Constants.ifHCInOctets));
		pdu.add(new VariableBinding(Constants.ifHCOutOctets));
		pdu.add(new VariableBinding(Constants.ifAlias));
		pdu.add(new VariableBinding(Constants.ipNetToMediaType));
		pdu.add(new VariableBinding(Constants.ipNetToMediaPhysAddress));
		pdu.add(new VariableBinding(Constants.hrSystemUptime));
		pdu.add(new VariableBinding(Constants.hrProcessorLoad));
		pdu.add(new VariableBinding(Constants.hrStorageIndex));
		pdu.add(new VariableBinding(Constants.hrStorageType));
		pdu.add(new VariableBinding(Constants.hrStorageDescr));
		pdu.add(new VariableBinding(Constants.hrStorageAllocationUnits));
		pdu.add(new VariableBinding(Constants.hrStorageSize));
		pdu.add(new VariableBinding(Constants.hrStorageUsed));
		
	}
	
	private int lastRequestTime = -1;
	
	public SnmpManager(EventListener eventListener) throws IOException {
		this(new File("."), eventListener);
	}
	
	public SnmpManager(File path, EventListener eventListener) throws IOException {
		itahm = eventListener;
		snmp = new org.snmp4j.Snmp(new DefaultUdpTransportMapping());
		timer = new Timer(true);
		root = new File(path, "snmp");
		
		root.mkdir();
		
		snmpFile.load(new File(root, "snmp"));
		addrFile.load(new File(root, "address"));
		
		snmp.listen();
		
		if (snmpFile.get("127.0.0.1") == null) {
			snmpFile.put("127.0.0.1", new JSONObject()
				.put("ip","127.0.0.1")
				.put("udp", 161)
				.put("community", "public")
				.put("ifEntry", new JSONObject())
				.put("hrProcessorLoad", new JSONObject())
			);
			
			snmpFile.save();
		}
		
		JSONObject snmpData = snmpFile.getJSONObject();
		
		for (String ip: JSONObject.getNames(snmpData)) {
			addNode(Node.create(itahm, root, snmpData.getJSONObject(ip)));
		};
		
		timer.scheduleAtFixedRate(this, 1000, 1000);
		
		System.out.println("snmp manager is running");
	}
	
	private boolean addNode (Node node) {
		synchronized(this.nodeList) {
			String ip = node.getIPAddress();
			
			if (!this.nodeList.containsKey(ip)) {
				this.nodeList.put(ip, node);
				
				return true;
			}
		}
		
		return false;
	}
	
	public Node addNode(String ip, int udp, String community) {
		JSONObject snmpTable = snmpFile.getJSONObject();
		JSONObject jo = new JSONObject()
			.put("ip", ip)
			.put("udp", udp)
			.put("community", community)
			.put("ifEntry", new JSONObject())
			.put("hrProcessorEntry", new JSONObject())
			.put("hrStorageEntry", new JSONObject());
		
		try {
			snmpTable.put(ip, jo);
			
			addNode(Node.create(this.itahm, this.root, jo));
		}
		catch (JSONException | IOException e) {
			e.printStackTrace();
		}
		
		return null;
	}
	
	public void addRealTimeNode(String ip) {
		synchronized(this.nodeList) {
			this.realTimeNodeList.add(ip);
		}
	}
	
	public JSONFile getFile(FILE name) {
		switch(name) {
		case ADDRESS:
			return this.addrFile;
			
		case SNMP:
			return this.snmpFile;
		}
		
		return null;
	}
	
	public File getRoot() {
		return this.root;
	}
	
	@Override
	public void close() throws IOException {
		this.timer.cancel();
		
		snmp.close();
	}
	
	@Override
	public void onResponse(ResponseEvent event) {
		PDU request = event.getRequest();
		PDU response = event.getResponse();
		Node node = ((Node)event.getUserObject());
		
		((org.snmp4j.Snmp)event.getSource()).cancel(request, this);
		
		if (response == null) {			
			// TODO response timed out
			
			node.timeOut();
			return;
		}
		
		int status = response.getErrorStatus();
		
		node.setResponseTime();
		
		if (status == PDU.noError) {
			try {
				PDU nextRequest = node.parse(request, response);
				
				if (nextRequest == null) {
					// TODO end of get-next request
				}
				else {
					snmp.send(nextRequest, node, node, this);
				}
			} catch (IOException e) {
				// TODO fatal error
				e.printStackTrace();
			} catch (JSONException jsone) {
				jsone.printStackTrace();
			}
		}
		else {
			// TODO 
			System.out.println(String.format("error index[%d] status : %s", response.getErrorIndex(), response.getErrorStatusText()));
		}
	}
	
	public void run() {		
		Calendar calendar = Calendar.getInstance();
		int minutes = calendar.get(Calendar.MINUTE);
		long requestTime = calendar.getTimeInMillis();
		
		synchronized(this.nodeList) {
			synchronized(this.realTimeNodeList) {
				if (this.lastRequestTime != minutes) {
					try {
						this.addrFile.save();
						this.snmpFile.save();
					} catch (IOException ioe) {
						// TODO fatal error
						
						ioe.printStackTrace();
					}
					
					loop(this.nodeList.keySet().iterator(), requestTime);
					
					this.lastRequestTime = minutes;
				}
				else {
					loop(this.realTimeNodeList.iterator(), requestTime, true);
				}
			}
		}
	}
	
	private void loop (Iterator<String> iterator, long requestTime){
		loop(iterator, requestTime, false);
	}
	
	private void loop (Iterator<String> iterator, long requestTime, boolean remove){
		Node node;
		
		try {
			while (iterator.hasNext()) {
				node = this.nodeList.get(iterator.next());
				node.setRequestTime(requestTime);
				
				this.snmp.send(pdu, node, node, this);
				
				if (remove) {
					iterator.remove();
				}
			}
		} catch (IOException ioe) {
			// TODO fatal error
			
			ioe.printStackTrace();
		}
	}
	
	public static void main(String [] args) {
		SnmpManager manager;
		try {
			manager = new SnmpManager(new EventListener () {

				@Override
				public void onConnect(SocketChannel channel) {
					
				}

				@Override
				public void onClose(SocketChannel channel) {
					
				}

				@Override
				public void onRequest(SocketChannel channel, Message request, Message response) {
					
				}

				@Override
				public void onError(Exception e) {
					
				}

				@Override
				public void onEvent() {
					
				}
				
			});
			
			boolean more = true;
			while (more) {
				switch(System.in.read()) { 
				case 'd':
					
					break;
				case -1:
					more = false;
					
					break;
				default:
						
				}
			}
			
			manager.close();	
		} catch (IOException e) {
			e.printStackTrace();
		}	
	}
	
}