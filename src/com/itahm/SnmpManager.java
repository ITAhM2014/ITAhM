package com.itahm;

import java.io.Closeable;
import java.io.File;
import java.io.IOException;

import java.util.Calendar;
import java.util.HashMap;
import java.util.Map;
import java.util.Timer;
import java.util.TimerTask;

import org.json.JSONException;
import org.json.JSONObject;
import org.snmp4j.PDU;
import org.snmp4j.event.ResponseEvent;
import org.snmp4j.event.ResponseListener;
import org.snmp4j.smi.VariableBinding;
import org.snmp4j.transport.DefaultUdpTransportMapping;

import com.itahm.json.JSONFile;
import com.itahm.snmp.Constants;
import com.itahm.snmp.Node;

public class SnmpManager extends TimerTask implements ResponseListener, Closeable  {

	private final org.snmp4j.Snmp snmp;
	private final Timer timer;
	private final File root;
	private final JSONFile snmpFile = new JSONFile();
	private final JSONFile addrFile = new JSONFile();
	
	public static enum FILE {
		SNMP, ADDRESS
	}
	
	private final Map<String, Node> nodeList = new HashMap<String, Node>();
	
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
		pdu.add(new VariableBinding(Constants.hrStorageType));
		pdu.add(new VariableBinding(Constants.hrStorageDescr));
		pdu.add(new VariableBinding(Constants.hrStorageAllocationUnits));
		pdu.add(new VariableBinding(Constants.hrStorageSize));
		pdu.add(new VariableBinding(Constants.hrStorageUsed));
		
	}
	
	//public static long DELAY = 60 * 1000; // 1 min.
	public static long DELAY = 10 * 1000; // test
	
	public SnmpManager() throws IOException {
		this(new File("."));
	}
	
	public SnmpManager(File path) throws IOException {
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
		
		JSONObject jo = snmpFile.getJSONObject();
		
		for (String ip: JSONObject.getNames(jo)) {
			add(Node.create(root, jo.getJSONObject(ip)));
		};
		
		timer.scheduleAtFixedRate(this, 3000, DELAY);
		
		System.out.println("snmp manager is running");
	}
	
	private boolean add (Node node) {
		synchronized(this.nodeList) {
			String ip = node.getIPAddress();
			
			if (!this.nodeList.containsKey(ip)) {
				this.nodeList.put(ip, node);
				
				return true;
			}
		}
		
		return false;
	}
	
	public Node add (String ip, int udp, String community) {
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
			
			add(Node.create(this.root, jo));
		}
		catch (JSONException | IOException e) {
			e.printStackTrace();
		}
		
		return null;
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
	
	public JSONObject get(String ip) {
		return this.nodeList.get(ip).getJSON();
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
		long now = Calendar.getInstance().getTimeInMillis();
		
		((org.snmp4j.Snmp)event.getSource()).cancel(request, this);
		
		if (response == null) {			
			// TODO response timed out
			
			node.set("timeout", now);
			System.out.println("timeout");
			return;
		}
		
		int status = response.getErrorStatus();
		node.set("timeout", -1);
		
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
	/*
	public JSONFile getFile(String name) {
		if ("address".equals(name)) {
			return this.addrFile;
		}
		else if ("snmp".equals(name)) {
			return this.snmpFile;
		}
		
		return null;
	}
	*/
	/*
	private JSONObject getData(String name, String ip, String date) {
		File dir = new File(this.root, ip + File.separator + name + File.separator + date.replace("-", File.separator));
		JSONObject jo = null;
		
		if (dir.isDirectory()) {
			jo = new JSONObject();
			
			for (File file : dir.listFiles()) {
				jo.put(file.getName(), JSONFile.getJSONObject(file));
			}
		}
		
		return jo;
	}
	*/
	public void run() {
		try {
			this.addrFile.save();
			this.snmpFile.save();
		} catch (IOException ioe) {
			// TODO fatal error
			
			ioe.printStackTrace();
		}
		
		Node node;
		synchronized(this.nodeList) {
			try {
				for (String ip : this.nodeList.keySet()) {
					node = this.nodeList.get(ip);
					
					this.snmp.send(pdu, node, node, this);
				}
			} catch (IOException ioe) {
				// TODO fatal error
				
				ioe.printStackTrace();
			}
		}
	}
	
	public static void main(String [] args) {
		SnmpManager manager;
		try {
			manager = new SnmpManager();
			
			//Node node =
			//manager.add("127.0.0.1", 161, "public");
			
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
			// TODO Auto-generated catch block
			e.printStackTrace();
		}	
	}
	
}