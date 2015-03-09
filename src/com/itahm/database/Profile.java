package com.itahm.database;

import java.io.IOException;

import org.json.JSONObject;

public class Profile extends File {

	public Profile(String path) throws IOException {
		super(path + File.separator + "profile");
		
		if (count() == 0) {
			add();
		}
	}

	private void add() {
		add("public", new JSONObject().put("name", "public").put("version", "v2c").put("community", "public"));
	}
	
	public boolean remove(String name) {
		boolean result = super.remove(name);
		
		if (count() == 0) {
			add();
		}
		
		return result;
	}
	
}
