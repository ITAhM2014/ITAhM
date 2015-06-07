package com.itahm.request;

import org.json.JSONObject;

import com.itahm.Database;
import com.itahm.SnmpManager;

public class Profile extends Request {

	public Profile(SnmpManager snmp, Database database, JSONObject request) {
		super(snmp, database);
		
		file = database.getFile(Database.FILE.PROFILE);
		
		execute(request);
	}
	
	@Override
	protected JSONObject each(String command, String key, JSONObject value) {
		if ("get".equals(command)) {
			return this.file.get(key);
		}
		else if ("put".equals(command)) {
			this.file.put(key, value);
			
			return value;
		}
		else if ("delete".equals(command)) {
			return this.file.remove(key);
		}
		
		return null;
	}

	@Override
	protected boolean complete() {
		if (this.file.isEmpty()) {
			this.file.put("public", new JSONObject().put("name", "public").put("version", "v2c").put("community", "public"));
			
			return true;
		}
		
		return false;
	}
	
}
