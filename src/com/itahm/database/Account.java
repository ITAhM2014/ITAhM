package com.itahm.database;

import org.json.JSONObject;

public class Account extends Database {

	public Account() {
		super(account);
	}

	@Override
	protected JSONObject each() {
		return get();
	}
	
	@Override
	protected JSONObject each(String command, String key, JSONObject value) {
		return execute(command, key, value);
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
