package com.itahm.http;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.channels.SocketChannel;
import java.util.Base64;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

import com.itahm.ITAhMException;

public final class Message {

	public final static String CRLF = "\r\n";
	public final static byte CR = (byte)'\r';
	public final static byte LF = (byte)'\n';
	public final static String FIELD = "%s: %s"+ CRLF;
	
	private final Map<String, String> header;
	private String startLine;
	private byte [] body;
	private String method;
	private String version;
	private String cookie;
	private String user;
	private String password;
	
	public Message() {
		header = new HashMap<String, String>();
		body = new byte [0];
	}
	
	public Message(String startLine) {
		this();
		
		status(startLine);
	}
	
	public Message status(String startLine) {
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
	
	public void set(byte [] body) {
		int length = body.length;
		
		this.body = new byte[length];
		
		System.arraycopy(body, 0, this.body, 0, length);
	}
	
	public void method(String method) {
		this.method = method;
	}
	
	public String method() {
		return this.method;
	}
	
	public void version(String version) {
		this.version = version;
	}
	
	public String version() {
		return this.version;
	}

	public void cookie(String cookie) {
		set("Set-Cookie", "SESSION="+ cookie +"; HttpOnly");
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
	
	public String get(String name) {
		return this.header.get(name);
	}
	
	public void send(SocketChannel channel) throws IOException {
		send(channel, "");
	}
	
	public void send(SocketChannel channel, String body) throws IOException {
		send(channel, body.getBytes("UTF-8"));
	}
	
	public void send(SocketChannel channel, File body) throws IOException {
		try (
			FileInputStream fis = new FileInputStream(body);
		) {
			long size = body.length();
			
			if (size != (int)size) {
				throw new ITAhMException("Can not read more than 2^31 -1 bytes");
			}
			else if (size > 0) {
				byte [] buffer = new byte [(int)size];
				
				fis.read(buffer);
				
				send(channel, buffer);
			}
		}
	}
	
	public void send(SocketChannel channel, byte [] body) throws IOException {
		if (this.startLine == null || this.startLine.length() == 0) {
			throw new HttpException("invalid start-line");
		}
		
		Iterator<String> it;
		String header = startLine +CRLF;
		String key;
		
		this.header.put("Content-Length", Integer.toString(body.length));
		
		it = this.header.keySet().iterator();
		
		while(it.hasNext()) {
			key = it.next();
			
			header += String.format(FIELD, key, this.header.get(key));
		}
		
		send(channel, ByteBuffer.wrap((header +CRLF).getBytes("US-ASCII")));
		send(channel, ByteBuffer.wrap(body));
	}
	
	private int send(SocketChannel channel, ByteBuffer buffer) throws IOException {
		int bytes = 0;
		
		while (buffer.remaining() > 0) {
			bytes += channel.write(buffer);
		}
		
		return bytes;
	}
	
	public byte [] body() {
		return this.body;
	}
	
}
