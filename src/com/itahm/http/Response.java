package com.itahm.http;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.channels.SocketChannel;
import java.util.ArrayList;
import java.util.Iterator;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.itahm.Server;
import com.itahm.database.Database;

public class Response {
	private static final Database database = Server.getDatabase();
	
	public static void ok(SocketChannel channel, Message request) throws IOException {
		String requestLine = request.get();
		Message response = new Message("HTTP/1.1 200 OK")
				.set("Access-Control-Allow-Headers", "Authorization, Content-Type")
				.set("Access-Control-Allow-Origin", "http://local.itahm.com")
				.set("Access-Control-Allow-Credentials", "true");
		
		String [] token = requestLine.split(" ");
		
		if (token[0].equals("OPTIONS")) {
			response.send(channel);
		}
		else {
			String cookie = request.cookie();
			String user = request.user();
			Session session = null;
			int level = 0;
			
			if (cookie != null) {
				session = Session.find(cookie);
			}
			
			if (session != null) {
				level = 2;
			}
			else if (user != null){
				Object data = database.get("account", user);
				if (data != null) {
					try {
						if (((JSONObject)data).getString("password").equals(request.password())) {
							session = new Session();
							
							level = 1;
						}
					}
					catch(JSONException jsone) {
								
					}
				}
			}
			
			
			switch (level) {
			case 1:
				response.set("Set-Cookie", "SESSID="+ session.getID() +"; HttpOnly");
				
			case 2:
				JSONObject json = new JSONObject(new String(request.body()));
				
				processRequest(json, session);
				response.send(channel, new JSONObject(new String(request.body())).toString());
				
				break;
				
			default:
				new Message("HTTP/1.1 401 Unauthorized").set("Connection", "Close").send(channel);
			}
		}
	}
	/*
	public Response(SocketChannel channel, Parser parser) throws IOException {
		ArrayList<String> resHeader = new ArrayList<String>();
		JSONObject body = parser.body();
		Message message = parser.message();
		String sessID = message.cookie();
		String user = message.user();
		Session session = Session.find(sessID);
		int level = 0;
		
		String [] token = message.get().split(" ");
		
		if (token[0].equals("OPTIONS")) {
			resHeader.add("HTTP/1.1 200 OK");
			resHeader.add("Access-Control-Allow-Headers: Authorization, Content-Type");
		}
		else {
			if (sessID != null && session != null) {
				level = 2;
			}
			else if (user != null) { 
				Object data = database.get("account", user);
				if (data != null) {
					try {
						if (((JSONObject)data).getString("password").equals(message.password())) {
							session = new Session();
							
							level = 1;
						}
					}
					catch(JSONException jsone) {
								
					}
				}
			}
			
			switch (level) {
			case 1:
				resHeader.add("Set-Cookie: SESSID="+ session.getID() +"; HttpOnly");
				
			case 2:
				resHeader.add(0, "HTTP/1.1 200 OK");
				
				if (body != null) {
					processRequest(body, session);
				}
				
				break;
				
			default:
				resHeader.add("HTTP/1.1 401 Unauthorized");
			}
			
		}
		
		parser.clear();
		
		write(channel, resHeader, body == null? new byte[0]: body.toString().getBytes("UTF-8"));
	}
	
	private static void write(SocketChannel channel, ArrayList<String> resHeader, byte [] body) throws IOException {
		String header = "";
		int length;
		
		resHeader.add("Access-Control-Allow-Origin: http://local.itahm.com");
		resHeader.add("Access-Control-Allow-Credentials: true");
		resHeader.add(String.format("Content-Length: %d", body.length));
		
		length = resHeader.size();
		
		for (int i=0; i < length; i++) {
			header += (resHeader.get(i) + "\r\n");
		}
	
		write(channel, header +"\r\n");
		
		if (body.length > 0) {
			write(channel, body);
		}
	}
	
	private static final void write(SocketChannel channel, byte [] message) throws IOException {
		channel.write(ByteBuffer.wrap(message));
	}
	
	private static final void write(SocketChannel channel, String message) throws IOException {
		write(channel, message.getBytes("US-ASCII"));
	}
	*/
	private static void processRequest(JSONObject request, Session session) {
		@SuppressWarnings("unchecked")
		Iterator<String> iterator = request.keys();
		String command;
		
		while(iterator.hasNext()) {
			command = iterator.next();
			
			try {
				processEach(command, request.getJSONObject(command));
			}
			catch (JSONException  | ClassCastException e) {
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
		}
	}
	
	private static void processEach(String tableName, JSONObject query) {
		@SuppressWarnings("unchecked")
		Iterator<String> iterator = query.keys();
		String command;
		Object data;
		
		while(iterator.hasNext()) {
			command = iterator.next();
			data = query.get(command);
			
			if (command.equals("create")) {
				processEach(tableName, command, (JSONArray)data);
			}
			else if (command.equals("get")) {
				if (JSONObject.NULL.equals(data)) {
					processEach(query, tableName, command);
				}
				else {
					processEach(tableName, command, (JSONObject)data);
				}
			}
			else {
				processEach(tableName, command, (JSONObject)data);
			}
		}
	}
	
	// get all data from table
	private static void processEach(JSONObject query, String tableName, String command) {
		JSONObject data = database.get(tableName);
		
		if (tableName.equals("account")) {
			data = new JSONObject(data.toString());
			
			@SuppressWarnings("unchecked")
			Iterator<String> iterator = data.keys();
			String key;
			
			while(iterator.hasNext()) {
				key = iterator.next();
				
				data.getJSONObject(key).remove("password");
			}
		}
		
		query.put(command, data);
	}

	// create data without key
	private static void processEach(String tableName, String command, JSONArray data) {
		int length = data.length();
		
		while (length-- > 0) {
			database.add(tableName, null, data.getJSONObject(length));
		}
	}
	
	private static void processEach(String tableName, String command, JSONObject data) {
		@SuppressWarnings("unchecked")
		Iterator<String> iterator = data.keys();
		String key;
		
		while(iterator.hasNext()) {
			key = iterator.next();
			
			if (command.equals("get")) {
				data.put(key, database.get(tableName, key));
			}
			else if (command.equals("add")){
				data.put(key, database.add(tableName, key, data.getJSONObject(key)));
			}
			else if (command.equals("set")){
				if (tableName.equals("config")) {
					processEach(database.get("config"), data);
					
					data.put(key, true);
				}
				else {
					data.put(key, database.set(tableName, key, data.getJSONObject(key)));
				}
			}
			else if (command.equals("remove")){
				data.put(key, database.remove(tableName, key));
			}
			else {
				data.put(key, JSONObject.NULL);
			}
		}
	}

	private static void processEach (JSONObject config, JSONObject data) {
		@SuppressWarnings("unchecked")
		Iterator<String> iterator = data.keys();
		String key;
		
		while(iterator.hasNext()) {
			key = iterator.next();
			
			database.set("config", key, data.getString(key));
		}
	}
}
