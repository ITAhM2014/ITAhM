package com.itahm.request;

import java.io.IOException;

import org.json.JSONObject;

import com.itahm.Database;
import com.itahm.SnmpManager;

public class Profile extends Request {

	public Profile(SnmpManager snmp, Database database, JSONObject request) throws IOException {
		super(snmp, database, request, Database.FILE.PROFILE);
		
		if (this.file.isEmpty()) {
			this.file.put("public", new JSONObject().put("name", "public").put("version", "v2c").put("community", "public"));
			
			this.file.save();
		}
	}
	
	@Override
	protected JSONObject customEach(String command, String key, JSONObject value) {
		if ("delete".equals(command) && "public".equals(key)) {
			return null;
		}
		
		JSONObject result = each(command, key, value);
		
		return result;
	}
	
}
