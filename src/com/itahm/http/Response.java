package com.itahm.http;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.channels.SocketChannel;
import java.util.Iterator;

public final class Response extends Message {

	public final static String COOKIE = "SESSION=%s; HttpOnly";
	
	public Response() {
	}
	
	public Response status(int status, String reason) {
		this.startLine = "HTTP/1.1 "+ status +" "+ reason +CRLF;
		
		return this;
	}
	
	public Response header(String fieldName, String fieldValue) {
		this.header.put(fieldName, fieldValue);
		
		return this;
	}
	
	public void body(byte [] body) {
		int length = body.length;
		
		this.body = new byte[length];
		
		System.arraycopy(body, 0, this.body, 0, length);
	}
	
	public byte [] build() throws IOException {
		Iterator<String> iterator = this.header.keySet().iterator();
		String key;
		String header = "";
		ByteArrayOutputStream baos = new ByteArrayOutputStream();		
		
		while(iterator.hasNext()) {
			key = iterator.next();
			
			header += String.format(FIELD, key, this.header.get(key));
		}
		
		baos.write((startLine +CRLF+ header +CRLF).getBytes("US-ASCII"));
		baos.write(this.body);
		
		return baos.toByteArray();
	}
	
	/**
	 * 문자열 전송시 사용
	 * @param channel
	 * @param body
	 * @throws IOException
	 */
	public void send(SocketChannel channel, String body) throws IOException {
		byte [] bytes = body.getBytes("UTF-8");
		
		sendHeader(channel, bytes.length);
		send(channel, ByteBuffer.wrap(bytes));
	}
	
	/**
	 * file 전송시 사용
	 */
	public void send(SocketChannel channel, File body) throws IOException {
		try (
			FileInputStream fis = new FileInputStream(body);
		) {
			long size = body.length();
			byte [] buffer;
			
			sendHeader(channel, size);
			
			while (size > 0) {
				buffer = new byte [(int)size];
				size -= (int)size;
				fis.read(buffer);
				
				send(channel, ByteBuffer.wrap(buffer));
			}
		}
	}
	
	/**
	 * 이미 완성된 header와 전송할 data를 조합하여 전송
	 */
	private void sendHeader(SocketChannel channel, long length) throws IOException {
		Iterator<String> iterator;
		String header = this.startLine;
		String key;
		
		this.header.put("Content-Length", Long.toString(length));
		
		iterator = this.header.keySet().iterator();
		
		while(iterator.hasNext()) {
			key = iterator.next();
			
			header += String.format(FIELD, key, this.header.get(key));
		}
		
		send(channel, ByteBuffer.wrap((header +CRLF).getBytes("US-ASCII")));
	}
	
	/**
	 * 최종적으로 socket channel에 ByteBuffer 형식으로 data를 전송하는 method 
	 * @param channel
	 * @param buffer
	 * @return 전송한 data size (bytes)
	 * @throws IOException
	 */
	private int send(SocketChannel channel, ByteBuffer buffer) throws IOException {
		int bytes = 0;
		
		while (buffer.remaining() > 0) {
			bytes += channel.write(buffer);
		}
		
		return bytes;
	}
	
}