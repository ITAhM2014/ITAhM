package com.itahm.database;

import org.json.JSONObject;

public class SignIn extends Database {

	public SignIn(JSONObject jo) {
		super(account);
		
		execute(jo);
	}
	
	@Override
	protected JSONObject each() {
		return get();
	}
	
	@Override
	protected JSONObject each(String command, String key, JSONObject value) {
		if ("get".equals(command)) {
			JSONObject account = execute(command, key, value);
			
			if (account != null &&value.getString("password").equals(account.getString("password"))) {
				return account;
			}
		}

		return null;
	}
	
	@Override
	protected boolean complete() {
		return false;
	}

}
