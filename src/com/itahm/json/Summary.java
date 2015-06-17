package com.itahm.json;

import com.itahm.ITAhMException;
import com.itahm.json.JSONFile;

import java.io.File;
import java.io.IOException;
import java.util.Calendar;

import org.json.JSONObject;

public class Summary {

	private final JSONObject max;
	private final JSONObject min;
	private final JSONObject avr;
	
	public Summary(File dir) throws ITAhMException, IOException {
		max = new JSONObject();
		min = new JSONObject();
		avr = new JSONObject();
		
		if (isValid(dir)) {
			File file;
			
			for (long date = Long.parseLong(dir.getName()), i = 0; i < 24; i++, date += 3600000) {
				file = new File(dir, Long.toString(date));
				
				if (file.isFile()) {
					summarize(JSONFile.getJSONObject(file), date);
				}
			}
		}
		
		JSONFile file;
		
		file = new JSONFile(new File(dir, "max"));
		file.setJSONObject(max);
		file.close();
		
		file = new JSONFile(new File(dir, "min"));
		file.setJSONObject(min);
		file.close();
		
		file = new JSONFile(new File(dir, "avr"));
		file.setJSONObject(avr);
		file.close();
	}
	
	private boolean isValid(File dir) {
		if (!dir.isDirectory()) {
			return false;
		}
		
		try {
			long date = Long.parseLong(dir.getName());
			Calendar calendar = Calendar.getInstance();
			calendar.setTimeInMillis(date);
			if (calendar.get(Calendar.MILLISECOND) ==0
					&& calendar.get(Calendar.SECOND) ==0
					&& calendar.get(Calendar.MINUTE) ==0
					&& calendar.get(Calendar.HOUR_OF_DAY) ==0) {
				return true;
			}
		}
		catch (NumberFormatException nfe) {
			nfe.printStackTrace();
		}
		
		return false;
	}
	
	private void summarize(JSONObject jo, long date) {
		if (jo == null) {
			return;
		}
		
		int i, j, k;
		long value, max, min, sum;
		String key, dateString;
		
		for (i=0; i<60; i++) {
			max = -1;
			min = -1;
			sum = 0;
			key = Long.toString(date);
			
			for (j=0, k=0; j<5; j++) {
				dateString = Long.toString(date);
				if (jo.has(dateString)) {
					value = jo.getLong(dateString);
					max = max < 0? value: Math.max(max, value);
					min = min < 0? value: Math.min(min, value);
					sum += value;
					k++;
				}
				
				date += 60000;
			}
			
			if (k > 0) {
				this.max.put(key, max);
				this.min.put(key, min);
				this.avr.put(key, sum /k);
			}
		}
	}
	
	public static void main(String [] args) throws ITAhMException, IOException {
		new Summary(new File(args[0]));
	}
}
