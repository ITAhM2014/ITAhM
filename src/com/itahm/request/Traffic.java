/*
 * 
 */
package com.itahm.request;

import java.io.File;
import java.util.Map;

import org.json.JSONException;
import org.json.JSONObject;

import com.itahm.Database;
import com.itahm.SnmpManager;
import com.itahm.json.RollingData;

// TODO: Auto-generated Javadoc
/**
 * The Class Traffic.
 */
public class Traffic extends Request {

	/**
	 * Instantiates a new traffic.
	 *
	 * @param snmp the snmp
	 * @param database the database
	 * @param request the request
	 */
	public Traffic(SnmpManager snmp, Database database, JSONObject request) {
		super(snmp, database, request);
	}

	/* (non-Javadoc)
	 * @see com.itahm.request.Request#each(java.lang.String, java.lang.String, org.json.JSONObject)
	 */
	@Override
	protected JSONObject customEach(String command, String key, JSONObject value) {
		if (!"get".equals(command)) {
			return null;
		}
		
		long base;
		int size;
		int index;
		
		try {
			base = value.getLong("base");
			size = value.getInt("size");
			index = value.getInt("index");
		}
		catch (JSONException jsone) {
			jsone.printStackTrace();
			
			return null;
		}
		
		JSONObject result = new JSONObject();
		JSONObject ifInOctets = new JSONObject();
		JSONObject ifOutOctets = new JSONObject();
		File trafficRoot = new File(this.snmp.getRoot(), key);
		String indexString = Integer.toString(index);
		long from = base - (size -1) *60000;
		long date;
		Map<Long, Long> data;
		Long longValue;
		
		result.put("ifInOctets", ifInOctets);
		data = new RollingData(new File(new File(trafficRoot, "ifInOctets"), indexString), from -60000, size +1).build();
		
		for (date = from; date <= base; date += 60000) {
			longValue = data.get(date);
			if (longValue != null) {
				ifInOctets.put(Long.toString(date),  longValue);
			}
		}
		
		result.put("ifOutOctets", ifOutOctets);
		data = new RollingData(new File(new File(trafficRoot, "ifOutOctets"), indexString), from -60000, size +1).build();
		
		for (date = from; date <= base; date += 60000) {
			longValue = data.get(date);
			if (longValue != null) {
				ifOutOctets.put(Long.toString(date), longValue);
			}
		}
		
		return result;
	}
	
}