package com.itahm.json;

import java.io.Closeable;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.channels.FileLock;
import java.nio.charset.Charset;

import org.json.JSONObject;

public class JSONFile implements Closeable{
	private JSONObject json;
	private RandomAccessFile file = null;
	private FileChannel channel;
	private FileLock lock;
	
	public JSONFile() {
		json = new JSONObject();
	}
	
	public JSONFile load(File file) throws IOException{
		if (this.file != null) {
			close();
			clear();
		}
		
		this.file = new RandomAccessFile(file, "rws");
		this.channel = this.file.getChannel();
		
		try {
			this.lock = this.channel.tryLock();
			
			if (this.lock == null) {
				throw new IOException("lock fail file is "+ file.getName());
			}
			
			long size = this.channel.size();
			if (size != (int)size) {
				throw new IOException("Can not read more than 2^31 -1 bytes");
			}
			else if (size > 0) {
				ByteBuffer buffer = ByteBuffer.allocate((int)size);
				
				this.channel.read(buffer);
				buffer.flip();
				
				this.json = new JSONObject(Charset.defaultCharset().decode(buffer).toString());
			}
			else {
				save();
			}
		} catch (IOException e) {
			this.file.close();
			
			throw e;
		}
		
		return this;
	}

	public JSONObject getJSONObject() {
		return this.json;
	}

	public void clear() throws IOException {
		this.json = new JSONObject();
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
		this.lock.release();
		this.channel.close();
		this.file.close();
	}
	
}