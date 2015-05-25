package com.itahm.request;

import org.json.JSONObject;

import com.itahm.Database;
import com.itahm.SnmpManager;

public class Account extends Request {

	public Account(SnmpManager snmp, Database database, JSONObject request) {
		super(snmp, database);
		
		file = database.getFile(Database.FILE.ACCOUNT);
		
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
			this.file.put("root", new JSONObject().put("username", "root").put("password", "root"));

			return true;
		}
		
		return false;
	}
	
}
