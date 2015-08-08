package com.itahm.request;

import org.json.JSONObject;

import com.itahm.Data;
import com.itahm.Database;
import com.itahm.SnmpManager;

public class Address extends Request {

	private final JSONObject data;
	
	public Address(SnmpManager snmp, Database database, JSONObject request) {
		data = Data.getJSONObject(Data.Table.ADDRESS);
		
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
