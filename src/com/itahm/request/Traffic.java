package com.itahm.request;

import org.json.JSONObject;

import com.itahm.Database;
import com.itahm.SnmpManager;

public class Traffic extends Request {

	public Traffic(SnmpManager snmp, Database database, JSONObject request) {
		super(snmp, database);
		
		file = database.getFile(Database.FILE.DEVICE);
		
		execute(request);
	}

	@Override
	protected JSONObject each(String command, String key, JSONObject value) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	protected boolean complete() {
		// TODO Auto-generated method stub
		return false;
	}
}