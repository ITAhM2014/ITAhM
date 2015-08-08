package com.itahm.request;

import org.json.JSONObject;

import com.itahm.Data;

public class Account extends Request {

	private final JSONObject data;
	private boolean isRoot = false;
	
	public Account(JSONObject request) {
		data = Data.getJSONObject(Data.Table.ACCOUNT);
		
		request(request);
	}
	
	public Account(JSONObject request, boolean root) {
		this(request);
		
		isRoot = root;
	}
	
	@Override
	protected JSONObject execute(String command) {
		if (!"get".equals(command)) {
			return null;
		}
		
		if (this.isRoot) {
			return this.data;
		}
		
		JSONObject result = new JSONObject();
		String [] keys = JSONObject.getNames(this.data);
		
		for (int i=0, length=keys.length; i<length; i++) {
			result.put(keys[i], JSONObject.NULL);
		}
		
		return result;
	}
	
	@Override
	protected JSONObject execute(String command, String key, JSONObject value) {
		return null;
	}
	
}
