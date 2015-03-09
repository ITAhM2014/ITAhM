package com.itahm.http;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.Charset;
import java.nio.charset.CharsetDecoder;
import java.util.HashMap;
import java.util.Map;

import org.json.JSONException;
import org.json.JSONObject;

public class Parser {
	
	private final HashMap<String, String> header = new HashMap<String, String>();
	 
	private byte [] buffer = null;
	private int length = -1;
	private final ByteArrayOutputStream body = new ByteArrayOutputStream();
	
	private static enum Status {
		init,
		header,
		body,
		closed
	}
	
	private Status status = Status.init;
	private final CharsetDecoder decoder = Charset.forName("UTF-8").newDecoder();
	
	/*
	 * PUBLIC
	 */
	
	public boolean parse(ByteBuffer src) throws IOException {
		try {
			switch(this.status) {
			case init:
				return parseRequest(src);
				
			case header:
				return parseHeader(src);
				
			case body:
				return parseBody(src);
				
			default:
				return false;
			}
		}
		catch (ParseException pe) {
			this.status = Status.closed;
			
			throw pe;
		}
	}
	
	public Map<String, String> header() {
		return this.header;
	}
	
	public JSONObject body() {
		byte [] body = this.body.toByteArray();
		
		try {
			return body.length > 0? new JSONObject(this.decoder.decode(ByteBuffer.wrap(body)).toString()): null;
		} catch (JSONException | CharacterCodingException e) {
			return null;
		}
	}
	
	public void clear() {
		this.body.reset();
		this.header.clear();
	}
	/*
	 * PRIVATE
	 */
	
	//private JSONObject read(ByteBuffer src) throws IOException {
	private boolean parseRequest(ByteBuffer src) throws IOException {
		String line = readLine(src);
		
		if (line == null) {
			// line을 얻지 못함. Listener의 다음 call을 기대함
			
			return false;
		}
		
		if (line.length() == 0) {
			return parseRequest(src);
		}
		
		// request-line 파싱
		String [] token = line.split(" ");
		if (token.length != 3 || !(token[0].equals("POST") || token[0].equals("OPTIONS")) || !token[2].equals("HTTP/1.1")) {System.out.println("00000");
			throw new ParseException("invalid request line");
		}
		
		this.header.put("method", token[0]);
		
		this.status = Status.header;
		
		return parseHeader(src);
	}
	
	private boolean parseHeader(ByteBuffer src) throws IOException {
		String line = readLine(src);
		
		if (line == null) {
			// line을 얻지 못함. Listener의 다음 call을 기대함
			
			return false;
		}
		
		// header-field 파싱
		if (line.length() > 0) {
			int index = line.indexOf(":");
			
			if (index == -1) {
				throw new ParseException("invalid header field");
			}
			
			this.header.put(line.substring(0, index).toLowerCase(), line.substring(index + 1).trim());
			
			return parseHeader(src);
		}
		
		// header 파싱 완료
		String value = this.header.get("content-length");
		
		this.length = 0;
		
		if (value != null) {
			try {
				this.length = Integer.parseInt(value);
			}
			catch(NumberFormatException nfe) {
				
			}
		}
		
		src.compact().flip();
		
		this.status = Status.body;
		
		return parseBody(src);
	}
	
	private boolean parseBody(ByteBuffer src) throws IOException {
		byte [] octets = new byte[src.limit()];
		
		src.get(octets);
		this.body.write(octets);
		
		int length = this.body.size();
		
		if (length < this.length) {
			return false;
		}
		
		if (length > this.length) {
			throw new ParseException(String.format("out of content length %d/%d", length, this.length));
		}
		
		// body 조합 완료
		this.status = Status.init;
		
		return true;
	}
	
	private String readLine(ByteBuffer src) throws IOException {
		ByteArrayOutputStream buffer = new ByteArrayOutputStream();
		
		if (this.buffer != null) {
			buffer.write(this.buffer);
			
			this.buffer = null;
		}
		
		int b;
		
		while(src.hasRemaining()) {
			b = src.get();
			buffer.write(b);
			
			if (b == Header.LF) {
				String line = readLine(buffer.toByteArray());
				if (line != null) {
					return line;
				}
			}
		}
		
		this.buffer = buffer.toByteArray();
		
		return null;
	}
	
	private String readLine(byte [] src) throws IOException {
		int length = src.length;
		
		if (length > 1 && src[length - 2] == Header.CR) {
			return new String(src, 0, length -2);
		}
		
		return null;
	}
	
}
