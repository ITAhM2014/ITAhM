package com.itahm.request;

import java.io.IOException;
import java.util.Iterator;

import com.itahm.SnmpManager;
import com.itahm.Database;
import com.itahm.json.JSONFile;

import org.json.JSONException;
import org.json.JSONObject;

 // TODO: Auto-generated Javadoc
/**
  * The Class Request.
  */
 abstract public class Request {
	
	/** The file. */
	protected JSONFile file;
	
	/** The database. */
	protected Database database;
	
	/** The snmp. */
	protected SnmpManager snmp;
	
	/**
	 * Instantiates a new request.
	 *
	 * @param snmp the snmp
	 * @param database the database
	 */
	protected Request(SnmpManager snmp, Database database) {
		this.snmp = snmp;
		this.database = database;
	}
	
	/**
	 * Execute.
	 *
	 * @param request the request
	 */
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
	
	/**
	 * Each.
	 *
	 * @param command the command
	 * @param key the key
	 * @param value the value
	 * @return the JSON object
	 */
	abstract protected JSONObject each(String command, String key, JSONObject value);
	
	/**
	 * Complete.
	 *
	 * @return true, if successful
	 */
	abstract protected boolean complete();
	
}
