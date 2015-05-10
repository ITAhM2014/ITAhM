package com.itahm.snmp;

import java.io.Closeable;
import java.io.File;
import java.io.IOException;
//import java.util.Vector;



import java.util.Calendar;
import java.util.HashSet;
import java.util.Map;
import java.util.Timer;
import java.util.TimerTask;

import org.json.JSONException;
import org.json.JSONObject;
import org.snmp4j.PDU;
import org.snmp4j.Snmp;
import org.snmp4j.event.ResponseEvent;
import org.snmp4j.event.ResponseListener;
import org.snmp4j.smi.VariableBinding;
import org.snmp4j.transport.DefaultUdpTransportMapping;

import com.itahm.json.JSONFile;

public class Manager extends TimerTask implements ResponseListener, Closeable  {

	private final Snmp snmp;
	private final Timer timer;
	private final File root;
	private final JSONFile snmpFile = new JSONFile();
	private final JSONFile addrFile = new JSONFile();
	
	private final HashSet<Node> nodeList = new HashSet<Node>();
	private final static PDU pdu = new PDU();
	{
		pdu.setType(PDU.GETNEXT);
		pdu.add(new VariableBinding(Constants.sysDescr));
		pdu.add(new VariableBinding(Constants.sysObjectID));
		pdu.add(new VariableBinding(Constants.sysName));
		pdu.add(new VariableBinding(Constants.sysServices));
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
	}
	
	//public static long DELAY = 60 * 1000; // 1 min.
	public static long DELAY = 3 * 1000; // test
	
	public Manager() throws IOException {
		this(new File(""));
	}
	
	public Manager(File path) throws IOException {
		snmp = new Snmp(new DefaultUdpTransportMapping());
		timer = new Timer(true);
		root = new File(path, "snmp");
		
		root.mkdir();
		
		snmpFile.load(new File(root, "snmp"));
		addrFile.load(new File(root, "address"));
		
		snmp.listen();
		
		JSONObject jo = snmpFile.getJSONObject();
		
		if (jo.length() > 0) {
			String [] names = JSONObject.getNames(jo);
			
			for (int i=0, _i=names.length; i<_i; i++) {
				Node.create(root, jo.getJSONObject(names[i]));
			}
		}
		else {
			add("127.0.0.1", 161, "public");
		}
		
		timer.scheduleAtFixedRate(this, 3000, DELAY);
	}
	
	public Node add (String ip, int udp, String community) {
		JSONObject snmpTable = snmpFile.getJSONObject();
		JSONObject jo = new JSONObject()
			.put("ip", ip)
			.put("udp", udp)
			.put("community", community)
			.put("ifEntry", new JSONObject());
		
		try {
			snmpTable.put(ip, jo);
			
			Node node = Node.create(this.root, jo);
			if (node != null) {
				synchronized(this.nodeList) {
					if (this.nodeList.add(node)) {
						return node;
					}
				}
			}
		}
		catch (JSONException | IOException e) {
			e.printStackTrace();
		}
		
		return null;
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
		
		((Snmp)event.getSource()).cancel(request, this);
		
		if (response == null) {			
			// TODO response timed out
			
			System.out.println("node "+ event.getPeerAddress() +" request timed out");
			
			return;
		}
		
		int status = response.getErrorStatus();
		
		if (status == PDU.noError) {
			try {
				PDU nextRequest = node.parse(request, response);
				
				if (nextRequest == null) {
					JSONObject addrTable = this.addrFile.getJSONObject();
					Map<String, String> addrMap = node.getAddrTable();
					String mac;
					JSONObject data;
					long now = Calendar.getInstance().getTimeInMillis();
					
					synchronized(addrMap) {
						for (String ip : addrMap.keySet()) {
							mac = addrMap.get(ip);
							
							if (mac == null) {
								// dynamic arp table ip를 수집했으나 아직 mac이 확인되지 않은 상태 
								
								continue;
							}
							
							if (addrTable.has(ip)) {
								data = addrTable.getJSONObject(ip);
															
								if (data.getString("mac").equals(mac)) {
									data.put("last", now);
									
									continue;
								}
							}
							else {
								addrTable.put(ip, data = new JSONObject());
							}
							
							data.put("from", now)
								.put("last", now)
								.put("mac", mac);
						}
					}
					
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
			// TODO String.format("error index[%d] status : %s", response.getErrorIndex(), response.getErrorStatusText())
		}
	}
	
	public JSONFile getAddrFile() {
		return this.addrFile;
	}
	
	public void test() {
		JSONObject addrMap = this.addrFile.getJSONObject();
		
		if (addrMap.length() == 0) {
			return;
		}
		
		String [] keys = JSONObject.getNames(addrMap);
		JSONObject data;
		String ip;
		String mac;
		byte [] tmp;
		
		
		System.out.println("print address table");
		for (int i=0, _i=keys.length; i<_i; i++) {
			try {
				ip = keys[i];
				data = addrMap.getJSONObject(ip);
				mac = data.getString("mac");
				
				tmp = ip.getBytes();
				System.out.print(String.format("%d.%d.%d.%d >> ", tmp[0] & 0xff, tmp[1] & 0xff, tmp[2] & 0xff, tmp[3] & 0xff));
				tmp = mac.getBytes();
				System.out.println(String.format("%02x-%02x-%02x-%02x-%02x-%02x", tmp[0] & 0xff, tmp[1] & 0xff, tmp[2] & 0xff, tmp[3] & 0xff, tmp[4] & 0xff, tmp[5] & 0xff));
			}
			catch(JSONException jsone) {
				jsone.printStackTrace();
			}
		}
		
		//System.out.println("count of node is "+ this.nodeList.size());
	}
	
	public void run() {
		synchronized(this.nodeList) {
			try {
				for (Node node : this.nodeList) {
					this.snmp.send(pdu, node, node, this);
				}
			} catch (IOException e) {
				// TODO fatal error
				
				e.printStackTrace();
			}
		}
	}
	
	public static void main(String [] args) {
		Manager manager;
		try {
			manager = new Manager();
			
			//Node node =
			//manager.add("127.0.0.1", 161, "public");
			
			boolean more = true;
			while (more) {
				switch(System.in.read()) { 
				case 'd':
					manager.test();
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