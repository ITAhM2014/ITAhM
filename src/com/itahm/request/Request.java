package com.itahm.request;

import java.io.IOException;
import java.util.Iterator;

import com.itahm.SnmpManager;
import com.itahm.Database;
import com.itahm.json.JSONFile;

import org.json.JSONException;
import org.json.JSONObject;

 abstract public class Request {
	
	protected JSONFile file;
	protected Database database;
	protected SnmpManager snmp;
	
	protected Request(SnmpManager snmp, Database database) {
		this.snmp = snmp;
		this.database = database;
	}
	
	protected void execute(JSONObject request) {
		try {
			String command = request.getString("command");
			JSONObject data;
			
			if (request.isNull("data")) {
				if ("get".equals(command)) {
					data = this.file.get();
					
					request.put("data", data == null? JSONObject.NULL: data);
				}
			}
			else {
				data = request.getJSONObject("data");
				
				@SuppressWarnings("rawtypes")
				Iterator it = data.keys();
				String key;
				JSONObject value;
				
				while (it.hasNext()) {
					key = (String)it.next();
					value = each(command, key, data.isNull(key)? null: data.getJSONObject(key));
					
					data.put(key, value == null? JSONObject.NULL: value);
				}
				
				if ("put".equals(command) || "delete".equals(command) || complete()) {
					try {
						this.file.save();
					} catch (IOException ioe) {
						ioe.printStackTrace();
						
						// fatal error
					}
				}
			}
		}
		catch (JSONException jsone) {
			jsone.printStackTrace();
		}
	}
	
	abstract protected JSONObject each(String command, String key, JSONObject value);
	abstract protected boolean complete();
	
}
