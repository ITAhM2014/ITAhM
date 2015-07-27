package com.itahm;

import java.io.Closeable;
import java.io.File;
import java.io.IOException;

import org.json.JSONObject;

import com.itahm.json.JSONFile;

// TODO: Auto-generated Javadoc
/**
 * The Class Database.
 */
public class Database implements Closeable {
	private final File root;
	
	private final JSONFile account;
	
	private final JSONFile profile;
	
	private final JSONFile device;
	
	private final JSONFile line;
	
	private final JSONFile index;
	
	public static enum FILE {
		ACCOUNT, PROFILE, DEVICE, LINE
	}
	/**
	 * Instantiates a new database.
	 * @throws ITAhMException 
	 */
	
	public Database(File itahmRoot) throws IOException, ITAhMException{
		root = itahmRoot;
		
		account = new JSONFile();
		try {
			account.load(new File(root, "account"));
			if (account.isEmpty()) {
				account.put("root", new JSONObject().put("username", "root").put("password", "root"));
				account.save();
			}
		}
		catch(ITAhMException itahme) {
			account.close();
			
			throw itahme;
		}
			
		profile = new JSONFile();
		try {
			profile.load(new File(root, "profile"));
			if (profile.isEmpty()) {
				profile.put("public", new JSONObject().put("name", "public").put("version", "v2c").put("community", "public"));
				profile.save();
			}
		}
		catch(ITAhMException itahme) {
			profile.close();
			
			throw itahme;
		}
		
		device = new JSONFile();
		try {
			device.load(new File(root, "device"));
			if (device.isEmpty()) {
				device.put("0", new JSONObject()
					.put("id", "0")
					.put("address", "127.0.0.1")
					.put("x", 0).put("y", 0)
					.put("name", "localhost")
					.put("snmp", true)
					.put("profile", "public")
					.put("type", "server")
					);
				
				device.save();
			}
		}
		catch(ITAhMException itahme) {
			device.close();
			
			throw itahme;
		}
		
		line = new JSONFile();
		try {
			line.load(new File(root, "line"));
		}
		catch(ITAhMException itahme) {
			line.close();
			
			throw itahme;
		}
		
		index = new JSONFile();
		try {
			index.load(new File(root, "index"));
			if (index.isEmpty()) {
				index.put("index", 1);
				index.save();
			}
		}
		catch(ITAhMException itahme) {
			index.close();
			
			throw itahme;
		}
	}
	
	public int newID() {
		int numID = -1;
		
		synchronized(index) {
			JSONObject jo = index.getJSONObject();
			
			numID = jo.getInt("index");
			jo.put("index", numID +1);
			
			try {
				index.save();
			} catch (IOException e) {
				e.printStackTrace();
				
				// TODO fatal error
			}
		}
		
		return numID;
	}
	
	public JSONFile getFile(FILE name) {
		switch (name) {
		case ACCOUNT:
			return this.account;
			
		case PROFILE:
			
			return this.profile;
		case DEVICE:
	
			return this.device;
		case LINE:
	
			return this.line;
		}
		
		return null;
	}
	
	@Override
	public void close() {
		try {
			this.account.close();
		} catch (IOException e) {
			e.printStackTrace();
		}
		
		try {
			this.profile.close();
		} catch (IOException e) {
			e.printStackTrace();
		}
		
		try {
			this.device.close();
		} catch (IOException e) {
			e.printStackTrace();
		}
		
		try {
			this.line.close();
		} catch (IOException e) {
			e.printStackTrace();
		}
		
		try {
			this.index.close();
		} catch (IOException e) {
			e.printStackTrace();
		}
	}
}
