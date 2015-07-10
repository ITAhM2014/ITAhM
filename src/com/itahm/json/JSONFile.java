package com.itahm.json;

import java.io.Closeable;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.charset.Charset;

import org.json.JSONException;
import org.json.JSONObject;

import com.itahm.ITAhMException;

// TODO: Auto-generated Javadoc
/**
 * The Class JSONFile.
 */
public class JSONFile implements Closeable{
	
	/** The json. */
	protected JSONObject json;
	
	/** The file. */
	private RandomAccessFile file = null;
	
	/** The channel. */
	private FileChannel channel;
	
	/**
	 * Instantiates a new JSON file.
	 */
	public JSONFile() {
	}
	
	public JSONFile(File file) throws ITAhMException {
		try {
			load(file);
		} catch (IOException ioe) {
			throw new ITAhMException(ioe);
		}
		
	}
	
	/**
	 * Load.
	 *
	 * @param file the file
	 * @return the JSON file
	 * @throws IOException Signals that an I/O exception has occurred.
	 * @throws ITAhMException the IT ah m exception
	 * @throws FileNotFoundException 
	 */
	public JSONFile load(File file) throws ITAhMException, IOException {
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
		} catch (IOException ioe) {
			this.file.close();
			
			throw ioe;
		}
		
		return this;
	}

	/**
	 * Gets the JSON object.
	 *
	 * @param file the file
	 * @return the JSON object. return null if file size is more than Integer.MAX_VALUE, or invalid json format, or empty file.
	 */
	public static JSONObject getJSONObject(File file) {
		if (!file.isFile()) {
			return null;
		}
		
		try (
			RandomAccessFile raf = new RandomAccessFile(file, "r");
			FileChannel fc = raf.getChannel();
		) {
			long size = fc.size();
			if (size != (int)size) {
				System.out.println("can not open file. size "+ size);
				
				return null;
			}
			else if (size > 0) {
				ByteBuffer bb = ByteBuffer.allocate((int)size);
				fc.read(bb);
				
				bb.flip();
			
				try {
					return new JSONObject(Charset.defaultCharset().decode(bb).toString());
				}
				catch (JSONException jsone) {
					System.out.println("invalid json file. "+ file.getName());
					
					return null;
				}
			}
			
			System.out.println("empty file.");
		}
		catch (FileNotFoundException fnfe) {
		}
		catch (IOException e) {
			System.out.println("fatal error. "+ e);
		}
		
		return null;
	}
	
	/**
	 * Gets the JSON object.
	 *
	 * @return the JSON object
	 */
	public JSONObject getJSONObject() {
		return this.json;
	}
	
	/**
	 * Sets the JSON object.
	 *
	 * @throws IOException 
	 */
	public void setJSONObject(JSONObject jo) throws IOException {
		this.json = jo;
		
		save();
	}
	
	/**
	 * Put.
	 *
	 * @param key the key
	 * @param value the value
	 * @return the JSON object
	 */
	public JSONObject put(String key, Object value) {
		this.json.put(key, value);
		
		return this.json;
	}
	
	/**
	 * Put.
	 *
	 * @param key the key
	 * @param value the value
	 * @return true if 기존 값이 없거나 새로운 값이 더 큰 경우
	 */
	public boolean tryPut(String key, long value) {
		if (!this.json.has(key) || this.json.getLong(key) < value) {
			this.json.put(key, value);
			
			return true;
		}
		
		return false;
	}
	
	/**
	 * Gets the.
	 *
	 * @param key the key
	 * @return the JSON object
	 */
	public JSONObject get(String key) {
		return this.json.has(key)? this.json.getJSONObject(key): null;
	}
	
	/**
	 * Checks if is empty.
	 *
	 * @return true, if is empty
	 */
	public boolean isEmpty() {
		return this.json.length() == 0;
	}
	
	/**
	 * Removes the.
	 *
	 * @param key the key
	 * @return the JSON object
	 */
	public JSONObject remove(String key) {
		return (JSONObject)this.json.remove(key);
	}
	
	/**
	 * Clear.
	 *
	 * @throws IOException Signals that an I/O exception has occurred.
	 */
	public void clear() throws IOException {
		this.json.clear();
	}
	
	/**
	 * Save.
	 *
	 * @throws IOException Signals that an I/O exception has occurred.
	 */
	public void save() throws IOException {	
		ByteBuffer buffer = ByteBuffer.wrap(this.json.toString().getBytes());
		
		this.file.setLength(0);
		this.channel.write(buffer);
	}
	
	/**
	 * Save as.
	 *
	 * @param file the file
	 * @throws IOException Signals that an I/O exception has occurred.
	 */
	public void saveAs(File file) throws IOException {
		try (
			FileOutputStream fos = new FileOutputStream(file, true);				
		) {
			fos.write(this.json.toString().getBytes());
		}		
	}
	
	/* (non-Javadoc)
	 * @see java.io.Closeable#close()
	 */
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