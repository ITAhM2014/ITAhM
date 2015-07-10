package com.itahm.request;

import org.json.JSONObject;

import com.itahm.Database;
import com.itahm.SnmpManager;

public class Line extends Request {
	
	public Line(SnmpManager snmp, Database database, JSONObject request) {
		super(snmp, database, request, Database.FILE.LINE);
	}
	
	@Override
	public JSONObject customEach(String command, String key, JSONObject value) {
		if ("put".equals(command) && Integer.parseInt(key) < 0) {
			int id = database.newID();
				
			if (id < 0) {
				return null;
			}
				
			value.put("id", key = Integer.toString(id));
		}
		
		return each(command, key, value);
	}
}