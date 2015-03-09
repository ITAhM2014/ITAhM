package com.itahm.database;

import java.io.IOException;

import org.json.JSONObject;

public class Account extends File {

	public Account(String path) throws IOException {
		super(path + File.separator + "account");
		
		if (count() == 0) {
			add();
		}
	}

	private void add() {
		add("root", new JSONObject().put("username", "root").put("password", "root"));
	}
	
	public boolean add(String username, JSONObject account) {
		if (!account.has("password")) {
			return false;
		}
		
		return super.add(username, account);
	}
	
	public boolean remove(String username) {
		boolean result = super.remove(username);
		
		if (count() == 0) {
			add();
		}
		
		return result;
	}
	
}
