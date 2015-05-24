package com.itahm.database;

import org.json.JSONObject;

public class Snmp extends Database {

	public Snmp() {
		super(snmp);
		// TODO Auto-generated constructor stub
	}

	@Override
	protected JSONObject each() {
		return get();
	}
	
	@Override
	protected JSONObject each(String command, String key, JSONObject value) {
		JSONObject result = execute(command, key, value);
		
		return result;
	}

	@Override
	protected boolean complete() {
		// TODO Auto-generated method stub
		return false;
	}

}
