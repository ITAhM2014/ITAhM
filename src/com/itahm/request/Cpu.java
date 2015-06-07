/*
 * 
 */
package com.itahm.request;

import java.io.File;
import java.util.Calendar;
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
public class Cpu extends Request {

	/**
	 * Instantiates a new cpu.
	 *
	 * @param snmp the snmp
	 * @param database the database
	 * @param request the request
	 */
	public Cpu(SnmpManager snmp, Database database, JSONObject request) {
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
		
		long from;
		int size;
		
		try {
			from = value.getLong("from");
			size = value.getInt("size");
		}
		catch (JSONException jsone) {
			jsone.printStackTrace();
			
			return null;
		}
		
		Calendar calendar = Calendar.getInstance();
		JSONObject result = new JSONObject();
		File procRoot = new File(this.snmp.getRoot(), key);
		procRoot = new File(procRoot, "hrProcessorLoad");
		long last;
		long date;
		Map<Long, Long> data;
		JSONObject jo;
		
		calendar.setTimeInMillis(from);
		calendar.set(Calendar.MILLISECOND, 0);
		calendar.set(Calendar.SECOND, 0);
		
		last = from + (size -1) *60000;
		for (File indexRoot : procRoot.listFiles()){
			data = new RollingData(indexRoot, from, size).build();
			jo = new JSONObject();
			result.put(indexRoot.getName(), jo);
			for (date = from; date <= last; date += 60000) {
				jo.put(Long.toString(date), data.get(date));
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