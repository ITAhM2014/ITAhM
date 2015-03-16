package com.itahm;

import java.io.Closeable;
import java.io.File;
import java.io.IOException;
import java.util.Calendar;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

import org.json.JSONException;
import org.json.JSONObject;
import org.snmp4j.smi.OID;

import com.itahm.json.JSONFile;
import com.itahm.json.RollingFile;
import com.itahm.snmp.Constants;
import com.itahm.snmp.Manager;
import com.itahm.snmp.Node;
import com.itahm.snmp.Worker;

// TODO: Auto-generated Javadoc
/**
 * The Class Snmp.
 */
public class Snmp implements Worker, Runnable, Closeable {

	/** SNMP manager responsible for sending and receiving snmp protocol. */
	private final Manager manager;
	
	/** The file that has snmp information of the device list. */
	private final JSONFile file;
	
	/** JSON Object of the file above. */
	private final JSONObject json;
	
	/** The thread of this Snmp class. */
	private final Thread thread;
	
	/** stop flag means this thread should not work any more. */
	private boolean stop;
	
	/** The mapping key as IP address with rolling file. */
	private final Map<String, RollingFile> map;
	
	/** The path. */
	private final File path;
	
	/**
	 * Instantiates a new snmp.
	 *
	 * @param root the root
	 * @throws IOException Signals that an I/O exception has occurred.
	 */
	public Snmp(String root) throws IOException {
		manager = new Manager();
		file = new JSONFile();
		stop = false;
		thread = new Thread(this);
		map = new HashMap<String, RollingFile>();
		path = (root != null && root.length() > 0)? new File(root, "snmp"): new File("snmp");
		
		manager.setWorker(this);
		path.mkdir();
		
		file.load(new File(path, "snmp"));
		
		json = file.getJSONObject();
		
		if (!this.json.has("127.0.0.1")) {
			this.json.put("127.0.0.1", new JSONObject().
				put("ip", "127.0.0.1").
				put("udp", 161).
				put("community", "public")
			);
			
			try {
				this.file.save();
			} catch (IOException ioe) {
				// TODO fatal error
				ioe.printStackTrace();
			}
		}
		
		thread.start();
	}
	
	/**
	 * Test.
	 *
	 * @param oid the oid
	 * @return true, if successful
	 */
	private boolean test(OID oid) {
		return Constants.interfaces.leftMostCompare(Constants.interfaces.size(), oid) == 0 && (
			Constants.ifInOctets.leftMostCompare(Constants.ifInOctets.size(), oid) == 0 ||
			Constants.ifOutOctets.leftMostCompare(Constants.ifOutOctets.size(), oid) == 0 ||
			Constants.ifHCInOctets.leftMostCompare(Constants.ifHCInOctets.size(), oid) == 0 ||
			Constants.ifHCOutOctets.leftMostCompare(Constants.ifHCOutOctets.size(), oid) == 0);
	}
	
	/**
	 * Roll.
	 *
	 * @param file the file
	 * @param key the key
	 * @param value the value
	 */
	private void roll(RollingFile file, String key, Object value) {	
		JSONObject jo = file.getJSONObject();
		
		if (jo.has(key)) {
			jo = jo.getJSONObject(key);
		}
		else {
			jo.put(key, jo = new JSONObject());
		}
		
		jo.put(Long.toString(Calendar.getInstance().getTimeInMillis()), value);
	}
	
	/**
	 * Update.
	 *
	 * @param address the address
	 * @param key the key
	 * @param value the value
	 */
	private void update(String address, String key, Object value) {
		try {
			JSONObject jo = this.json.getJSONObject(address);
			
			if (!jo.has(key) || !value.equals(jo.get(key))) {
				jo.put(key, value);
				
				this.file.save();
			}
		}
		catch (JSONException jsone) {
		}
		catch (IOException ioe) {
			//TODO fatal error
			ioe.printStackTrace();
		}
	}
	
	/**
	 * Stop.
	 */
	public synchronized void stop() {
		if (!this.stop) {
			this.stop = true;
			
			thread.interrupt();
			
			try {
				thread.join();
			} catch (InterruptedException ie) {}
		}
	}
	
	/* (non-Javadoc)
	 * @see com.itahm.snmp.Worker#work(com.itahm.snmp.Node, boolean, java.lang.String)
	 */
	@Override
	public void work(Node node, boolean success, String msg) throws IOException {
		if (success) {
			Iterator<OID> it = node.iterator();
			String address = node.address();
			RollingFile jf = this.map.get(address);
			OID oid;
			
			if (jf == null) {
				jf = new RollingFile(this.path, address);
				
				this.map.put(address, jf);
			}
			
			while(it.hasNext()) {
				oid = it.next();
				
				if (test(oid)) {
					roll(jf, oid.toDottedString(), node.get(oid));
				}
				else {
					update(address, oid.toDottedString(), node.get(oid));
				}
			}
			
			jf.save();
			jf.roll();
		}
		else {
			// see msg for detail
		}
	}

	/* (non-Javadoc)
	 * @see java.lang.Runnable#run()
	 */
	@Override
	public void run() {
		String [] array;
		int index;
		Node node;
		
		while (!this.stop) {
			
			array = JSONObject.getNames(this.json);
			index = array.length;
			
			while (index-- > 0) {
				node = Node.create((JSONObject)this.json.get(array[index]));
				
				if (node != null) {
					try {
						this.manager.request(node);
					} catch (IOException ioe) {
						// TODO fatal error
						
						ioe.printStackTrace();
					}
				}
			}
			
			try {
				Thread.sleep(60*1000);
				//Thread.sleep(10*1000);
			}
			catch (InterruptedException e) {
				break;
			}
			
		}
	}

	/* (non-Javadoc)
	 * @see java.io.Closeable#close()
	 */
	@Override
	public void close() throws IOException {
		stop();
		
		this.file.close();
		this.manager.close();
	}

	/**
	 * The main method.
	 *
	 * @param args the arguments
	 * @throws IOException Signals that an I/O exception has occurred.
	 */
	public static void main(String [] args) throws IOException {
		Snmp snmp = new Snmp(null);
		
		System.in.read();
		
		snmp.close();
	}
}
