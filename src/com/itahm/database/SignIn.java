package com.itahm.database;

import org.json.JSONException;
import org.json.JSONObject;

public class SignIn extends Database implements Function {

	public SignIn() {
		
	}

	@Override
	public void execute(JSONObject jo) {
		JSONObject database = account.getJSONObject();
		
		jo.put("result", false);
		
		try {
			String username = jo.getString("username");
			
			jo.put("result", database.getJSONObject(username).getString("password").equals(jo.getString("password")));
		}
		catch (JSONException jsone) {
		}
	}

}
