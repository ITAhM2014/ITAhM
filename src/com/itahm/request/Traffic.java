/*
 * 
 */
package com.itahm.request;

import org.json.JSONException;
import org.json.JSONObject;

import com.itahm.json.RollingMap.Resource;
import com.itahm.snmp.Node;

public class Traffic extends Request {

	public Traffic(JSONObject request) {
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
		int scale = 1;
		
		try {
			base = value.getLong("base");
			size = value.getInt("size");
			index = value.getInt("index");
			
			if (value.has("scale")) {
				scale = value.getInt("scale");
			}
		}
		catch (JSONException jsone) {
			return null;
		}
		
		JSONObject result = new JSONObject();
		Node node = Node.node(key);
		
		if (node == null) {
			return null;
		}
		
		result.put("ifInOctets", node.getJSON(Resource.IFINOCTETS, Integer.toString(index), base, size, scale));
		result.put("ifOutOctets", node.getJSON(Resource.IFOUTOCTETS, Integer.toString(index), base, size, scale));
		
		return result;
	}
	
}