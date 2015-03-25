package com.itahm.http;

import java.util.Iterator;
import java.util.Map;
import java.util.Timer;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

public class Session {

	private static final Map<String, Session> sessions = new ConcurrentHashMap<String, Session>();
	public static final Timer timer = new Timer();
	public static long timeout = 60 * 30;
	
	private final String sessionID;
	private TimerTask task;
	
	private Session(String uuid) {
		sessionID = uuid;
	}

	public static Session getInstance() {
		String uuid = UUID.randomUUID().toString();
		Session session = new Session(uuid);
		
		sessions.put(uuid, session);
		
		System.out.println("new cookie issued : "+ uuid);
		System.out.println("session total count is : "+ sessions.size());
		
		return session;
	}
	
	public static void setTimeout(long newTimeout) {
		timeout = newTimeout;
	}
	
	public static Session find(String sessionID) {
		if (sessionID == null) {
			return null;
		}
		
		Session sess = sessions.get(sessionID);
		
		if (sess == null) {
			System.out.println("cookie is : "+ sessionID);
			System.out.println("session count is : "+ sessions.keySet().size());
			Iterator<String> it = sessions.keySet().iterator();
			while (it.hasNext()) {
				System.out.println(it.next());
			}
		}
		return sess;
	}
	
	public static void remove(String sessionID) {
		sessions.remove(sessionID);
	}
	
	public void update() {
		if (this.task != null) {
			this.task.cancel();
		}
		
		this.task = new TimerTask(this.sessionID);
		
		timer.schedule(this.task, timeout);
	}
	
	public String getID() {
		return this.sessionID;
	}

	public void close() {
		if (this.task != null) {
			this.task.cancel();
			
			this.task = null;
		}
		
		sessions.remove(this.sessionID);
	}
}

class TimerTask extends java.util.TimerTask {

	private final String sessionID;
	
	public TimerTask(String uuid) {
		sessionID = uuid;
	}
	
	@Override
	public void run() {
		Session.remove(this.sessionID);
	}
	
}