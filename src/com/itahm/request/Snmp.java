package com.itahm.request;

import org.json.JSONObject;

import com.itahm.Data;

public class Snmp extends Request {

	private final JSONObject data;
	
	public Snmp(JSONObject request) {
		data = Data.getJSONObject(Data.Table.SNMP);
		
		request(request);
	}

	@Override
	protected JSONObject execute(String command) {
		if (!"get".equals(command)) {
			return null;
		}
		
		return this.data;
	}
	
	@Override
	protected JSONObject execute(String command, String key, JSONObject value) {
		return execute(this.data, command, key, value);
	}
	
}
