package com.itahm.request;

import org.json.JSONObject;

import com.itahm.Database;
import com.itahm.SnmpManager;

public class RealTime extends Request {

	public RealTime(SnmpManager snmp, Database database, JSONObject request) {
		super(snmp, database, request, SnmpManager.FILE.SNMP);
	}

	@Override
	protected JSONObject customEach(String command, String key, JSONObject value) {
		this.snmp.addRealTimeNode(key);
		
		return "get".equals(command)? this.file.get(key): null;
	}
	
}