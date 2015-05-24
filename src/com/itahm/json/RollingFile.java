package com.itahm.json;

import java.io.File;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Calendar;

import org.json.JSONObject;

public class RollingFile extends JSONFile {

	private final static SimpleDateFormat fileName = new SimpleDateFormat("yyyy"+ File.separator +"MM"+ File.separator +"dd");
	
	private int last;
	private final File path;
	
	public RollingFile(File path, String name) throws IOException {
		super();
	
		this.path = new File(path, name);
		this.path.mkdir();
		
		load(Calendar.getInstance());
	}
	
	public void load(Calendar c) throws IOException {
		File path = new File(this.path, fileName.format(c.getTime()));
		path.mkdirs();
		
		load(new File(path, String.format("%02d", this.last = c.get(Calendar.HOUR_OF_DAY))));
	}
	
	public void roll(String key, long value) throws IOException {
		Calendar calendar = Calendar.getInstance();
		
		if (calendar.get(Calendar.HOUR_OF_DAY) != this.last) {
			load(calendar);
		}
		
		JSONObject jo;
		if (this.json.has(key)) {
			jo = this.json.getJSONObject(key);
		}
		else {
			jo = new JSONObject();
			
			this.json.put(key, jo);
		}
		
		String minute = Long.toString(calendar.get(Calendar.MINUTE));
		if (!jo.has(minute) || jo.getLong(minute) < value) {
			jo.put(minute, value);
		}
		
		// TODO 아래 반복되는 save가 성능에 영향을 주는가 확인 필요함.
		save();
	}
	
}
