package com.itahm.database;

import java.io.IOException;
import java.util.concurrent.atomic.AtomicInteger;

public class Index extends File {
	private final AtomicInteger device;
	private final AtomicInteger line;
	
	public Index(String path) throws IOException {
		super(path + java.io.File.separator + "index");
		
		int index = 0;
		
		if (this.json.has("device")) {
			index = this.json.getInt("device");
		}
		else {
			this.json.put("device", 0);
		}
		
		device = new AtomicInteger(index);
		
		index = 0;
		
		if (this.json.has("line")) {
			index = this.json.getInt("line");
		}
		else {
			this.json.put("line", 0);
		}
		
		line = new AtomicInteger(index);
	}

	public int device() {
		int index = this.device.incrementAndGet();
		
		this.json.put("device", index);
		
		save();
		
		return index;
	}
	
	public int line() {
		int index = this.line.incrementAndGet();
		
		this.json.put("line", index);
		
		save();
		
		return index;
	}
	
}
