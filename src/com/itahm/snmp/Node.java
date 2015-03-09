package com.itahm.snmp;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

import org.json.JSONObject;
import org.snmp4j.CommunityTarget;
import org.snmp4j.mp.SnmpConstants;
import org.snmp4j.smi.OID;
import org.snmp4j.smi.OctetString;
import org.snmp4j.smi.UdpAddress;

public class Node extends CommunityTarget {

	private static final long serialVersionUID = 5353371776537928379L;
	private final Map<OID, Object> map;
	private final String address;
	//private boolean success;
	
	public Node(String ip, int udp, String community) throws UnknownHostException {
		super(new UdpAddress(String.format("%s/%d", ip, udp)), new OctetString(community));
		
		InetAddress.getByName(ip);
		
		address = ip;
		map = new HashMap<OID, Object>();
		
		setVersion(SnmpConstants.version2c);
		setRetries(0);
		setTimeout(1000);
	}

	public static Node create(JSONObject node) {
		try {
			return new Node(node.getString("ip"), node.getInt("udp"), node.getString("community"));
		}
		catch (Exception e) {
			return null;
		}
	}
	
	public Iterator<OID> iterator() {
		return map.keySet().iterator();
	}
	
	public Object get(OID key) {
		return this.map.get(key);
	}
	
	public void set(OID oid, Object value) {
		this.map.put(oid, value);
	}
	
	public String address() {
		return this.address;
	}
	
}
