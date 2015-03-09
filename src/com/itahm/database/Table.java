package com.itahm.database;

import java.io.Closeable;

import org.json.JSONObject;

public interface Table extends Closeable{

	public boolean add(String key, JSONObject data);
	public boolean set(String key, Object data);
	public boolean remove(String key);
	public JSONObject get();
	public Object get(String key);
	public int count();
	public void roll();
}
