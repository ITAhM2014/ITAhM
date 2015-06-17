package com.itahm.json;

import java.io.File;
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
		}
		
		String key = Long.toString(date);
		
		if (date >= this.nextHour) {
			if (date >= this.nextDay) {
				nextDay();
			}
			
			nextHour();
		}
		
		if (this.data != null && this.data.has(key)) {
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
		
		nextHour();
	}

	private void nextHour() {
		this.curHour = this.nextHour;
		this.nextHour += RollingFile.HOUR;
		
		this.data = JSONFile.getJSONObject(new File(new File(this.root, Long.toString(this.curDay)), Long.toString(this.curHour)));
	}
	
	private void nextDay() {
		this.curDay = this.nextDay;
		this.nextDay += RollingFile.DAY;
	}
}
