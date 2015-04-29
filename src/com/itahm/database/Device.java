package com.itahm.database;

import java.io.IOException;

import org.json.JSONObject;

public class Device extends Database {
	
	public Device() {
		super(device);
	}
	
	@Override
	public JSONObject each(String command, String key, JSONObject value) {
		try {
			if ("put".equals(command) && Integer.parseInt(key) < 0) {
				key = newID();
				value.put("id", key);
			}
		
			return execute(command, key, value);
		}
		catch(NumberFormatException nfe) {
			
		} catch (IOException e) {
			e.printStackTrace();
			
			// fatal error
		}
		
		return null;
	}
	
	@Override
	public boolean complete() {
		return false;
	}	
}