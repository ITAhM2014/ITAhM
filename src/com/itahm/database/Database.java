package com.itahm.database;

import java.io.File;
import java.io.IOException;

import org.json.JSONObject;

import com.itahm.json.JSONFile;

// TODO: Auto-generated Javadoc
/**
 * The Class Database.
 */
public class Database {

	protected static File root;
	
	/** The Constant account. */
	protected final static JSONFile account = new JSONFile();
	
	/** The Constant device. */
	protected final static JSONFile device = new JSONFile();
	
	/** The Constant profile. */
	protected final static JSONFile profile = new JSONFile();
	
	/**
	 * Instantiates a new database.
	 */
	protected Database() {
	}
	
	/**
	 * Inits the.
	 *
	 * @param path the path
	 * @throws IOException Signals that an I/O exception has occurred.
	 */
	public static void init(File path) throws IOException  {
		root = path;
		
		JSONObject jo;
		
		account.load(new File(path, "account"));
		
		jo = account.getJSONObject();
		if (jo.length() == 0) {
			jo.put("root", new JSONObject().put("username", "root").put("password", "root"));
			account.save();
		}
		
		device.load(new File(path, "device"));
		
		profile.load(new File(path, "profile"));
		
		jo = profile.getJSONObject();
		if (jo.length() == 0) {
			jo.put("public", new JSONObject().put("name", "public").put("version", "v2c").put("community", "public"));
			profile.save();
		}
	}
	
	/**
	 * Execute.
	 *
	 * @param request the request
	 * @param file the file
	 * @throws IOException Signals that an I/O exception has occurred (file.save()).
	 */
	protected void execute(JSONObject request, JSONFile file) {
		JSONObject database = file.getJSONObject();
		
		request.put("result", false);
		
		String command = request.getString("command");
		
		if ("get".equals(command)) {
			if (request.has("key")) {
				// get selected data
				
				request.put("result", database.getJSONObject(request.getString("key")));
			}
			else {
				// get entire data
				
				request.put("result", database);
			}
		}
		else {
			if ("put".equals(command)) {
				database.put(request.getString("key"), request.getJSONObject("value"));
				
				request.put("result", true);
			}
			else if ("delete".equals(command)) {
				if (database.remove(request.getString("key")) != null) {
					request.put("result", true);
				}
			}
			
			try {
				file.save();
			} catch (IOException ioe) {
				ioe.printStackTrace();
				
				// fatal error
			}

		}
	}
}
