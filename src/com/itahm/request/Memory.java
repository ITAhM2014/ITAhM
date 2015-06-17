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
 * The Class Cpu.
 */
public class Memory extends Request {

	/**
	 * Instantiates a new memory.
	 *
	 * @param snmp the snmp
	 * @param database the database
	 * @param request the request
	 */
	public Memory(SnmpManager snmp, Database database, JSONObject request) {
		super(snmp, database);
		
		execute(request);
	}
	
	/**
	 * Each.
	 *
	 * @param command the command
	 * @param key ip address
	 * @param value.base base date
	 * @param value.duration peroid to get data
	 * @param value.size graph width in pixel
	 * @return the JSON object
	 */
	@Override
	protected JSONObject each(String command, String key, JSONObject value) {
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
		File memRoot = new File(this.snmp.getRoot(), key);
		memRoot = new File(memRoot, "hrStorageUsed");
		JSONObject node = this.snmp.get(key);
		String indexString = Integer.toString(index);
		long from;
		long date;
		Map<Long, Long> data;
		int unit = node.getJSONObject("hrStorageEntry").getJSONObject(indexString).getInt("hrStorageAllocationUnits");
		Long longValue;
		
		from = base - (size -1) *60000;
		
		data = new RollingData(new File(memRoot, indexString), from, size).build();
		
		for (date = from; date <= base; date += 60000) {
			longValue = data.get(date);
			if (longValue != null) {
				result.put(Long.toString(date),  longValue * unit /1024 /1024);
			}
		}
		
		return result;
	}

	/* (non-Javadoc)
	 * @see com.itahm.request.Request#complete()
	 */
	@Override
	protected boolean complete() {
		// TODO Auto-generated method stub
		return false;
	}	
}