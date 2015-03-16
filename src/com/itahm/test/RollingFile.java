package com.itahm.test;

import java.io.File;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.charset.Charset;
import java.text.SimpleDateFormat;
import java.util.Calendar;

import org.json.JSONObject;

public class RollingFile {

	private JSONObject json;
	private final File path;
	private final static SimpleDateFormat fileNameFormat = new SimpleDateFormat("yyyyMMdd");
	private String lastRolling;;
	
	public RollingFile(String pathName) throws IOException {
		json = new JSONObject();
		lastRolling = getDate();
		path = new File(pathName);
		
		if (!path.isDirectory()) {
			if (!path.mkdir()) {
				throw new IOException();
			}
		}
		
		try (
				RandomAccessFile raf = new RandomAccessFile(new File(path, lastRolling), "rws");
				FileChannel fc = raf.getChannel();
		) {	
			long size = fc.size();
			if (size != (int)size) {
				throw new IOException();
			}
			else if (size > 0) {
				ByteBuffer bb = ByteBuffer.allocate((int)size);
				
				fc.read(bb);
				bb.flip();
				
				this.json = new JSONObject(Charset.defaultCharset().decode(bb).toString());
			}
		}
	}
	
	private static String getDate() {
		return fileNameFormat.format(Calendar.getInstance().getTime());
	}
	
	public void roll() throws IOException {
		String date = getDate();
		
		if (date.equals(this.lastRolling)) {
			return;
		}

		File file = new File(path, this.lastRolling);
		byte [] json = this.json.toString().getBytes();
		
		this.json = new JSONObject();
		this.lastRolling = date;
		
		try (
				RandomAccessFile raf = new RandomAccessFile(file, "rws");
				FileChannel fc = raf.getChannel();
		) {
			ByteBuffer bb = ByteBuffer.wrap(json);
			
			raf.setLength(0);
			fc.write(bb);
		}
	}
	
	public JSONObject getJSONObject() {
		return this.json;
	}
}
