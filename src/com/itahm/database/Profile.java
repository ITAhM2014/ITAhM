package com.itahm.database;

import java.io.IOException;

import org.json.JSONObject;

public class Profile extends Database {

	public Profile() throws IOException {
		super(profile);
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
			this.file.put("public", new JSONObject().put("name", "public").put("version", "v2c").put("community", "public"));
			
			return true;
		}
		
		return false;
	}
	
}
