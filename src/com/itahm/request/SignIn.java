package com.itahm.request;

import org.json.JSONObject;

import com.itahm.Database;
import com.itahm.SnmpManager;

public class SignIn extends Request {

	public SignIn(SnmpManager snmp, Database database, JSONObject request) {
		super(snmp, database);
		
		file = database.getFile(Database.FILE.ACCOUNT);
		
		execute(request);
	}
	
	@Override
	protected JSONObject each(String command, String key, JSONObject value) {
		if (!"get".equals(command)) {
			return null;
		}
		
		JSONObject account = this.file.get(key);
		
		if (account != null && value.getString("password").equals(account.getString("password"))) {
			return account;
		}

		return null;
	}
	
	@Override
	protected boolean complete() {
		return false;
	}

}
