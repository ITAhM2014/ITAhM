package com.itahm.database;

import java.io.IOException;

import org.json.JSONObject;

public class Device extends File {

	
	public Device(String path) throws IOException {
		super(path + java.io.File.separator + "device");
	}

	public boolean add(String key, JSONObject device) {
		String id = String.format("#%06x", Database.index(true));
		
		device.put("id", id);
		
		return super.add(id, device);
	}	
}