/*
 * 
 */
package com.itahm.request;

import org.json.JSONException;
import org.json.JSONObject;

import com.itahm.Database;
import com.itahm.SnmpManager;
import com.itahm.json.RollingMap.Resource;
import com.itahm.snmp.Node;

// TODO: Auto-generated Javadoc
/**
 * The Class Cpu.
 */
public class Processor extends Request {

	/**
	 * Instantiates a new cpu.
	 *
	 * @param snmp the snmp
	 * @param database the database
	 * @param request the request
	 */
	public Processor(SnmpManager snmp, Database database, JSONObject request) {
		super(snmp, database, request);
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
	protected JSONObject customEach(String command, String key, JSONObject value) {
		if (!"get".equals(command)) {
			return null;
		}
		
		long base;
		int size;
		int index;
		int scale;
		
		try {
			base = value.getLong("base");
			size = value.getInt("size");
			index = value.getInt("index");
			
			if (value.has("scale")) {
				scale = value.getInt("scale");
			}
			else {
				scale = 1;
			}
		}
		
		catch (JSONException jsone) {
			jsone.printStackTrace();
			
			return null;
		}
		
		Node node = Node.node(key);
		
		if (node == null) {
			return null;
		}
		
		JSONObject jo = node.getJSON(Resource.HRPROCESSORLOAD, Integer.toString(index), base, size, scale);
		
		return jo;
	}
	
}