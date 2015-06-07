package com.itahm.snmp;

import java.io.File;
import java.io.IOException;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.Vector;

import org.json.JSONException;
import org.json.JSONObject;
import org.snmp4j.CommunityTarget;
import org.snmp4j.PDU;
import org.snmp4j.mp.SnmpConstants;
import org.snmp4j.smi.Counter32;
import org.snmp4j.smi.Counter64;
import org.snmp4j.smi.Gauge32;
import org.snmp4j.smi.Integer32;
import org.snmp4j.smi.Null;
import org.snmp4j.smi.OID;
import org.snmp4j.smi.OctetString;
import org.snmp4j.smi.TimeTicks;
import org.snmp4j.smi.UdpAddress;
import org.snmp4j.smi.Variable;
import org.snmp4j.smi.VariableBinding;

public class Node extends CommunityTarget {

	private static final long serialVersionUID = 7479923177197300424L;
	
	private final JSONObject node;
	private final JSONObject ifEntry;
	private final JSONObject hrProcessorEntry;
	private final JSONObject hrStorageEntry;
	private final IndexMap ifInOctets;
	private final IndexMap ifOutOctets;
	private final IndexMap hrProcessorLoad;
	private final IndexMap hrStorageUsed;
	
	private final Address address;
	
	private final File nodeRoot;
	
	private Node(File path, JSONObject jo) throws IOException {
		String ip = jo.getString("ip");

		InetAddress.getByName(ip);

		if (!jo.has("ifEntry")) {
			jo.put("ifEntry", new JSONObject());
		}
		ifEntry = jo.getJSONObject("ifEntry");
		
		if (!jo.has("hrProcessorEntry")) {
			jo.put("hrProcessorEntry", new JSONObject());
		}
		hrProcessorEntry = jo.getJSONObject("hrProcessorEntry");
		
		if (!jo.has("hrStorageEntry")) {
			jo.put("hrStorageEntry", new JSONObject());
		}
		hrStorageEntry = jo.getJSONObject("hrStorageEntry");
		
		node = jo;
		
		nodeRoot = new File(path, ip);
		nodeRoot.mkdir();
		
		hrProcessorLoad = new IndexMap(new File(nodeRoot, Constants.HRPROCESSORLOAD));
		ifInOctets = new IndexMap(new File(nodeRoot, Constants.IFINOCTETS));
		ifOutOctets = new IndexMap(new File(nodeRoot, Constants.IFOUTOCTETS));
		hrStorageUsed = new IndexMap(new File(nodeRoot, Constants.HRSTORAGEUSED));
		
		address = new Address();
		
		setAddress(new UdpAddress(String.format("%s/%d", ip, jo.getInt("udp"))));
		setCommunity(new OctetString(jo.getString("community")));
		setVersion(SnmpConstants.version2c);
		setRetries(3);
		setTimeout(3000);
	}
	
	public final static Node create(File path, JSONObject jo) throws IOException {
		try {
			return new Node(path, jo);
		}
		catch (JSONException | UnknownHostException e) {
			e.printStackTrace();
		}
		
		return null;
	}
	
	public void set(String key, Object value) {
		this.node.put(key, value);
	}
	/**
	 * Parse.
	 * 
	 * @param node
	 * @param reqest
	 * @param response
	 * @param variable
	 * @return true if next is required
	 * @throws IOException 
	 */
	public final boolean parse (OID response, Variable variable, OID request) throws IOException {
		if (response.startsWith(Constants.system)) {
			if (response.startsWith(Constants.sysDescr) && request.startsWith(Constants.sysDescr)) {
				OctetString value = (OctetString)variable;
				
				this.node.put("sysDescr", new String(value.getValue()));
			}
			else if (response.startsWith(Constants.sysObjectID) && request.startsWith(Constants.sysObjectID)) {
				OID value = (OID)variable;
				
				this.node.put("sysObjectID", value.toDottedString());
			}
			else if (response.startsWith(Constants.sysName) && request.startsWith(Constants.sysName)) {
				OctetString value = (OctetString)variable;
				
				this.node.put("sysName", new String(value.getValue()));
			}
		}
		else if (response.startsWith(Constants.ifEntry)) {
			JSONObject jo;
			String index = Integer.toString(response.last());
			
			if (!this.ifEntry.has(index)) {
				this.ifEntry.put(index, jo = new JSONObject());
			}
			else {
				jo = this.ifEntry.getJSONObject(index);
			}
			
			if (response.startsWith(Constants.ifDescr) && request.startsWith(Constants.ifDescr)) {
				OctetString value = (OctetString)variable;
				
				jo.put("ifDescr", new String(value.getValue()));
				
				return true;
			}
			else if (response.startsWith(Constants.ifType) && request.startsWith(Constants.ifType)) {
				Integer32 value = (Integer32)variable;
				
				jo.put("ifType", value.getValue());
			}
			else if (response.startsWith(Constants.ifSpeed) && request.startsWith(Constants.ifSpeed)) {
				Gauge32 value = (Gauge32)variable;
				
				jo.put("ifSpeed", value.getValue());
			}
			else if (response.startsWith(Constants.ifPhysAddress) && request.startsWith(Constants.ifPhysAddress)) {
				OctetString value = (OctetString)variable;
				
				jo.put("ifPhysAddress", new String(value.getValue()));
			}
			else if (response.startsWith(Constants.ifAdminStatus) && request.startsWith(Constants.ifAdminStatus)) {
				Integer32 value = (Integer32)variable;
				
				jo.put("ifAdminStatus", value.getValue());
			}
			else if (response.startsWith(Constants.ifOperStatus) && request.startsWith(Constants.ifOperStatus)) {
				Integer32 value = (Integer32)variable;
				
				jo.put("ifOperStatus", value.getValue());
			}
			else if (response.startsWith(Constants.ifInOctets) && request.startsWith(Constants.ifInOctets)) {
				Counter32 value = (Counter32)variable;
				
				ifInOctets.put(index, value.getValue());
			}
			else if (response.startsWith(Constants.ifOutOctets) && request.startsWith(Constants.ifOutOctets)) {
				Counter32 value = (Counter32)variable;
				
				ifOutOctets.put(index, value.getValue());
			}
			
			return true;
		}
		else if (response.startsWith(Constants.ifXEntry)) {
			JSONObject jo;
			String index = Integer.toString(response.last());
			
			if (!this.ifEntry.has(index)) {
				this.ifEntry.put(index, jo = new JSONObject());
			}
			else {
				jo = this.ifEntry.getJSONObject(index);
			}
			
			if (response.startsWith(Constants.ifName) && request.startsWith(Constants.ifName)) {
				OctetString value = (OctetString)variable;
				
				jo.put("ifName", new String(value.getValue()));
			}
			else if (response.startsWith(Constants.ifAlias) && request.startsWith(Constants.ifAlias)) {
				OctetString value = (OctetString)variable;
				
				jo.put("ifAlias", new String(value.getValue()));
			}
			else if (response.startsWith(Constants.ifHCInOctets) && request.startsWith(Constants.ifHCInOctets)) {
				Counter64 value = (Counter64)variable;
				
				ifInOctets.put(index, value.getValue());
			}
			else if (response.startsWith(Constants.ifHCOutOctets) && request.startsWith(Constants.ifHCOutOctets)) {
				Counter64 value = (Counter64)variable;
				
				ifOutOctets.put(index, value.getValue());
			}
			
			return true;
		}
		else if (response.startsWith(Constants.ipNetToMediaTable)) {
			int [] array = response.getValue();
			int size = array.length;
			
			String ip = String.format("%d.%d.%d.%d", array[size -4], array[size -3], array[size -2], array[size -1]);
			
			if (response.startsWith(Constants.ipNetToMediaType) && request.startsWith(Constants.ipNetToMediaType)) {
				Integer32 value = (Integer32)variable;
				
				if (value.getValue() == 3) {
					address.put(ip);
				}
			}
			else if (response.startsWith(Constants.ipNetToMediaPhysAddress) && request.startsWith(Constants.ipNetToMediaPhysAddress)) {
				OctetString value = (OctetString)variable;
				byte [] mac = value.getValue();
				if (mac.length == 6) {
					address.put(ip, String.format("%02X-%02X-%02X-%02X-%02X-%02X", mac[0] & 0xff, mac[1] & 0xff, mac[2] & 0xff, mac[3] & 0xff, mac[4] & 0xff, mac[5] & 0xff));
				}
			}
			
			return true;
		}
		else if (response.startsWith(Constants.host)) {
			if (response.startsWith(Constants.hrSystemUptime) && request.startsWith(Constants.hrSystemUptime)) {
				TimeTicks value = (TimeTicks)variable; 
				
				this.node.put("hrSystemUptime", value.toMilliseconds());
			}
			else if (response.startsWith(Constants.hrProcessorLoad) && request.startsWith(Constants.hrProcessorLoad)) {
				Integer32 value = (Integer32)variable;
				String index = Integer.toString(response.last());
				int intValue = value.getValue();
				
				this.hrProcessorEntry.put(index, intValue);
				
				this.hrProcessorLoad.put(index, intValue);
				
				return true;
			}
			else if (response.startsWith(Constants.hrStorageEntry) && request.startsWith(Constants.hrStorageEntry)) {
				JSONObject jo;
				String index = Integer.toString(response.last());
				
				if (!this.hrStorageEntry.has(index)) {
					this.hrStorageEntry.put(index, jo = new JSONObject());
				}
				else {
					jo = this.hrStorageEntry.getJSONObject(index);
				}
				
				if (response.startsWith(Constants.hrStorageType) && request.startsWith(Constants.hrStorageType)) {
					OID value = (OID)variable;
					
					if (value.startsWith(Constants.hrStorageTypes)) {
						jo.put("hrStorageType", value.last());
					}
				}
				else if (response.startsWith(Constants.hrStorageSize) && request.startsWith(Constants.hrStorageSize)) {
					Integer32 value = (Integer32)variable;
					
					jo.put("hrStorageSize", value.getValue());
				}
				else if (response.startsWith(Constants.hrStorageDescr) && request.startsWith(Constants.hrStorageDescr)) {
					OctetString value = (OctetString)variable;
					
					jo.put("hrStorageDescr", new String(value.getValue()));
				}
				else if (response.startsWith(Constants.hrStorageUsed) && request.startsWith(Constants.hrStorageUsed)) {
					Integer32 value = (Integer32)variable;
					
					this.hrStorageUsed.put(index, value.getValue());
				}
				
				return true;
			}
			
		}
		else {
			
		}
		
		return false;
	}
	
	public final PDU parse(PDU request, PDU response) throws IOException {
		Vector<? extends VariableBinding> requestVBs = request.getVariableBindings();
		Vector<? extends VariableBinding> responseVBs = response.getVariableBindings();
		Vector<VariableBinding> nextRequests = new Vector<VariableBinding>();
		VariableBinding requestVB, responseVB;
		
		for (int i=0, length = responseVBs.size(); i<length; i++) {
			requestVB = (VariableBinding)requestVBs.get(i);
			responseVB = (VariableBinding)responseVBs.get(i);
			
			if (parse(responseVB.getOid(), responseVB.getVariable(), requestVB.getOid()) && !responseVB.equals(Null.endOfMibView)) {
				nextRequests.add(responseVB);
			}
		}

		return nextRequests.size() > 0? new PDU(PDU.GETNEXT, nextRequests): null;
	}
	
}
