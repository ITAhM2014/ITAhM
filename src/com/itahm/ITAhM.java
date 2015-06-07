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

import com.itahm.request.SignIn;
import com.itahm.http.EventListener;
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
		commandMap.put("cpu", "com.itahm.request.Cpu");
	}
	
	/*private static enum Command {
		ACCOUNT("com.itahm.request.Account"),
		PROFILE("com.itahm.request.Profile"),
		DEVICE("com.itahm.request.Device"),
		LINE("com.itahm.request.Line"),
		ADDRESS("com.itahm.request.Address"),
		SNMP("com.itahm.request.Snmp"),
		CPU("com.itahm.request.Cpu"),
		TRAFFIC("com.itahm.request.Traffic");
		
		private String className;
		
		private Command(String name) {
			className = name;
		}
	}
	*/
	
	private final Listener http;
	private final Database database;
	private final SnmpManager snmp;
	
	public ITAhM(int udpPort, String path) throws IOException {
		System.out.println("service start!");
		
		File root = new File(path, "itahm");
		root.mkdir();
		
		database = new Database(root);
		snmp = new SnmpManager(root);	
		http = new Listener(this, udpPort);
		
		System.out.println("ITAhM is ready");
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
	
	private void processRequest(JSONObject json, Session session) {
		try {
			if (json.has("database")) {
				processRequest(json, json.getString("database"));
			}
			else {
				if ("signout".equals(json.getString("command"))) {
					session.close();
					
					json.put("result", true);
				}
			}
		}
		catch(JSONException jsone) {
		}
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
		// TODO Auto-generated method stub
		
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
		
		if (session == null) {
			try {
				response.status("HTTP/1.1 401 Unauthorized").send(channel);
			} catch (IOException ioe) {
				ioe.printStackTrace();
				
				stop();
			}
			
			return;
		}
		
		session.update();
		
		response.status("HTTP/1.1 200 OK");
		
		try {
			try {
				JSONObject jo = request.body();
				
				processRequest(jo, session);
				
				/*
				if (jo.has("result")) {
					Object result = jo.get("result");
					
					if (result instanceof File) {
						response.send(channel, (File)result);
					}
				}
				*/
				response.send(channel, jo.toString());
			}
			catch (JSONException jsone) {
				// maybe empty body
				
				response.send(channel);
			}
		} catch (IOException ioe) {
			ioe.printStackTrace();
		
			stop();
		}	
	}

	@Override
	public void onError(Exception e) {
		e.printStackTrace();
		
		stop();
	}

	@Override
	public void close() throws IOException {
		this.database.close();
		this.snmp.close();
		this.http.close();
	}
	
	public static void main(String [] args) {
		try (ITAhM itahm = new ITAhM(2014, ".")) {
			
			System.in.read();
			System.out.println("service end");
		} catch (IOException e) {
			e.printStackTrace();
		} catch (ITAhMException itahme) {
			itahme.printStackTrace();
		}
	}
	
}
