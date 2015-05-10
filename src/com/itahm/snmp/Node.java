package com.itahm.snmp;

import java.io.File;
import java.io.IOException;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.Calendar;
import java.util.HashMap;
import java.util.Map;
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
import org.snmp4j.smi.UdpAddress;
import org.snmp4j.smi.Variable;
import org.snmp4j.smi.VariableBinding;

import com.itahm.json.RollingFile;

public class Node extends CommunityTarget {

	private static final long serialVersionUID = 7479923177197300424L;
	
	private final JSONObject node;
	private final JSONObject ifEntry;
	private final RollingFile rollFile;
	private final HashMap<String, String> map;
	
	private Node(File path, JSONObject jo) throws IOException {
		String ip = jo.getString("ip");

		InetAddress.getByName(ip);
		
		ifEntry = jo.getJSONObject("ifEntry");
		node = jo;
		rollFile = new RollingFile(path, ip);
		map = new HashMap<String, String>();
		
		setAddress(new UdpAddress(String.format("%s/%d", ip, jo.getInt("udp"))));
		setCommunity(new OctetString(jo.getString("community")));
		setVersion(SnmpConstants.version2c);
		setRetries(0);
		setTimeout(3000);
	}
	
	public final static Node create(File path, JSONObject jo) throws IOException {
		try {
			return new Node(path, jo);
		}
		catch (JSONException | UnknownHostException e) {
			
		}
		
		return null;
	}
	
	/**
	 * Roll.
	 *
	 * @param file the file
	 * @param key the key
	 * @param value the value
	 */
	//private void roll(String key, Object value) {	
	public void roll(String key, Object value) {
		JSONObject jo = rollFile.getJSONObject();
		
		if (jo.has(key)) {
			jo = jo.getJSONObject(key);
		}
		else {
			jo.put(key, jo = new JSONObject());
		}
		
		jo.put(Long.toString(Calendar.getInstance().getTimeInMillis()), value);
	}
	
	/**
	 * Parse.
	 * 
	 * @param node
	 * @param reqest
	 * @param response
	 * @param variable
	 * @return true if next is required
	 */
	public final boolean parse (OID response, Variable variable, OID request) {
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
				
				// TODO rolling 
				value.getValue();
			}
			else if (response.startsWith(Constants.ifOutOctets) && request.startsWith(Constants.ifOutOctets)) {
				Counter32 value = (Counter32)variable;
				
				// TODO rolling
				value.getValue();
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
				
				// TODO rolling
				value.getValue();
			}
			else if (response.startsWith(Constants.ifHCOutOctets) && request.startsWith(Constants.ifHCOutOctets)) {
				Counter64 value = (Counter64)variable;
				
				// TODO rolling
				value.getValue();
			}
			
			return true;
		}
		else if (response.startsWith(Constants.ipNetToMediaTable)) {
			int [] array = response.getValue();
			int size = array.length;
			
			String ip = new String(new byte [] {(byte)array[size -4], (byte)array[size -3], (byte)array[size -2], (byte)array[size -1]});
			
			if (response.startsWith(Constants.ipNetToMediaType) && request.startsWith(Constants.ipNetToMediaType)) {
				Integer32 value = (Integer32)variable;
				
				if (value.getValue() == 3 && !this.map.containsKey(ip)) {
					this.map.put(ip, null);
				}
			}
			else if (response.startsWith(Constants.ipNetToMediaPhysAddress) && request.startsWith(Constants.ipNetToMediaPhysAddress)) {
				OctetString value = (OctetString)variable;
				
				if (this.map.containsKey(ip)) {
					this.map.put(ip, new String(value.getValue()));
				}
			}
			
			return true;
		}
		else {
			
		}
		
		return false;
	}
	
	public final Map<String, String> getAddrTable() {
		return this.map;
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
