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
import org.snmp4j.smi.TimeTicks;
import org.snmp4j.smi.UdpAddress;
import org.snmp4j.smi.Variable;
import org.snmp4j.smi.VariableBinding;

import com.itahm.EventListener;
import com.itahm.ITAhMException;
import com.itahm.json.RollingFile;
import com.itahm.json.RollingFile.SCALE;
import com.itahm.json.RollingMap.Resource;
import com.itahm.json.RollingMap;

public class Node extends CommunityTarget {

	private static final long serialVersionUID = 7479923177197300424L;
	
	private static final Map<String, Node> nodeList = new HashMap<String, Node>();
	
	private final JSONObject node;
	private final JSONObject ifEntry;
	//private final JSONObject hrProcessorEntry;
	private final JSONObject hrStorageEntry;
	
	private final RollingMap rollingMap;
	
	private final Map<String, Counter> inCounter;
	private final Map<String, Counter> outCounter;
	private final Map<String, Counter> hcInCounter;
	private final Map<String, Counter> hcOutCounter;
	private final Address address;
	
	private final File nodeRoot;
	
	private long requestTime;
	
	private final EventListener itahm;
	
	private boolean timeOut;
	private int ifAdminStatus;
	
	private Node(EventListener eventListener, File path, JSONObject nodeData) throws IOException {
		if (!nodeData.has("ip") || !nodeData.has("profile")) {
			throw new ITAhMException();
		}
		
		String ip = nodeData.getString("ip");

		InetAddress.getByName(ip);

		if (!nodeData.has("ifEntry")) {
			nodeData.put("ifEntry", ifEntry = new JSONObject());
		}
		else {
			ifEntry = nodeData.getJSONObject("ifEntry");
		}
		
		if (!nodeData.has("hrStorageEntry")) {
			nodeData.put("hrStorageEntry", hrStorageEntry = new JSONObject());
		}
		else {
			hrStorageEntry = nodeData.getJSONObject("hrStorageEntry");
		}
		
		node = nodeData;
		
		nodeRoot = new File(path, ip);
		nodeRoot.mkdir();
		
		rollingMap = new RollingMap(nodeRoot);
		
		inCounter = new HashMap<String, Counter>();
		outCounter = new HashMap<String, Counter>();
		hcInCounter = new HashMap<String, Counter>();
		hcOutCounter = new HashMap<String, Counter>();
		
		address = new Address();
		
		setAddress(new UdpAddress(String.format("%s/%d", ip, nodeData.getInt("udp"))));
		setCommunity(new OctetString(nodeData.getString("community")));
		setVersion(SnmpConstants.version2c);
		setRetries(3);
		setTimeout(3000);
		
		itahm = eventListener;
		
		timeOut = false;
		ifAdminStatus = 2;
		
		synchronized(nodeList) {
			nodeList.put(ip, this);
		}
	}
	
	public final static Node create(EventListener eventListener, File path, JSONObject nodeData) throws IOException {
		try {
			return new Node(eventListener, path, nodeData);
		}
		catch (JSONException | UnknownHostException e) {
			e.printStackTrace();
		}
		
		return null;
	}
	
	public String getIPAddress() {
		return this.node.getString("ip");
	}
	
	public void timeOut() {
		if (!this.timeOut) {
			this.node.put("timeout", Calendar.getInstance().getTimeInMillis());
			
			/**
			 * onEvent 구현할것.
			 */
			this.itahm.onEvent();
		}
	}
	
	public void setRequestTime(long requestTime) {
		this.requestTime = requestTime;
	}
	
	public void setResponseTime() {
		this.node.put("delay", Calendar.getInstance().getTimeInMillis() - this.requestTime);
		this.node.put("timeout", -1);
	}
	
	/**
	 * Parse.
	 * 
	 * @param response
	 * @param variable
	 * @param reqest
	 * @return true get-next가 계속 진행되는 경우
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
			JSONObject ifData;
			String index = Integer.toString(response.last());
			
			if (!this.ifEntry.has(index)) {
				this.ifEntry.put(index, ifData = new JSONObject());
			}
			else {
				ifData = this.ifEntry.getJSONObject(index);
			}
			
			if (response.startsWith(Constants.ifIndex) && request.startsWith(Constants.ifIndex)) {
				Integer32 value = (Integer32)variable;
				
				ifData.put("ifIndex", value.getValue());
				
				return true;
			}
			else if (response.startsWith(Constants.ifDescr) && request.startsWith(Constants.ifDescr)) {
				OctetString value = (OctetString)variable;
				
				ifData.put("ifDescr", new String(value.getValue()));
				
				return true;
			}
			else if (response.startsWith(Constants.ifType) && request.startsWith(Constants.ifType)) {
				Integer32 value = (Integer32)variable;
				
				ifData.put("ifType", value.getValue());
				
				return true;
			}
			else if (response.startsWith(Constants.ifSpeed) && request.startsWith(Constants.ifSpeed)) {
				Gauge32 value = (Gauge32)variable;
				
				ifData.put("ifSpeed", value.getValue());
				
				return true;
			}
			else if (response.startsWith(Constants.ifPhysAddress) && request.startsWith(Constants.ifPhysAddress)) {
				OctetString value = (OctetString)variable;
				
				ifData.put("ifPhysAddress", new String(value.getValue()));
				
				return true;
			}
			
			/**
			 * ifAdminStatus
			 * 1: "up"
			 * 2: "down",
			 * 3: "testing"
			 */
			else if (response.startsWith(Constants.ifAdminStatus) && request.startsWith(Constants.ifAdminStatus)) {
				Integer32 value = (Integer32)variable;
				int status = value.getValue();
				
				if (status != this.ifAdminStatus) {
					// TODO onEvent 완성할것
					this.itahm.onEvent();
				}
				
				ifData.put("ifAdminStatus", status);
				
				return true;
			}
			
			/**
			 * ifOperStatus
			 * 1: "up",
			 *	2: "down",
			 *	3: "testing",
			 *	4: "unknown",
			 *	5: "dormant",
			 *	6: "notPresent",
			 *	7: "lowerLayerDown"
			 */
			else if (response.startsWith(Constants.ifOperStatus) && request.startsWith(Constants.ifOperStatus)) {
				Integer32 value = (Integer32)variable;
				
				ifData.put("ifOperStatus", value.getValue());
				
				return true;
			}
			
			else if (response.startsWith(Constants.ifInOctets) && request.startsWith(Constants.ifInOctets)) {
				Counter32 value = (Counter32)variable;
				long longValue = value.getValue() *8;
				Counter inCounter = 	this.inCounter.get(index);
				
				if (inCounter == null) {
					this.inCounter.put(index, new Counter(longValue));
				}
				else {
					ifData.put("ifInOctets", longValue = inCounter.count(longValue));
				}
				
				if (ifData.has("ifSpeed")) {
					this.rollingMap.put(Resource.IFINOCTETS, index, Math.round(longValue *(double)100 / ifData.getLong("ifSpeed")));
				}
				
				return true;
			}
			else if (response.startsWith(Constants.ifOutOctets) && request.startsWith(Constants.ifOutOctets)) {
				Counter32 value = (Counter32)variable;
				long longValue = value.getValue() *8;
				Counter outCounter = 	this.outCounter.get(index);
				
				if (outCounter == null) {
					this.outCounter.put(index, new Counter(longValue));
				}
				else {
					ifData.put("ifOutOctets", longValue = outCounter.count(longValue));
				}
				
				if (ifData.has("ifSpeed")) {
					this.rollingMap.put(Resource.IFOUTOCTETS, index, Math.round(longValue *(double)100 / ifData.getLong("ifSpeed")));
				}
				
				return true;
			}
		}
		else if (response.startsWith(Constants.ifXEntry)) {
			JSONObject ifData;
			String index = Integer.toString(response.last());
			
			if (!this.ifEntry.has(index)) {
				this.ifEntry.put(index, ifData = new JSONObject());
			}
			else {
				ifData = this.ifEntry.getJSONObject(index);
			}
			
			if (response.startsWith(Constants.ifName) && request.startsWith(Constants.ifName)) {
				OctetString value = (OctetString)variable;
				
				ifData.put("ifName", new String(value.getValue()));
				
				return true;
			}
			else if (response.startsWith(Constants.ifAlias) && request.startsWith(Constants.ifAlias)) {
				OctetString value = (OctetString)variable;
				
				ifData.put("ifAlias", new String(value.getValue()));
				
				return true;
			}
			else if (response.startsWith(Constants.ifHCInOctets) && request.startsWith(Constants.ifHCInOctets)) {
				Counter64 value = (Counter64)variable;
				long longValue = value.getValue() *8;
				Counter hcInCounter = 	this.hcInCounter.get(index);
				
				if (hcInCounter == null) {
					this.hcInCounter.put(index, new Counter(longValue));
				}
				else {
					ifData.put("ifHCInOctets", longValue = hcInCounter.count(longValue));
				}
				
				if (ifData.has("ifSpeed")) {
					this.rollingMap.put(Resource.IFINOCTETS, index, Math.round(longValue *(double)100 / ifData.getLong("ifSpeed")));
				}
				
				return true;
			}
			else if (response.startsWith(Constants.ifHCOutOctets) && request.startsWith(Constants.ifHCOutOctets)) {
				Counter64 value = (Counter64)variable;
				long longValue = value.getValue() *8;
				Counter hcOutCounter = 	this.hcOutCounter.get(index);
				
				if (hcOutCounter == null) {
					this.hcOutCounter.put(index, new Counter(longValue));
				}
				else {
					ifData.put("ifHCOutOctets", longValue = hcOutCounter.count(longValue));
				}
				
				if (ifData.has("ifSpeed")) {
					this.rollingMap.put(Resource.IFOUTOCTETS, index, Math.round(longValue *(double)100 / ifData.getLong("ifSpeed")));
				}
				
				return true;
			}
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
				
				return true;
			}
			else if (response.startsWith(Constants.ipNetToMediaPhysAddress) && request.startsWith(Constants.ipNetToMediaPhysAddress)) {
				OctetString value = (OctetString)variable;
				byte [] mac = value.getValue();
				if (mac.length == 6) {
					address.put(ip, String.format("%02X-%02X-%02X-%02X-%02X-%02X", mac[0] & 0xff, mac[1] & 0xff, mac[2] & 0xff, mac[3] & 0xff, mac[4] & 0xff, mac[5] & 0xff));
				}
				
				return true;
			}
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
				
				//this.hrProcessorEntry.put(index, intValue);
				
				this.rollingMap.put(Resource.HRPROCESSORLOAD, index, intValue);
				//this.hrProcessorLoad.put(index, intValue);
				
				return true;
			}
			else if (response.startsWith(Constants.hrStorageEntry) && request.startsWith(Constants.hrStorageEntry)) {
				JSONObject storageData;
				String index = Integer.toString(response.last());
				
				if (!this.hrStorageEntry.has(index)) {
					this.hrStorageEntry.put(index, storageData = new JSONObject());
				}
				else {
					storageData = this.hrStorageEntry.getJSONObject(index);
				}
				
				if (response.startsWith(Constants.hrStorageType) && request.startsWith(Constants.hrStorageType)) {
					OID value = (OID)variable;
					
					if (value.startsWith(Constants.hrStorageTypes)) {
						storageData.put("hrStorageType", value.last());
					}
					
					return true;
				}
				else if (response.startsWith(Constants.hrStorageDescr) && request.startsWith(Constants.hrStorageDescr)) {
					OctetString value = (OctetString)variable;
					
					storageData.put("hrStorageDescr", new String(value.getValue()));
					
					return true;
				}
				else if (response.startsWith(Constants.hrStorageAllocationUnits) && request.startsWith(Constants.hrStorageAllocationUnits)) {
					Integer32 value = (Integer32)variable;
					
					storageData.put("hrStorageAllocationUnits", value.getValue());
					
					return true;
				}
				else if (response.startsWith(Constants.hrStorageSize) && request.startsWith(Constants.hrStorageSize)) {
					Integer32 value = (Integer32)variable;
					
					storageData.put("hrStorageSize", value.getValue());
					
					return true;
				}
				else if (response.startsWith(Constants.hrStorageUsed) && request.startsWith(Constants.hrStorageUsed)) {
					Integer32 value = (Integer32)variable;
					
					if (storageData.has("hrStorageSize")) {
						this.rollingMap.put(Resource.HRSTORAGEUSED, index, (int)Math.round(value.getValue() *(double)100 /storageData.getInt("hrStorageSize")));
					}
					
					return true;
				}
			}
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
	
	public JSONObject getJSON(Resource resource, String index, long base, int size, int intScale) {
		SCALE scale;
		
		if (intScale == 1) {
			return getJSON(resource, index, base, size);
		}
		else if (intScale == 2) {
			scale = SCALE.MINUTE5;
		}
		else {
			scale = SCALE.HOUR6;
		}
		
		RollingFile rollingFile = this.rollingMap.getFile(resource, index);
		
		if (rollingFile == null) {
			return null;
		}
		
		return rollingFile.getData(base, size, scale, "avg");
	}
	
	public JSONObject getJSON(Resource resource, String index, long base, int size) {
		RollingFile rollingFile = this.rollingMap.getFile(resource, index);
		
		if (rollingFile != null) {
			return rollingFile.getData(base, size);
		}
		
		return null;
	}
	
	public static Node node(String ip) {
		return nodeList.get(ip);
	}
}
