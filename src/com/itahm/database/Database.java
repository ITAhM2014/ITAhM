package com.itahm.database;

import java.io.File;
import java.io.IOException;
import java.util.Iterator;

import org.json.JSONException;
import org.json.JSONObject;

import com.itahm.ITAhMException;
import com.itahm.json.JSONFile;
import com.itahm.snmp.Manager;

// TODO: Auto-generated Javadoc
/**
 * The Class Database.
 */
abstract public class Database {
	protected static File root;
	
	/** The Constant account. */
	protected final static JSONFile account = new JSONFile();
	
	/** The Constant device. */
	protected final static JSONFile device = new JSONFile();
	
	/** The Constant line. */
	protected final static JSONFile line = new JSONFile();
	
	/** The Constant profile. */
	protected final static JSONFile profile = new JSONFile();
	
	protected final static JSONFile index = new JSONFile();
	
	//protected final static JSONFile icon = new JSONFile();
	
	protected JSONFile file;
	protected static JSONFile address;
	protected static JSONFile snmp;
	
	//protected final JSONObject database;
	protected static Manager snmpManager;
	/**
	 * Instantiates a new database.
	 */
	
	protected Database() {
	}
	
	protected Database(JSONFile jf) {
		file = jf;
		//database = file.getJSONObject();
	}
	
	/**
	 * Inits the.
	 *
	 * @param path the path
	 * @throws IOException Signals that an I/O exception has occurred.
	 */
	public static void init(File path, Manager manager) throws IOException  {
		root = path;
		snmpManager = manager;
		//address = manager.getFile("address");
		//snmp = manager.getFile("snmp");
		
		JSONObject jo;
		
		try {
			account.load(new File(path, "account"));
			
			jo = account.getJSONObject();
			if (jo.length() == 0) {
				jo.put("root", new JSONObject().put("username", "root").put("password", "root"));
				account.save();
			}
			
			index.load(new File(path, "index"));
			jo = index.getJSONObject();
			if (!jo.has("index")) {
				jo.put("index", 1);
			}
			
			profile.load(new File(path, "profile"));
			
			jo = profile.getJSONObject();
			if (jo.length() == 0) {
				jo.put("public", new JSONObject().put("name", "public").put("version", "v2c").put("community", "public"));
				profile.save();
			}
			
			device.load(new File(path, "device"));
			line.load(new File(path, "line"));
			//icon.load(new File(path, "icon"));
		}
		catch (ITAhMException itahme) {
			account.close();
			device.close();
			index.close();
			profile.close();
			
			itahme.printStackTrace();
			
			throw itahme;
		}
	}
	
	protected void load(JSONFile file, String path) throws ITAhMException, IOException {
		file.load(new File(root, path));
	}
	
	protected String newID() throws IOException {
		int numID;
		synchronized(index) {
			JSONObject jo = index.getJSONObject();
			
			numID = jo.getInt("index");
			jo.put("index", numID +1);
			
			index.save();
		}
		
		return Integer.toString(numID);
	}
	
	protected JSONObject execute(String command, String key, JSONObject value) {
		if ("get".equals(command)) {
			return this.file.get(key);
		}
		else if ("put".equals(command)) {
			this.file.put(key, value);
			
			return value;
		}
		else if ("delete".equals(command)) {
			return this.file.remove(key);
		}
		
		return null;
	}
	
	protected JSONObject get() {
		return this.file.get();
	}
	/**
	 * Execute.
	 *
	 * @param request the request
	 * @param file the file
	 * @throws JSONException 
	 * @throws IOException Signals that an I/O exception has occurred (file.save()).
	 */
	
	public void execute(JSONObject request) {
		try {
			String command = request.getString("command");
			
			if (request.isNull("data")) {
				if ("get".equals(command)) {
					request.put("data", each());
				}
			}
			else {
				JSONObject data = request.getJSONObject("data");
				
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
	
	abstract protected JSONObject each();
	abstract protected JSONObject each(String command, String key, JSONObject value);
	abstract protected boolean complete();
	
}
