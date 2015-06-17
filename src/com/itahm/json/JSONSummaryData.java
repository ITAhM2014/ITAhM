package com.itahm.json;

import java.io.File;
import java.util.Calendar;

import org.json.JSONObject;

public class JSONSummaryData {

	private final File root;
	private String method;
	private long current;
	private long next;
	private JSONObject data = null;
	private boolean initialized = false;
	
	public JSONSummaryData(File rollingRoot, String summaryMethod) {
		root = rollingRoot;
		method = summaryMethod;
	}
	
	public Long get(long date) {
		if (!initialized) {
			initialize(date);
		}
		
		String key = Long.toString(date);
		
		if (date >= this.next) {
			next();
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
		calendar.set(Calendar.HOUR_OF_DAY, 0);
		
		this.next = calendar.getTimeInMillis();
		
		next();
	}
	
	private void next() {
		this.current = this.next;
		this.next += RollingFile.DAY;
		
		this.data = JSONFile.getJSONObject(new File(new File(this.root, Long.toString(this.current)), this.method));
	}
}
