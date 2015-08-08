/*
 * 
 */
package com.itahm.request;

import org.json.JSONException;
import org.json.JSONObject;

import com.itahm.json.RollingMap.Resource;
import com.itahm.snmp.Node;

public class Memory extends Request {

	public Memory(JSONObject request) {
		request(request);
	}
	
	@Override
	protected JSONObject execute(String command) {
		return null;
	}
	
	@Override
	protected JSONObject execute(String command, String key, JSONObject value) {
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
		
		Node node = Node.node(key);
		
		if (node == null) {
			return null;
		}
		
		return node.getJSON(Resource.HRSTORAGEUSED, Integer.toString(index), base, size);
	}
	
}