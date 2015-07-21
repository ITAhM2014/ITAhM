package com.itahm;

import java.io.Closeable;
import java.io.File;
import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.nio.channels.SocketChannel;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

import org.json.JSONException;
import org.json.JSONObject;

import com.itahm.request.SignIn;
import com.itahm.http.Message;
import com.itahm.http.Listener;
import com.itahm.session.Session;

public class ITAhM implements EventListener, Closeable {

	private final static Map<String, String> commandMap = new HashMap<String, String>();
	{
		commandMap.put("account", "com.itahm.request.Account");
		commandMap.put("device", "com.itahm.request.Device");
		commandMap.put("line", "com.itahm.request.Line");
		commandMap.put("traffic", "com.itahm.request.Traffic");
		commandMap.put("profile", "com.itahm.request.Profile");
		commandMap.put("address", "com.itahm.request.Address");
		commandMap.put("snmp", "com.itahm.request.Snmp");
		commandMap.put("realtime", "com.itahm.request.RealTime");
		commandMap.put("processor", "com.itahm.request.Processor");
		commandMap.put("storage", "com.itahm.request.Storage");
	}
	
	private final Listener http;
	private final Database database;
	private final SnmpManager snmp;
	private final Map<SocketChannel, Message> eventQueue;
	
	public ITAhM(int tcpPort, String path) throws IOException {
		System.out.println("ITAhM service is started");
		
		File root = new File(path, "itahm");
		root.mkdir();
		
		database = new Database(root);
		snmp = new SnmpManager(root, this);	
		http = new Listener(this, tcpPort);
		eventQueue = new HashMap<SocketChannel, Message>();
	}

	private boolean signin(String username, String password) {
		JSONObject jo = new JSONObject();
		JSONObject data = new JSONObject();
		
		jo.put("database", "account")
			.put("command", "get")
			.put("data", data
				.put(username, new JSONObject()
					.put("password", password)));
		
		new SignIn(this.snmp, this.database, jo);
		
		return !data.isNull(username);
	}
	
	private boolean processRequest(JSONObject json, Session session) {
		try {
			if (json.has("database")) {
				processRequest(json, json.getString("database"));
			}
			else {
				if ("signout".equals(json.getString("command"))) {
					session.close();
				}
				else if ("event".equals(json.getString("command"))) {
					return false;
				}
			}
		}
		catch(JSONException jsone) {
		}
		
		return true;
	}
	
	private void processRequest(JSONObject jo, String database) {
		String className =commandMap.get(database);
		
		if (className != null) {
			try {
				Class.forName(className).getDeclaredConstructor(SnmpManager.class, Database.class, JSONObject.class).newInstance(this.snmp, this.database, jo);
			} catch (InstantiationException | IllegalAccessException | ClassNotFoundException | NoSuchMethodException |SecurityException | IllegalArgumentException | InvocationTargetException e) {
				e.printStackTrace();
			}
		}
	}
	
	private void stop() {
		
	}
	
	@Override
	public void onConnect(SocketChannel channel) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void onClose(SocketChannel channel) {
		synchronized(this.eventQueue) {
			this.eventQueue.remove(channel);
		}
	}

	@Override
	public void onRequest(SocketChannel channel, Message request, Message response) {
		String cookie = request.cookie();
		String user = request.user();
		Session session = null;
		
		if (cookie != null) {
			session = Session.find(cookie);
		}
		else {
		}
		
		if (session == null) {
			if (user != null){
				if (signin(user, request.password())) {
					session = Session.getInstance();
					
					response.cookie(session.getID());
				}
				else {
				}
			}
		}
		else {
		}
		/**
		 * session 확인하는 부분. 삭제하지 말것
		if (session == null) {
			try {
				response.status("HTTP/1.1 401 Unauthorized").send(channel);
			} catch (IOException ioe) {
				onError(ioe);
			}
			
			return;
		}
		
		session.update();
		*/
		try {
			try {
				JSONObject jo = request.body();
				
				if (processRequest(jo, session)) {
					response.status("HTTP/1.1 200 OK").send(channel, jo.toString());
				}
				else {
					synchronized(eventQueue) {
						eventQueue.put(channel, response);
					}
				}	
			} catch (JSONException jsone) {
				 // signin 등과 같이내용 없는 요청이 올 경우
				response.status("HTTP/1.1 200 OK").send(channel);
			} 
		}catch (IOException ioe) {
			onError(ioe);
		}	
	}

	@Override
	public void onEvent() {
		synchronized(this.eventQueue) {
			try {
				Iterator<SocketChannel> iterator = eventQueue.keySet().iterator();
				SocketChannel channel;
				
				while (iterator.hasNext()) {
					channel = iterator.next();
					
					eventQueue.get(channel).status("HTTP/1.1 200 OK").send(channel, new JSONObject().put("event", "test").toString());
					
					iterator.remove();
				}
			} catch (IOException ioe) {
				onError(ioe);
			}
		}
	}
	
	@Override
	public void onError(Exception e) {
		e.printStackTrace();
		
		stop();
	}

	@Override
	public void close() {
		this.database.close();
		
		try {
			this.snmp.close();
		} catch (IOException e) {
			e.printStackTrace();
		}
		
		try {
			this.http.close();
		} catch (IOException e) {
			e.printStackTrace();
		}
		
		System.out.println("ITAhM service is end");
	}
	
	public static void main(String [] args) throws IOException {
		final ITAhM itahm = new ITAhM(2014, ".");
		
		Runtime.getRuntime().addShutdownHook(new Thread()
        {
            @Override
            public void run()
            {
            	itahm.close();
            }
        });
	}
	
}
