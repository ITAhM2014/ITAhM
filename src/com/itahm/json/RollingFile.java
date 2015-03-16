package com.itahm.json;

import java.io.File;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Calendar;

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
		
		load(new File(path, Integer.toString(this.last = c.get(Calendar.HOUR_OF_DAY))));
	}
	
	public void roll() throws IOException {
		Calendar c = Calendar.getInstance();
		
		if (c.get(Calendar.HOUR_OF_DAY) != this.last) {
			load(c);
		}
	}
	
}
