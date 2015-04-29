package com.itahm;

import java.io.Closeable;
import java.io.File;
import java.io.IOException;
import java.nio.channels.SocketChannel;
import java.util.HashMap;
import java.util.Map;

import org.json.JSONException;
import org.json.JSONObject;

import com.itahm.database.SignIn;
import com.itahm.http.EventListener;
import com.itahm.http.Message;
import com.itahm.http.Listener;
import com.itahm.database.Database;
import com.itahm.session.Session;

public class ITAhM implements EventListener, Closeable {

	private final static Map<String, String> commandMap = new HashMap<String, String>();
	{
		commandMap.put("account", "com.itahm.database.Account");
		commandMap.put("device", "com.itahm.database.Device");
		commandMap.put("line", "com.itahm.database.Line");
		commandMap.put("traffic", "com.itahm.database.Traffic");
		commandMap.put("profile", "com.itahm.database.Profile");
	}
	
	private final Listener listener;
	
	public ITAhM(int udpPort, String path) throws IOException {
		
		File root = new File(path, "itahm");
		root.mkdir();
		
		Database.init(root);
			
		listener = new Listener(this, udpPort);
	}

	private boolean signin(String username, String password) {
		JSONObject jo = new JSONObject();
		JSONObject data = new JSONObject();
		
		jo.put("database", "account")
			.put("command", "get")
			.put("data", data
				.put(username, new JSONObject()
					.put("password", password)));
		
		new SignIn(jo);
		
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
				((Database)Class.forName(className).newInstance()).execute(jo);
			} catch (InstantiationException | IllegalAccessException | ClassNotFoundException e) {
				e.printStackTrace();
			}
		}
		
		/*@SuppressWarnings("unchecked")
		Iterator<String> iterator = json.keys();
		String command;
		
		while(iterator.hasNext()) {
			command = iterator.next();
			
			try {
				processEach(command, json.getJSONObject(command));
			}
			catch (JSONException e) {
				if (command.equals("logout")) {
					Session.close(session);
				}
				else if (command.equals("echo")) {
					
				}
				else {
					e.printStackTrace();
				}
				
				request.put(command, JSONObject.NULL);
			}
		}*/
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
		
		if (session == null) {
			if (user != null){
				if (signin(user, request.password())) {
					session = Session.getInstance();
					
					response.cookie(session.getID());
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
		this.listener.close();
	}
	
	public static void main(String [] args) {
		try (ITAhM itahm = new ITAhM(2014, "c:\\Project\\test")) {
			System.out.println("service start");
			System.in.read();
			System.out.println("service end");
		} catch (IOException e) {
			e.printStackTrace();
		} catch (ITAhMException itahme) {
			itahme.printStackTrace();
		}
	}
	
}
