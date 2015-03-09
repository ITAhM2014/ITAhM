package com.itahm.database;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.channels.FileLock;
import java.nio.charset.Charset;
import java.text.SimpleDateFormat;
import java.util.Calendar;

import org.json.JSONObject;

public class File implements Table {

	public static final String separator = java.io.File.separator;
	protected final RandomAccessFile file;
	protected  JSONObject json;
	private final FileChannel channel;
	private final FileLock lock;
	private final static SimpleDateFormat fileNameFormat = new SimpleDateFormat("yyyyMMdd");
	private final String path;
	private String lastRolling;
	
	
	public File(String path) throws IOException {
		this.path = path;
		file = new RandomAccessFile(path, "rws");
		channel = file.getChannel();
		lock = channel.tryLock();
		
		if (lock == null) {
			throw new IOException();
		}
		
		if (channel.size() == 0) {
			json = new JSONObject();
			
			save();
		}
		else {
			load();
		}
	}
	
	public void load() throws IOException {
		ByteBuffer buffer = ByteBuffer.allocate((int)this.channel.size());
		
		this.channel.read(buffer);
		buffer.flip();
		
		this.json = new JSONObject(Charset.defaultCharset().decode(buffer).toString());
	}
	
	public void save() {
		ByteBuffer buffer = ByteBuffer.wrap(this.json.toString().getBytes());
		
		try {
			this.file.setLength(0);
			this.channel.write(buffer);
		} catch (IOException ioe) {
			ioe.printStackTrace();
		}
	}
	
	@Override
	public boolean add(String key, JSONObject data) {
		if (this.json.has(key)) {
			return false;
		}
		
		this.json.put(key, data);
		
		save();
		
		return true;
	}
	
	@Override
	public boolean set(String key, Object data) {
		if (!this.json.has(key)) {
			return false;
		}
		
		this.json.put(key, data);
		
		save();
		
		return true;
	}
	
	@Override
	public boolean remove(String key) {
		boolean result = this.json.remove(key) != null;
		
		save();
		
		return  result;
	}
	
	@Override
	public JSONObject get(String key) {
		return this.json.has(key)? this.json.getJSONObject(key): null;
	}
	
	@Override
	public JSONObject get() {
		return this.json; 
	}
	
	@Override
	public int count() {
		return this.json.length();
	}
	
	@Override
	public void close() throws IOException {
		this.lock.close();
		this.channel.close();
		this.file.close();
	}

	@Override
	public void roll() {
		String name = fileNameFormat.format(Calendar.getInstance().getTime());
		
		if (name.equals(this.lastRolling)) {
			return;
		}
		
		try (
			RandomAccessFile rolling = new RandomAccessFile(this.path + java.io.File.separator + name, "rws");
		) {
			rolling.getChannel().transferFrom(this.channel, 0, this.channel.size());
			
			this.json = new JSONObject();
			
			save();
		} catch (FileNotFoundException fnfe) {
			fnfe.printStackTrace();
		} catch (IOException ioe) {
			ioe.printStackTrace();
		}
	}
}
