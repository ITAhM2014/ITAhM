package com.itahm.http;

import java.nio.charset.Charset;

import org.json.JSONException;
import org.json.JSONObject;

public final class Request extends Message {

	public final static String CRLF = "\r\n";
	public final static byte CR = (byte)'\r';
	public final static byte LF = (byte)'\n';
	public final static String FIELD = "%s: %s"+ CRLF;
	
	private String method;
	private String version;
	private String cookie;
	private String user;
	private String password;
	
	public Request() {
	}
	
	public Request header(String fieldName, String fieldValue) {
		fieldName = fieldName.toLowerCase();
		
		if ("authorization".equals(fieldName)) {
			String [] token = fieldValue.split("Basic ");
			
			if (token.length == 2) {
				try {/*
					token = new String(Base64.getDecoder().decode(token[1])).split(":");
					this.user = token[0];
					this.password = token[1];*/
					this.user = "root";
					this.password = "root";
				} catch (Exception e) {
				}
			}
		}
		else if ("cookie".equals(fieldName)) {
			String [] cookies = fieldValue.split("; ");
			String [] token;
			
			for(int i=0, length=cookies.length; i<length; i++) {
				token = cookies[i].split("=");
				
				if (token.length == 2 && "SESSION".equals(token[0])) {
					this.cookie= token[1];
				}
			}
			
		}
		else {
			this.header.put(fieldName, fieldValue);
		}
		
		return this;
	}
	
	public boolean request(String requestLine) {
		String [] token = requestLine.split(" ");
		if (token.length != 3) {
			return false;
		}
		
		this.method = token[0];
		this.version = token[2];
		
		return true;
	}
	
	public int length() {
		String length = this.header.get("content-length");
		
		if (length != null) {
			try {
				return Integer.parseInt(length);
			}
			catch(NumberFormatException nfe) {
			}
		}
		
		return -1;
	}
	
	public String method() {
		return this.method;
	}
	
	public String version() {
		return this.version;
	}
	
	public String cookie() {
		return this.cookie;
	}
	
	public String user() {
		return this.user;
	}
	
	public String password() {
		return this.password;
	}
	
	public String header(String name) {
		return this.header.get(name);
	}
	
	public void body(byte [] body) {
		int length = body.length;
		
		this.body = new byte[length];
		
		System.arraycopy(body, 0, this.body, 0, length);
	}
	
	public JSONObject getJSONObject() {
		try {
			return new JSONObject(new String(this.body, Charset.forName("UTF-8")));
		}
		catch (JSONException jsone) {
			return null;
		}
	}
}
