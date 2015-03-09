package com.itahm.database;

import java.io.IOException;

import org.json.JSONObject;

public class Database {

	private final Account account;
	private final Profile profile;
	private final Device device;
	private final Line line;
	private static Index index;
	
	private enum Tables {
		account,
		profile,
		device,
		line
	};
	
	public Database(String root) throws IOException {
		String deviceRoot = root + File.separator + "device";
		
		account = new Account(root);
		
		profile = new Profile(root);
		
		new java.io.File(deviceRoot).mkdir();
		device = new Device(deviceRoot);
		
		line = new Line(root);
		
		index = new Index(root);
	}

	/*
	 * PUBLIC
	 */
	
	public void save() throws IOException  {
		
	}
	
	public static int index(boolean device) {
		return device? index.device(): index.line();
	}
	
	public boolean add(String tableName, String key, JSONObject data) {
		return table(tableName).add(key, data);
	}
	
	public boolean set(String tableName, String key, JSONObject data) {
		return table(tableName).set(key, data);
	}

	public boolean set(String tableName, String key, String data) {
		return table(tableName).set(key, data);
	}

	public boolean remove(String tableName, String key) {
		return table(tableName).remove(key);
	}
	
	public JSONObject get(String tableName) {
		return table(tableName).get();
	}
	
	public Object get(String tableName, String key) {
		return table(tableName).get(key);
	}
	
	public Table table (String tableName) {
		switch (Tables.valueOf(tableName)) {
			
		case account:
			return this.account;
		
		case profile:
			return this.profile;
			
		case device:
			return this.device;
						
		case line:
			return this.line;
			
		default:
			return null;
		}
	}
	
}
