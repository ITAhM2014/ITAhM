package com.itahm.database;

import org.json.JSONObject;

public class Cpu extends Database {

	public Cpu(JSONObject jo) {
		super(account);
		
		execute(jo);
	}

	@Override
	protected JSONObject each(String command, String key, JSONObject value) {
		return execute(command, key, value);
	}

	@Override
	protected boolean complete() {
		// TODO Auto-generated method stub
		return false;
	}	
}