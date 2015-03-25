package com.itahm;

import java.io.Closeable;
import java.io.IOException;
import java.nio.channels.SocketChannel;

import org.json.JSONException;
import org.json.JSONObject;

import com.itahm.http.EventListener;
import com.itahm.http.Message;
import com.itahm.http.Listener;
import com.itahm.http.Session;

public class ITAhM implements EventListener, Closeable {

	private final Listener listener;
	
	public ITAhM(int udpPort, String path) throws IOException {
		listener = new Listener(this, udpPort);
		// TODO Auto-generated constructor stub
	}

	private boolean login(String user, String password) {
		return true;
	}
	
	private void processRequest(JSONObject json, Session session) {
		try {
			String command = json.getString("command");
			
			if ("logout".equals(command)) {
				session.close();
				
				json.put("result", true);
			}
			else {
				processRequest(json, command);
			}
		}
		catch(JSONException jsone) {
			
		}
	}
	
	private void processRequest(JSONObject json, String command) {
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
		
		if (cookie != null) {System.out.println("got cookie");
			session = Session.find(cookie);
		}
		
		if (session == null) {System.out.println("invalid session");
			if (user != null){System.out.println("user attempt login");
				if (login(user, request.password())) {
					session = Session.getInstance();
					System.out.println("issue a session");
					response.cookie(session.getID());
				}
			}
		}
		else {
			System.out.println("got session");
		}
		
		if (session == null) {
			try {
				response.set("HTTP/1.1 401 Unauthorized").send(channel);
			} catch (IOException ioe) {
				ioe.printStackTrace();
				
				stop();
			}
			
			return;
		}
		
		session.update();
		
		response.set("HTTP/1.1 200 OK");
		
		try {
			try {
				JSONObject json = new JSONObject(new String(request.body()));
				
				processRequest(json, session);
				
				response.send(channel, json.toString());
			}
			catch (JSONException jsone) {
				// maybe empty body
				
				response.send(channel);
			}
		} catch (IOException e) {
			e.printStackTrace();
		
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
		}
	}
	
}
