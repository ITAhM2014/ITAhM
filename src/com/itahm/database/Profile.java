package com.itahm.database;

import java.io.IOException;

import org.json.JSONObject;

public class Profile extends Database implements Function {

	public Profile() throws IOException {
	}

	@Override
	public void execute(JSONObject request) {
		execute(request, profile);
		
		JSONObject jo = profile.getJSONObject();
		
		if (jo.length() == 0) {
			jo.put("public", new JSONObject().put("name", "public").put("version", "v2c").put("community", "public"));
			
			try {
				profile.save();
			}
			catch (IOException ioe) {
				// fatal error
				
				ioe.printStackTrace();
			}
		}
	}
	
}
