package com.itahm.database;

import java.io.IOException;

import org.json.JSONObject;

public class Line extends File {

	
	public Line(String path) throws IOException {
		super(path + java.io.File.separator + "line");
	}

	public boolean add(String key, JSONObject line) {
		String id = String.format("#%06x", Database.index(false) | 0x800000);
		
		line.put("id", id);
		
		return super.add(id, line);
	}	
}