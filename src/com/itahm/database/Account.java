package com.itahm.database;

import java.io.IOException;

import org.json.JSONObject;

public class Account extends Database implements Function {

	public Account() {
		
	}

	@Override
	public void execute(JSONObject request) {
		execute(request, account);
		
		JSONObject jo = account.getJSONObject();
		if (jo.length() == 0) {
			jo.put("root", new JSONObject().put("username", "root").put("password", "root"));
			
			try {
				account.save();
			}
			catch (IOException ioe) {
				// fatal error
				
				ioe.printStackTrace();
			}
		}
	}
	
}
