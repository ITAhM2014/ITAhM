package com.itahm.http;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.channels.SocketChannel;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.Base64;
import java.util.Map;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.itahm.Server;
import com.itahm.database.Database;

public class Response {
	private final Database database = Server.getDatabase();
	
	public Response(SocketChannel channel) throws IOException {
		ArrayList<String> resHeader = new ArrayList<String>();
		resHeader.add("HTTP/1.1 400 Bad Request");
		resHeader.add("Connection: Close");
		
		write(channel, resHeader, new byte[0]);
	}
	
	public Response(SocketChannel channel, Parser parser) throws IOException {
		ArrayList<String> resHeader = new ArrayList<String>();
		JSONObject body = parser.body();
		Map<String, String> header = parser.header();
		String sessID = parseCookie(header);
		String auth = parseAuth(header);
		Session session = Session.find(sessID);
		int level = 0;
		
		if (header.get("method").equals("OPTIONS")) {
			resHeader.add("HTTP/1.1 200 OK");
			resHeader.add("Access-Control-Allow-Headers: Authorization, Content-Type");
		}
		else {
			if (sessID != null && session != null) {
				level = 2;
			}
			else if (auth != null && verify(auth)) {
				session = new Session();
				
				level = 1;
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
	
	public void write(SocketChannel channel, ArrayList<String> resHeader, byte [] body) throws IOException {
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
	
	private String parseCookie(Map<String, String> header) {
		String value = header.get("cookie");
		String session = null;
		
		if (value != null) {
			String [] cookie = value.split("; ");
			
			for(int i=0, _i=cookie.length; i<_i; i++) {
				session = parseCookie(cookie[i]);
				
				if (session != null) {
					break;
				}
			}
		}
		
		return session;
	}
	
	private String parseCookie(String cookie) {
		String [] token = cookie.split("=");
		
		if (token.length == 2 && Header.SESS_ID.equals(token[0])) {
			return token[1];
		}
		
		return null;
	}
	
	private String parseAuth(Map<String, String> header) {
		String value = header.get("authorization");
		
		if (value != null) {
			String [] token = value.split("Basic ");
			
			if (token.length == 2) {
				try {
					return new String(Base64.getDecoder().decode(token[1]));
				} catch (Exception e) {
					return null;
				}
			}
		}
		
		return null;
	}
	
	private boolean verify(String auth) {
		String [] token = auth.split(":");
		
		if (token.length == 2) {
			Object data = this.database.get("account", token[0]);
			
			if (data != null) {
				try {
					return ((JSONObject)data).getString("password").equals(token[1]);
				}
				catch(JSONException jsone) {
					
				}
			}
		}
		
		return false;
	}
	
	private final void processRequest(JSONObject request, Session session) {
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
	
	private final void processEach(String tableName, JSONObject query) {
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
	private final void processEach(JSONObject query, String tableName, String command) {
		JSONObject data = this.database.get(tableName);
		
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
	private final void processEach(String tableName, String command, JSONArray data) {
		int length = data.length();
		
		while (length-- > 0) {
			this.database.add(tableName, null, data.getJSONObject(length));
		}
	}
	
	private final void processEach(String tableName, String command, JSONObject data) {
		@SuppressWarnings("unchecked")
		Iterator<String> iterator = data.keys();
		String key;
		
		while(iterator.hasNext()) {
			key = iterator.next();
			
			if (command.equals("get")) {
				data.put(key, this.database.get(tableName, key));
			}
			else if (command.equals("add")){
				data.put(key, this.database.add(tableName, key, data.getJSONObject(key)));
			}
			else if (command.equals("set")){
				if (tableName.equals("config")) {
					processEach(this.database.get("config"), data);
					
					data.put(key, true);
				}
				else {
					data.put(key, this.database.set(tableName, key, data.getJSONObject(key)));
				}
			}
			else if (command.equals("remove")){
				data.put(key, this.database.remove(tableName, key));
			}
			else {
				data.put(key, JSONObject.NULL);
			}
		}
	}

	private final void processEach (JSONObject config, JSONObject data) {
		@SuppressWarnings("unchecked")
		Iterator<String> iterator = data.keys();
		String key;
		
		while(iterator.hasNext()) {
			key = iterator.next();
			
			this.database.set("config", key, data.getString(key));
		}
	}
}
