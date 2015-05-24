package com.itahm.json;

import java.io.Closeable;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.charset.Charset;

import org.json.JSONException;
import org.json.JSONObject;

import com.itahm.ITAhMException;

public class JSONFile implements Closeable{
	protected JSONObject json;
	private RandomAccessFile file = null;
	private FileChannel channel;
	
	public JSONFile() {
	}
	
	public JSONFile load(File file) throws IOException, ITAhMException {
		if (this.file != null) {
			close();
			clear();
		}
		
		this.file = new RandomAccessFile(file, "rws");
		this.channel = this.file.getChannel();
		
		try {
			long size = this.channel.size();
			if (size != (int)size) {
				throw new ITAhMException("too long file size.");
			}
			else if (size > 0) {
				ByteBuffer buffer = ByteBuffer.allocate((int)size);
				
				this.channel.read(buffer);
				buffer.flip();
				try {
					this.json = new JSONObject(Charset.defaultCharset().decode(buffer).toString());
				}
				catch (JSONException jsone) {
					throw new ITAhMException("invalid json file. "+ file.getName(), jsone);
				}
			}
			else {
				this.json = new JSONObject();
				
				save();
			}
		} catch (IOException e) {
			this.file.close();
			
			throw e;
		}
		
		return this;
	}

	public static JSONObject getJSONObject(File file) throws ITAhMException {
		try (
			RandomAccessFile raf = new RandomAccessFile(file, "r");
			FileChannel fc = raf.getChannel();
		) {
			long size = fc.size();
			if (size != (int)size) {
				throw new ITAhMException("too long file size.");
			}
			else if (size > 0) {
				ByteBuffer bb = ByteBuffer.allocate((int)size);
				fc.read(bb);
				
				bb.flip();
			
				try {
					return new JSONObject(Charset.defaultCharset().decode(bb).toString());
				}
				catch (JSONException jsone) {
					throw new ITAhMException("invalid json file. "+ file.getName(), jsone);
				}
			}
			else {
				throw new ITAhMException("empty file.");
			}
		}
		catch (IOException ioe) {
			throw new ITAhMException(ioe);
		}
	}
	
	public JSONObject getJSONObject() {
		return this.json;
	}
	
	public void put(String key, Object value) {
		this.json.put(key, value);
	}
	
	public JSONObject get(String key) {
		if (this.json.has(key)) {
			return this.json.getJSONObject(key);
		}
		
		return null;
	}
	
	public JSONObject get() {
		return this.json;
	}
	
	public boolean isEmpty() {
		return this.json.length() == 0;
	}
	
	public JSONObject remove(String key) {
		return (JSONObject)this.json.remove(key);
	}
	
	public void clear() throws IOException {
		this.json.clear();
	}
	
	public void save() throws IOException {	
		ByteBuffer buffer = ByteBuffer.wrap(this.json.toString().getBytes());
		
		this.file.setLength(0);
		this.channel.write(buffer);
	}
	
	public void saveAs(File file) throws IOException {
		try (
			FileOutputStream fos = new FileOutputStream(file, true);				
		) {
			fos.write(this.json.toString().getBytes());
		}		
	}
	
	@Override
	public void close() throws IOException {		
		if (this.channel != null) {
			this.channel.close();
		}
		
		if (this.file != null) {
			this.file.close();
		}
	}
	
}