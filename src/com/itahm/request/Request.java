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
	
	protected boolean save = false;
	
	/**
	 * Instantiates a new request.
	 *
	 * @param snmp the snmp
	 * @param database the database
	 */
	protected Request(SnmpManager snmp, Database database, JSONObject request, Database.FILE file) {
		this(snmp, database);
		
		this.file = database.getFile(file);
		
		execute(request);
	}
	
	protected Request(SnmpManager snmp, Database database, JSONObject request, SnmpManager.FILE file) {
		this(snmp, database);
		
		this.file = snmp.getFile(file);
		
		execute(request);
	}
	
	protected Request(SnmpManager snmp, Database database, JSONObject request) {
		this(snmp, database);
		
		execute(request);
	}
	
	protected Request(SnmpManager snmp, Database database) {
		this.snmp = snmp;
		this.database = database;
	}
	
	/**
	 * Execute.
	 *
	 * @param request the request
	 */
	private void execute(JSONObject request) {
		try {
			String command = request.getString("command");
			JSONObject data;
			
			if (request.isNull("data")) {
				if ("get".equals(command)) {
					data = this.file.getJSONObject();
					
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
					value = customEach(command, key, data.isNull(key)? null: data.getJSONObject(key));
					
					data.put(key, value == null? JSONObject.NULL: value);
				}
				
				if (this.save) {
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
		catch (Exception e) {
			e.printStackTrace();
		}
	}
	
	protected JSONObject each(String command, String key, JSONObject value) {
		JSONObject result = null;
		
		if ("get".equals(command)) {
			return this.file.get(key);
		}
		
		if ("put".equals(command)) {
			this.file.put(key, value);
			
			result = value;
		}
		else if ("delete".equals(command)) {
			result = this.file.remove(key);
		}
		
		this.save = true;
		
		return result;
	}
	
	/**
	 * customEach.
	 *
	 * @param command the command
	 * @param key the key
	 * @param value the value
	 * @return the JSON object
	 */
	abstract protected JSONObject customEach(String command, String key, JSONObject value);
}
