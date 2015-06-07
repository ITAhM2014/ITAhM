package com.itahm.json;

import java.io.File;
import java.util.Calendar;
import java.util.HashMap;
import java.util.Map;

import org.json.JSONObject;

import com.itahm.ITAhMException;

public class RollingData {

	private final File dataRoot;

	private long nextDate;
	
	private long lastDate;
	
	private long position;
	
	private JSONObject data;
	
	private final Calendar calendar;
	
	private final Map<Long, Long> map;
	
	public RollingData(File path, long start, int size) throws ITAhMException {
		dataRoot = path;
		calendar = Calendar.getInstance();
		map = new HashMap<Long, Long>();
		
		calendar.setTimeInMillis(start);
		calendar.set(Calendar.MILLISECOND, 0);
		calendar.set(Calendar.SECOND, 0);
		
		position = calendar.getTimeInMillis();
		
		lastDate = position + (size -1) *60000;
		
		calendar.set(Calendar.MINUTE, 0);
		
		nextDate = calendar.getTimeInMillis();
		
		load();
	}

	private void load() throws ITAhMException {
		if (this.nextDate > this.lastDate) {
			throw new ITAhMException();
		}
		
		calendar.setTimeInMillis(this.nextDate);
		calendar.set(Calendar.HOUR_OF_DAY, 0);
		
		File file = new File(dataRoot, Long.toString(calendar.getTimeInMillis()));
		file = new File(file, Long.toString(this.nextDate));
		
		this.nextDate += 3600000;
		
		if (file.isFile()) {
			this.data = JSONFile.getJSONObject(file);
		}
		
		if (this.data == null) {
			load();
		}
	}
	
	public Map<Long, Long> build() {
		try {
			while(this.position <= this.lastDate) {
				if (this.position < this.nextDate) {
					String key = Long.toString(this.position);
					if (this.data.has(key)) {
						this.map.put(this.position, this.data.getLong(key));
					}
					
					this.position += 60000;
				}
				else {
					load();
				}
			}
		}
		catch (ITAhMException itahme) {
			
		}
		return this.map;
	}
	
	public static void main(String [] args) {
		long end = Calendar.getInstance().getTimeInMillis();
		
		RollingData rd = new RollingData(new File("."), end - 60000 *40, 30);
		JSONObject jo = new JSONObject(rd.build());
		System.out.println(jo.length());
		System.out.println(jo);
		//new DataBuilder();
	} 
}
