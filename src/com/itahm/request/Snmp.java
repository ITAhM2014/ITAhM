package com.itahm.request;

import org.json.JSONObject;

import com.itahm.Database;
import com.itahm.SnmpManager;

public class Snmp extends Request {

	public Snmp(SnmpManager snmp, Database database, JSONObject request) {
		super(snmp, database);
		
		file = snmp.getFile(SnmpManager.FILE.SNMP);
		
		execute(request);
	}

	@Override
	protected JSONObject each(String command, String key, JSONObject value) {
		return "get".equals(command)? this.file.get(key): null;
	}

	@Override
	protected boolean complete() {
		// TODO Auto-generated method stub
		return false;
	}

}
