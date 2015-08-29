package com.itahm;

import java.io.Closeable;
import java.io.File;
import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.nio.channels.SocketChannel;
import java.util.HashMap;
import java.util.Map;

import org.json.JSONException;
import org.json.JSONObject;

import com.itahm.request.Account;
import com.itahm.http.Listener;
import com.itahm.http.Request;
import com.itahm.http.Response;
import com.itahm.session.Session;

import event.Event;
import event.EventQueue;
import event.EventResponder;
import event.Waiter;
import event.WaitingQueue;

public class ITAhM implements EventListener, EventResponder, Closeable {

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
		commandMap.put("delay", "com.itahm.request.Delay");
		commandMap.put("realtime", "com.itahm.request.RealTime");
	}
	
	private final Listener http;
	private final SnmpManager snmp;
	private final EventQueue eventQueue;
	private final WaitingQueue waitingQueue;
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
		eventQueue = new EventQueue();
		waitingQueue = new WaitingQueue();
	}
	
	private void initSNMP() {
		JSONObject deviceData = Data.getJSONObject(Data.Table.DEVICE);
		JSONObject profileData = Data.getJSONObject(Data.Table.PROFILE);
		
		String [] names = JSONObject.getNames(deviceData);
		
		if (names == null) {
			return;
		}
		
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
	 * method에서 바로 queue에 넣지 않고 Waiter를 반환해서 caller가 처리하도록 하는 이유는
	 * caller가 method에 channel 과 message를 전달하지 않았기 때문
	 * @param json request json
	 * @return Waiter 즉시 처리하지 않고 waiting queue에 보관하는 경우 
	 */
	private Waiter processRequest(JSONObject json, Session session) {
		try {
			if (json.has("database")) {
				processRequest(json, json.getString("database"));
			}
			else {
				if ("signout".equals(json.getString("command"))) {
					session.close();
				}
				else if ("event".equals(json.getString("command"))) {
					return new Waiter(json.getInt("index"));
				}
				else {
					json.put("data", JSONObject.NULL);
				}
			}
		}
		catch(JSONException jsone) {
			json.put("data", JSONObject.NULL);
		}
		
		return null;
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
		this.waitingQueue.cancel(channel);
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
				Waiter waiter = processRequest(jo, session);
				
				if (waiter == null) {
					response.status(200, "OK").send(channel, jo.toString());
				}
				else {
					int index = waiter.index();
					Event event = this.eventQueue.getNext(index);
					
					waiter.set(channel, response);
					
					if (index == -1 || event == null) {
						this.waitingQueue.push(waiter);
					}
					else {
						waiter.checkout(event);
					}
				}
			}
		}catch (IOException ioe) {
			onError(ioe);
		}	
	}

	@Override
	public void onEvent(Event event) {
		this.eventQueue.push(event);
		
		this.waitingQueue.each(this);
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

	@Override
	public void response(Waiter waiter) {
		Event event = this.eventQueue.getNext(waiter.index());
		
		if (event != null) {
			try {
				waiter.checkout(event);
			} catch (IOException e) {
				e.printStackTrace();
			}
		}
	}
	
}
