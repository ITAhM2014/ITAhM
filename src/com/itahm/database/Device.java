package com.itahm.database;

import org.json.JSONException;
import org.json.JSONObject;

public class Device extends Database implements Function {

	public Device() {
	}

	@Override
	public void execute(JSONObject request) {
		try {
			execute(request, device);
		}
		catch (JSONException jsone) {
			
		}
	}	
}