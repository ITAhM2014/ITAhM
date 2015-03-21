package com.itahm.http;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.channels.SocketChannel;
import java.util.Base64;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

public final class Message {

	public final static String SESS_ID = "SESSID";
	public final static String COOKIE = "Set-Cookie: "+ SESS_ID +"=%s; HttpOnly\r\n";
	public final static String CRLF = "\r\n";
	public final static byte CR = (byte)'\r';
	public final static byte LF = (byte)'\n';
	public final static String FIELD = "%s: %s"+ CRLF;
	
	private final Map<String, String> header;
	private String startLine;
	private byte [] body;
	private String user;
	private String password;
	
	public Message() {
		header = new HashMap<String, String>();
		body = new byte [0];
	}
	
	public Message(String startLine) {
		this();
		
		set(startLine);
	}
	
	public Message set(String startLine) {
		this.startLine = startLine;
		
		return this;
	}
	
	public Message set(String fieldName, String fieldValue) {
		if ("authorization".equals(fieldName)) {
			String [] token = fieldValue.split("Basic ");
			
			if (token.length == 2) {
				try {
					token = new String(Base64.getDecoder().decode(token[1])).split(":");
					this.user = token[0];
					this.password = token[1];
				} catch (Exception e) {
				}
			}
		}
		else {
			this.header.put(fieldName, fieldValue);
		}
		
		return this;
	}
	
	public void set(byte [] body) {
		int length = body.length;
		
		this.body = new byte[length];
		
		System.arraycopy(body, 0, this.body, 0, length);
	}
	
	public String user() {
		return this.user;
	}
	
	public String password() {
		return this.password;
	}
	
	public byte [] getBytes() throws HttpException {
		if (this.startLine == null || this.startLine.length() == 0) {
			throw new HttpException("invalid start-line");
		}
		
		Iterator<String> it = this.header.keySet().iterator();
		String key;
		String result = "";
		ByteArrayOutputStream message = new ByteArrayOutputStream();		
		
		while(it.hasNext()) {
			key = it.next();
			
			result += String.format(FIELD, key, this.header.get(key));
		}
		
		try {
			message.write((startLine +CRLF+ result +CRLF).getBytes("US-ASCII"));
			message.write(this.body);
		} catch (IOException ioe) {
			ioe.printStackTrace();
			
			return new byte [0];
		}
		
		return message.toByteArray();		
	}
	
	public String get() {
		return this.startLine;
	}
	
	public String get(String name) {
		return this.header.get(name);
	}
	
	public void send(SocketChannel channel) throws IOException {
		send(channel, "");
	}
	
	public void send(SocketChannel channel, String body) throws IOException {
		if (this.startLine == null || this.startLine.length() == 0) {
			throw new HttpException("invalid start-line");
		}
		
		Iterator<String> it;
		String header = startLine +CRLF;
		byte [] bytes = body.getBytes("UTF-8");
		String key;
		
		this.header.put("Content-Length", Integer.toString(bytes.length));
		
		it = this.header.keySet().iterator();
		
		while(it.hasNext()) {
			key = it.next();
			
			header += String.format(FIELD, key, this.header.get(key));
		}
		
		channel.write(ByteBuffer.wrap((header +CRLF).getBytes("US-ASCII")));
		channel.write(ByteBuffer.wrap(bytes));
	}
	
	public byte [] body() {
		return this.body;
	}
	
	public String cookie() {
		String cookie = this.header.get("cookie");
		
		if (cookie == null) {
			return null;
		}
		
		String [] cookies = cookie.split("; ");
		String [] token;
		
		for(int i=0, length=cookies.length; i<length; i++) {
			token = cookies[i].split("=");
			
			if (token.length == 2 && SESS_ID.equals(token[0])) {
				return token[1];
			}
		}
		
		return null;
	}
	
	public void clear() {
		header.clear();
		startLine = null;
		body = new byte[0];
		user = null;
		password = null;
	}
	
}
