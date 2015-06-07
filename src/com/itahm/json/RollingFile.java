package com.itahm.json;

import java.io.File;
import java.io.IOException;
import java.util.Calendar;

import com.itahm.ITAhMException;

// TODO: Auto-generated Javadoc
/**
 * The Class RollingFile.
 */
public class RollingFile extends JSONFile {

	/** The last. */
	private int last;
	
	/** The dataRoot. */
	private File dataRoot;
	
	/**
	 * Instantiates a new rolling file.
	 *
	 * @param root the dataRoot
	 * @param index the index of host, interfaces, etc.
	 * @throws IOException Signals that an I/O exception has occurred.
	 */
	public RollingFile(File root, String index) throws IOException {
		super();
	
		this.dataRoot = new File(root, index);
		this.dataRoot.mkdir();
		
		roll();
	}
	
	private String roll() throws ITAhMException, IOException {
		Calendar calendar = Calendar.getInstance();
		String now;
		int hour;
		
		calendar.set(Calendar.MILLISECOND, 0);
		calendar.set(Calendar.SECOND, 0);
		
		now = Long.toString(calendar.getTimeInMillis());
		hour = calendar.get(Calendar.HOUR_OF_DAY);
		
		if (hour == this.last) {
			return now;
		}
		
		this.last = hour;
		
		String fileName;
		File dir;
		
		calendar.set(Calendar.MINUTE, 0);
		fileName = Long.toString(calendar.getTimeInMillis());
		
		calendar.set(Calendar.HOUR_OF_DAY, 0);
		dir = new File(this.dataRoot, Long.toString(calendar.getTimeInMillis()));
		dir.mkdir();
		
		load(new File(dir, fileName));
		
		return now;
	}
	/**
	 * Roll.
	 *
	 * @param key the key
	 * @param value the value
	 * @throws IOException Signals that an I/O exception has occurred.
	 */
	
	public void roll(long value) throws IOException {
		String minute = roll();
		
		if (!this.json.has(minute) || this.json.getLong(minute) < value) {
			this.json.put(minute, value);
			
			// TODO 아래 반복되는 save가 성능에 영향을 주는가 확인 필요함.
			save();
		}
	}
	
}
