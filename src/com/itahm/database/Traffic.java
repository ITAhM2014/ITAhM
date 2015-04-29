package com.itahm.database;

import java.io.File;
import java.io.IOException;

import org.json.JSONException;
import org.json.JSONObject;

import com.itahm.json.JSONFile;

public class Traffic extends Database {

	public Traffic(JSONObject jo) {
		super(profile);
		
		execute(jo);
	}
	
	@Override
	public void execute(JSONObject request) {
		try {
			String command = request.getString("command");
			
			if ("get".equals(command)) {
				//String ip = request.getString("key");
				//String date = request.getString("date");
				
				File file = new File(root, "snmp"+ File.separator + request.getString("key") + File.separator + request.getString("date").replace("-", File.separator));
				if (file.isFile()) {
					request.put("result", new JSONFile().load(file).getJSONObject());
				}
				else if (file.isDirectory()) {System.out.println("processing...");
					File [] files = file.listFiles();
					int index = files.length;
					JSONObject result = new JSONObject();
					JSONFile jf;
					
					while (index-- > 0) {
						file = files[index];
						
						if (file.isFile()) {
							jf = new JSONFile().load(file);
							result.put(file.getName(), jf.getJSONObject());
							jf.close();
						}
					}
					
					request.put("result", result);System.out.println("end process");
				}
			}
		}
		catch (JSONException jsone) {
		} catch (IOException ioe) {
			ioe.printStackTrace();
		}
	}

	@Override
	protected JSONObject each(String command, String key, JSONObject value) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	protected boolean complete() {
		// TODO Auto-generated method stub
		return false;
	}
}