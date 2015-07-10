package com.itahm.request;

import java.io.IOException;

import org.json.JSONObject;

import com.itahm.Database;
import com.itahm.SnmpManager;

public class Account extends Request {

	public Account(SnmpManager snmp, Database database, JSONObject request) throws IOException {
		super(snmp, database, request, Database.FILE.ACCOUNT);
		
		if (this.file.isEmpty()) {
			this.file.put("root", new JSONObject().put("username", "root").put("password", "root"));
			
			this.file.save();
		}
	}

	@Override
	protected JSONObject customEach(String command, String key, JSONObject value) {
		JSONObject result = each(command, key, value);
			
		return result;
	}
	
}
