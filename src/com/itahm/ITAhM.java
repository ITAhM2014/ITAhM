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

import com.itahm.request.Account;
import com.itahm.http.Listener;
import com.itahm.http.Request;
import com.itahm.http.Response;
import com.itahm.json.Event;
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
		commandMap.put("processor", "com.itahm.request.Processor");
		commandMap.put("storage", "com.itahm.request.Storage");
		commandMap.put("memory", "com.itahm.request.Storage");
	}
	
	private final Listener http;
	private final SnmpManager snmp;
	private final Map<SocketChannel, Response> eventQueue;
	
	public ITAhM(int tcpPort, String path) throws IOException, ITAhMException {
		System.out.println("ITAhM service is started");
		
		File root = new File(path, "itahm");
		root.mkdir();
		
		/**
		 * Data.initialize가 가장 먼저 수행되어야함.
		 */
		Data.initialize(root);
		
		snmp = new SnmpManager(root, this);
		
		try {
			initSNMP();
		}
		catch (JSONException jsone) {
			onError(jsone);
		}
		
		http = new Listener(this, tcpPort);
		eventQueue = new HashMap<SocketChannel, Response>();
		
		
	}
/*
 * if (snmpFile.get("127.0.0.1") == null) {
			snmpFile.put("127.0.0.1", new JSONObject()
				.put("ip","127.0.0.1")
				.put("udp", 161)
				.put("community", "public")
				.put("ifEntry", new JSONObject())
				.put("hrProcessorLoad", new JSONObject())
			);
			
			snmpFile.save();
		}
 */
	
	private void initSNMP() {
		JSONObject deviceData = Data.getJSONObject(Data.Table.DEVICE);
		JSONObject profileData = Data.getJSONObject(Data.Table.PROFILE);
		
		String [] names = JSONObject.getNames(deviceData);
		JSONObject device;
		String profileName;
		JSONObject profile;
		
		for (int i=0, length=names.length; i<length; i++) {
			device = deviceData.getJSONObject(names[i]);
			if (!device.isNull("profile")) {
				profileName = device.getString("profile");
				
				if (profileData.has(profileName)) {
					profile = profileData.getJSONObject(profileName);
					
					this.snmp.addNode(device.getString("address"), profile.getInt("udp"), profile.getString("community"));
				}
			}
		}
	}
	
	private boolean signin(String username, String password) {
		JSONObject request = new JSONObject();
		JSONObject data = new JSONObject();
		
		request.put("database", "account")
			.put("command", "get")
			.put("data", data.put(username, JSONObject.NULL));
		
		new Account(request, true);
		
		if (!data.isNull(username)) {
			JSONObject result = data.getJSONObject(username);
			
			return password.equals(result.getString("password"));
		}

		return false;
	}
	
	/**
	 * method에서 바로 queue에 넣지 않고 false를 반환해서 caller가 처리하도록 하는 이유는
	 * caller가 method에 channel 과 message를 전달하지 않았기 때문
	 * @param json request json
	 * @return false 즉시 처리하지 않고 event queue에 보관하는 경우 
	 */
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
				else {
					json.put("data", JSONObject.NULL);
				}
			}
		}
		catch(JSONException jsone) {
			json.put("data", JSONObject.NULL);
		}
		
		return true;
	}
	
	private void processRequest(JSONObject jo, String database) {
		String className =commandMap.get(database);
		
		if (className != null) {
			try {
				Class.forName(className).getDeclaredConstructor(JSONObject.class).newInstance(jo);
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
	public void onRequest(SocketChannel channel, Request request, Response response) {
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
					
					response.header("Set-Cookie", String.format(Response.COOKIE, session.getID()));
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
		JSONObject jo = request.getJSONObject();
		
		try {
			if (jo == null) {
				// signin 등과 body가 없고 header만으로 처리하는 경우
				response.status(200, "OK").send(channel, "");
			}
			else {
				if (processRequest(jo, session)) {
					response.status(200, "OK").send(channel, jo.toString());
				}
				else {
					// processRequest가 false를 반환하면 event 요청인 것
					synchronized(this.eventQueue) {
						this.eventQueue.put(channel, response);
					}
				}
			}
		}catch (IOException ioe) {
			onError(ioe);
		}	
	}

	@Override
	public void onEvent(Event event) {
		JSONObject msg = new JSONObject();
		
		msg.put("event", event);
		
		synchronized(this.eventQueue) {
			try {
				Iterator<SocketChannel> iterator = this.eventQueue.keySet().iterator();
				SocketChannel channel;
				
				while (iterator.hasNext()) {
					channel = iterator.next();
					
					
					
					this.eventQueue.get(channel).
					status(200, "OK").
					send(channel, msg.toString());
					
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
		
		Data.close();
		
		System.out.println("ITAhM service is end");
	}
	
	public static void main(String [] args) throws IOException, ITAhMException {
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
