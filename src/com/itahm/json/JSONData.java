package com.itahm.json;

import java.io.File;
import java.io.IOException;
import java.util.Calendar;

import org.json.JSONObject;

public class JSONData {

	private final File root;
	private long curHour;
	private long curDay;
	private long nextHour;
	private long nextDay;
	private JSONObject data = null;
	private boolean initialized = false;
	
	public JSONData(File rollingRoot) {
		root = rollingRoot;
	}
	
	public Long get(long date) {
		if (!initialized) {
			initialize(date);
			
			initialized = true;
		}
		
		String key = Long.toString(date);
		
		if (date >= this.nextHour) {
			if (date >= this.nextDay) {
				nextDay();
			}
			else if (!nextHour()){
				return null;
			}
		}
		
		if (this.data == null) {
			
		}
		else if (this.data.has(key)) {
			return this.data.getLong(key);
		}
		
		return null;
	}
	
	private void initialize(long date) {
		Calendar calendar = Calendar.getInstance();
		
		calendar.setTimeInMillis(date);
		calendar.set(Calendar.MILLISECOND, 0);
		calendar.set(Calendar.SECOND, 0);
		calendar.set(Calendar.MINUTE, 0);
		
		this.nextHour = calendar.getTimeInMillis();
		
		calendar.set(Calendar.HOUR_OF_DAY, 0);
		
		this.nextDay = calendar.getTimeInMillis();
		
		nextDay();
	}

	private boolean nextHour() {
		this.curHour = this.nextHour;
		this.nextHour += RollingFile.HOUR;
		
		String curDay = Long.toString(this.curDay);
		String curHour = Long.toString(this.curHour);
		
		try {
			this.data = JSONFile.getJSONObject(new File(new File(this.root, curDay), curHour));
		} catch (IOException e) {
			return false;
		}
		
		return true;
	}
	
	private boolean nextDay() {
		this.curDay = this.nextDay;
		this.nextDay += RollingFile.DAY;
		
		return nextHour();
	}
}
