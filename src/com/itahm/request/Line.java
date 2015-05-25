package com.itahm.request;

import org.json.JSONObject;

import com.itahm.Database;
import com.itahm.SnmpManager;

public class Line extends Request {
	
	public Line(SnmpManager snmp, Database database, JSONObject request) {
		super(snmp, database);
		
		file = database.getFile(Database.FILE.LINE);
		
		execute(request);
	}
	
	@Override
	public JSONObject each(String command, String key, JSONObject value) {
		if ("get".equals(command)) {
			return this.file.get(key);
		}
		else if ("put".equals(command)) {
			if (Integer.parseInt(key) < 0) {
				int id = database.newID();
				
				if (id < 0) {
					return null;
				}
				
				value.put("id", Integer.toString(id));
			}
			
			this.file.put(key, value);
			
			return value;
		}
		else if ("delete".equals(command)) {
			return this.file.remove(key);
		}
		
		return null;
	}
	
	@Override
	public boolean complete() {
		return false;
	}
	
}