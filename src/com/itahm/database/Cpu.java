package com.itahm.database;

import java.io.File;

import org.json.JSONObject;

import com.itahm.ITAhMException;
import com.itahm.json.JSONFile;

public class Cpu extends Database {

	private final File snmp;
	
	public Cpu() {
		snmp = new File(root, "snmp");
	}

	@Override
	protected JSONObject each() {
		return get();
	}
	
	@Override
	protected JSONObject each(String command, String key, JSONObject value) {
		File dir = new File(snmp, key + File.separator + "cpu" + File.separator + value.getString("date").replace("-", File.separator));
		JSONObject result = null;
		
		if (dir.isDirectory()) {
			result = new JSONObject();
			
			for (File file : dir.listFiles()) {
				try {
					result.put(file.getName(), JSONFile.getJSONObject(file));
				} catch (ITAhMException itahme) {
					itahme.printStackTrace();
					return null;
				}
			}
		}
		
		return result;
	}

	@Override
	protected boolean complete() {
		// TODO Auto-generated method stub
		return false;
	}	
}