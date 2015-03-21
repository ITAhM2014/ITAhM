package com.itahm.http;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

public class Session implements Runnable{

	//private final static long TIMEOUT = 1000*60*60*12;
	private final static long TIMEOUT = 1000*30;
	
	private static final Map<String, Session> sessions = new ConcurrentHashMap<String, Session>();
	private final String id;
	private final Thread thread;
	private boolean update = false;
	
	public Session() {
		id = UUID.randomUUID().toString();
		thread = new Thread(this);
		
		sessions.put(id, this);
		
		thread.start();
	}

	/*
	 * PUBLIC
	 */
	
	public void update() {
		this.update = true;
		
		this.thread.interrupt();
	}
	
	public String getID() {
		return this.id;
	}
	
	public static Session find(String sessID) {
		if (sessID == null) {
			return null;
		}
		
		Session sess = sessions.get(sessID);
		
		return sess;
	}
	
	public static void close(Session session) {
		sessions.remove(session.getID());
	}
	
	@Override
	public void run() {
		while(true) {
			try {
				Thread.sleep(TIMEOUT);
			} catch (InterruptedException e) {
				if (this.update) {
					this.update = false;
				}
				else {
					break;
				}
			}
		}
		
		sessions.remove(this.id);
	}
	
}
