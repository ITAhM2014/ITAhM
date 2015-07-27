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
import com.itahm.json.RollingFile;
import com.itahm.json.RollingFile.SCALE;
import com.itahm.json.RollingMap.Resource;
import com.itahm.json.RollingMap;

public class Node extends CommunityTarget {

	private static final long serialVersionUID = 7479923177197300424L;
	
	private static final Map<String, Node> nodeList = new HashMap<String, Node>();
	
	private final JSONObject node;
	private final JSONObject hrProcessorEntry;
	private final JSONObject ifEntry;
	private JSONObject ifIndex;
	private final JSONObject hrStorageEntry;
	private JSONObject hrStorageIndex;
	private RollingMap rollingMap;
	
	private final Map<String, Counter> inCounter;
	private final Map<String, Counter> outCounter;
	private final Map<String, Counter> hcInCounter;
	private final Map<String, Counter> hcOutCounter;
	private final Address address;
	
	private long requestTime;
	
	private final EventListener itahm;
	
	private boolean timeOut;
	private int ifAdminStatus;
	
	private Node(EventListener eventListener, File path, JSONObject nodeData) throws IOException {
		String ip;
		File nodeRoot;
		
		if (nodeData.has("ip")) {
			ip = nodeData.getString("ip");
			try {
				InetAddress.getByName(ip);
				
				synchronized(nodeList) {
					nodeList.put(ip, this);
				}
				
				setAddress(new UdpAddress(String.format("%s/%d", ip, nodeData.getInt("udp"))));
				setCommunity(new OctetString(nodeData.getString("community")));
				setVersion(SnmpConstants.version2c);
				setRetries(3);
				setTimeout(3000);
				
				nodeRoot = new File(path, ip);
				nodeRoot.mkdir();
				
				rollingMap = new RollingMap(nodeRoot);
			}
			catch (UnknownHostException uhe) {
				
			}
		}
		
		if (!nodeData.has("hrProcessorEntry")) {
			nodeData.put("hrProcessorEntry", hrProcessorEntry = new JSONObject());
		}
		else {
			hrProcessorEntry = nodeData.getJSONObject("hrProcessorEntry");
		}
		
		if (!nodeData.has("ifEntry")) {
			nodeData.put("ifEntry", ifEntry = new JSONObject());
		}
		else {
			ifEntry = nodeData.getJSONObject("ifEntry");
		}
		
		if (!nodeData.has("ifIndex")) {
			nodeData.put("ifIndex", ifIndex = new JSONObject());
		}
		else {
			ifIndex = nodeData.getJSONObject("ifIndex");
		}
		
		if (!nodeData.has("hrStorageEntry")) {
			nodeData.put("hrStorageEntry", hrStorageEntry = new JSONObject());
		}
		else {
			hrStorageEntry = nodeData.getJSONObject("hrStorageEntry");
		}
		
		if (!nodeData.has("hrStorageIndex")) {
			nodeData.put("hrStorageIndex", hrStorageIndex = new JSONObject());
		}
		else {
			hrStorageIndex = nodeData.getJSONObject("hrStorageIndex");
		}
		
		node = nodeData;
		
		inCounter = new HashMap<String, Counter>();
		outCounter = new HashMap<String, Counter>();
		hcInCounter = new HashMap<String, Counter>();
		hcOutCounter = new HashMap<String, Counter>();
		
		address = new Address();
		
		itahm = eventListener;
		
		timeOut = false;
		ifAdminStatus = 2;
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
		long responseTime = Calendar.getInstance().getTimeInMillis();
		
		this.node.put("lastResponse", responseTime);
		this.node.put("delay", responseTime - this.requestTime);
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
		if (request.startsWith(Constants.system)) {
			if (request.startsWith(Constants.sysDescr) && response.startsWith(Constants.sysDescr)) {
				OctetString value = (OctetString)variable;
				
				this.node.put("sysDescr", new String(value.getValue()));
			}
			else if (request.startsWith(Constants.sysObjectID) && response.startsWith(Constants.sysObjectID)) {
				OID value = (OID)variable;
				
				this.node.put("sysObjectID", value.toDottedString());
			}
			else if (request.startsWith(Constants.sysName) && response.startsWith(Constants.sysName)) {
				OctetString value = (OctetString)variable;
				
				this.node.put("sysName", new String(value.getValue()));
			}
		}
		else if (request.startsWith(Constants.ifEntry)) {
			JSONObject ifData;
			String index = Integer.toString(response.last());
			
			if (!this.ifEntry.has(index)) {
				this.ifEntry.put(index, ifData = new JSONObject());
			}
			else {
				ifData = this.ifEntry.getJSONObject(index);
			}
			
			if (request.startsWith(Constants.ifIndex)) {
				 if(response.startsWith(Constants.ifIndex)) {
					Integer32 value = (Integer32)variable;
					
					ifIndex.put(index, value.getValue());
					
					return true;
				 }
				 else {
					this.node.put("ifIndex", ifIndex);
						
					ifIndex = new JSONObject();
				 }
			}
			else if (request.startsWith(Constants.ifDescr) && response.startsWith(Constants.ifDescr)) {
				OctetString value = (OctetString)variable;
				
				ifData.put("ifDescr", new String(value.getValue()));
				
				return true;
			}
			else if (request.startsWith(Constants.ifType) && response.startsWith(Constants.ifType)) {
				Integer32 value = (Integer32)variable;
				
				ifData.put("ifType", value.getValue());
				
				return true;
			}
			else if (request.startsWith(Constants.ifSpeed) && response.startsWith(Constants.ifSpeed)) {
				Gauge32 value = (Gauge32)variable;
				
				ifData.put("ifSpeed", value.getValue());
				
				return true;
			}
			else if (request.startsWith(Constants.ifPhysAddress) && response.startsWith(Constants.ifPhysAddress)) {
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
			else if (request.startsWith(Constants.ifAdminStatus) && response.startsWith(Constants.ifAdminStatus)) {
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
			else if (request.startsWith(Constants.ifOperStatus) && response.startsWith(Constants.ifOperStatus)) {
				Integer32 value = (Integer32)variable;
				
				ifData.put("ifOperStatus", value.getValue());
				
				return true;
			}
			
			else if (request.startsWith(Constants.ifInOctets) && response.startsWith(Constants.ifInOctets)) {
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
			else if (request.startsWith(Constants.ifOutOctets) && response.startsWith(Constants.ifOutOctets)) {
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
		else if (request.startsWith(Constants.ifXEntry)) {
			JSONObject ifData;
			String index = Integer.toString(response.last());
			
			if (!this.ifEntry.has(index)) {
				this.ifEntry.put(index, ifData = new JSONObject());
			}
			else {
				ifData = this.ifEntry.getJSONObject(index);
			}
			
			if (request.startsWith(Constants.ifName) && response.startsWith(Constants.ifName)) {
				OctetString value = (OctetString)variable;
				
				ifData.put("ifName", new String(value.getValue()));
				
				return true;
			}
			else if (request.startsWith(Constants.ifAlias) && response.startsWith(Constants.ifAlias)) {
				OctetString value = (OctetString)variable;
				
				ifData.put("ifAlias", new String(value.getValue()));
				
				return true;
			}
			else if (request.startsWith(Constants.ifHCInOctets) && response.startsWith(Constants.ifHCInOctets)) {
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
			else if (request.startsWith(Constants.ifHCOutOctets) && response.startsWith(Constants.ifHCOutOctets)) {
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
		else if (request.startsWith(Constants.ipNetToMediaTable)) {
			int [] array = response.getValue();
			int size = array.length;
			
			String ip = String.format("%d.%d.%d.%d", array[size -4], array[size -3], array[size -2], array[size -1]);
			
			if (request.startsWith(Constants.ipNetToMediaType) && response.startsWith(Constants.ipNetToMediaType)) {
				Integer32 value = (Integer32)variable;
				
				if (value.getValue() == 3) {
					address.put(ip);
				}
				
				return true;
			}
			else if (request.startsWith(Constants.ipNetToMediaPhysAddress) && response.startsWith(Constants.ipNetToMediaPhysAddress)) {
				OctetString value = (OctetString)variable;
				byte [] mac = value.getValue();
				if (mac.length == 6) {
					address.put(ip, String.format("%02X-%02X-%02X-%02X-%02X-%02X", mac[0] & 0xff, mac[1] & 0xff, mac[2] & 0xff, mac[3] & 0xff, mac[4] & 0xff, mac[5] & 0xff));
				}
				
				return true;
			}
		}
		else if (request.startsWith(Constants.host)) {
			if (request.startsWith(Constants.hrSystemUptime) && response.startsWith(Constants.hrSystemUptime)) {
				TimeTicks value = (TimeTicks)variable; 
				
				this.node.put("hrSystemUptime", value.toMilliseconds());
			}
			else if (request.startsWith(Constants.hrProcessorLoad) && response.startsWith(Constants.hrProcessorLoad)) {
				Integer32 value = (Integer32)variable;
				String index = Integer.toString(response.last());
				int intValue = value.getValue();
				
				this.hrProcessorEntry.put(index, intValue);
				
				this.rollingMap.put(Resource.HRPROCESSORLOAD, index, intValue);
				
				return true;
			}
			else if (request.startsWith(Constants.hrStorageEntry) && response.startsWith(Constants.hrStorageEntry)) {
				JSONObject storageData;
				String index = Integer.toString(response.last());
				
				if (!this.hrStorageEntry.has(index)) {
					this.hrStorageEntry.put(index, storageData = new JSONObject());
				}
				else {
					storageData = this.hrStorageEntry.getJSONObject(index);
				}
				
				if (request.startsWith(Constants.hrStorageIndex)) {
					if (response.startsWith(Constants.hrStorageIndex)) {
						Integer32 value = (Integer32)variable;
						
						hrStorageIndex.put(index, value.getValue());
						
						return true;
					}
					else {
						this.node.put("hrStorageIndex", hrStorageIndex);
						
						hrStorageIndex = new JSONObject();
					}
				}
				else if (request.startsWith(Constants.hrStorageType) && response.startsWith(Constants.hrStorageType)) {
					OID value = (OID)variable;
					
					if (value.startsWith(Constants.hrStorageTypes)) {
						storageData.put("hrStorageType", value.last());
					}
					
					return true;
				}
				else if (request.startsWith(Constants.hrStorageDescr) && response.startsWith(Constants.hrStorageDescr)) {
					OctetString value = (OctetString)variable;
					
					storageData.put("hrStorageDescr", new String(value.getValue()));
					
					return true;
				}
				else if (request.startsWith(Constants.hrStorageAllocationUnits) && response.startsWith(Constants.hrStorageAllocationUnits)) {
					Integer32 value = (Integer32)variable;
					
					storageData.put("hrStorageAllocationUnits", value.getValue());
					
					return true;
				}
				else if (request.startsWith(Constants.hrStorageSize) && response.startsWith(Constants.hrStorageSize)) {
					Integer32 value = (Integer32)variable;
					
					storageData.put("hrStorageSize", value.getValue());
					
					return true;
				}
				else if (request.startsWith(Constants.hrStorageUsed) && response.startsWith(Constants.hrStorageUsed)) {
					Integer32 value = (Integer32)variable;
					int intValue = value.getValue();
					
					storageData.put("hrStorageUsed", intValue);
					
					if (storageData.has("hrStorageSize")) {
						this.rollingMap.put(Resource.HRSTORAGEUSED, index, (int)Math.round(intValue *(double)100 /storageData.getInt("hrStorageSize")));
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
			
			if (parse(responseVB.getOid(), responseVB.getVariable(), requestVB.getOid())) {
				if (!responseVB.equals(Null.endOfMibView)) {
					nextRequests.add(responseVB);
				}
				else {
					System.out.println("end of mib view.");
				}
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
