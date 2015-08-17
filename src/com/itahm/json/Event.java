package com.itahm.json;

import java.util.Calendar;

import org.json.JSONObject;

public class Event extends JSONObject {
	
	public Event(String sysName, String ipAddr, String resource, long lastStatus, long currentStatus, String text) {
		put("timeStamp", Calendar.getInstance().getTimeInMillis());
		put("sysName", sysName);
		put("ipAddr", ipAddr);
		put("resource", resource);
		put("lastStatus", lastStatus);
		put("currentStatus", currentStatus);
		put("text", text);
	}
	
	public Event(String sysName, String ipAddr, String resource, String index, long lastStatus, long currentStatus, String text) {
		this(sysName, ipAddr, resource, lastStatus, currentStatus, text);
		
		put("index", index);
	}
	
	public static void main(String [] args) {
	}
}
