package com.itahm.database;

import org.json.JSONObject;

public class Address extends Database {

	public Address() {
		
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
