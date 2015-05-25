package com.itahm.request;

import java.io.File;

import org.json.JSONObject;

import com.itahm.Database;
import com.itahm.ITAhMException;
import com.itahm.SnmpManager;
import com.itahm.json.JSONFile;

public class Cpu extends Request {

	public Cpu(SnmpManager snmp, Database database, JSONObject request) {
		super(snmp, database);
		
		execute(request);
	}
	
	@Override
	protected JSONObject each(String command, String key, JSONObject value) {
		if (!"get".equals(command)) {
			return null;
		}
		
		File dir = new File(this.snmp.getRoot(), key + File.separator + "cpu" + File.separator + value.getString("date").replace("-", File.separator));
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