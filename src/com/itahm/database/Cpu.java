package com.itahm.database;

import org.json.JSONObject;

public class Cpu extends Database implements Function {

	public Cpu() {
	}

	@Override
	public void execute(JSONObject request) {
		execute(request, device);
	}	
}