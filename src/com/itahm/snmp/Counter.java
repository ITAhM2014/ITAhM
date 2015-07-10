package com.itahm.snmp;

import java.util.Calendar;

public class Counter {

	private long last;
	private long count;
	
	public Counter(long value) {
		last = Calendar.getInstance().getTimeInMillis();
		count = value;
	}

	public long count(long value) {
		long time = Calendar.getInstance().getTimeInMillis();
		long counter = (value - this.count) *1000 /(time - this.last);

		this.last = time;
		this.count = value;
		
		return counter;
	}
	/*
	public Counter(long time, long value) {
		last = time;
		count = value;
	}
	
	public void set(long time, long value) {
		this.last = time;
		this.count = value;
	}

	public long count(long time, long value) {
		long count = (value - this.count) *1000 /(time - this.last);

		set(time, value);
		
		return count;
	}*/
}
