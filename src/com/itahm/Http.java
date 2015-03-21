package com.itahm;

import java.io.Closeable;
import java.io.IOException;
import java.nio.channels.SocketChannel;

import org.json.JSONObject;

import com.itahm.http.Handler;
import com.itahm.http.Message;
import com.itahm.http.Listener;
import com.itahm.http.Session;

public class Http implements Handler, Closeable {

	private final ITAhM itahm;
	private final Listener listener;
	
	public Http(ITAhM itahm) throws IOException {
		this.itahm = itahm;
		listener = new Listener(this);
		// TODO Auto-generated constructor stub
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
	public void onRequest(SocketChannel channel, Message request) {
		if (request == null) {
			// bad request
			
			try {
				new Message("HTTP/1.1 400 Bad Request").set("Connection", "Close").send(channel);
			} catch (IOException ioe) {
				// TODO fatal error
				
				ioe.printStackTrace();
			}
			
			return;
		}
		
		String requestLine = request.get();
		Message response = new Message("HTTP/1.1 200 OK")
				.set("Access-Control-Allow-Headers", "Authorization, Content-Type")
				.set("Access-Control-Allow-Origin", "http://local.itahm.com")
				.set("Access-Control-Allow-Credentials", "true");
		
		String [] token = requestLine.split(" ");
		
		if (token[0].equals("OPTIONS")) {
			try {
				response.send(channel);
			} catch (IOException ioe) {
				ioe.printStackTrace();
				
				this.itahm.stop();
			}
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
				if (this.itahm.login(user, request.password())) {
					session = new Session();
					
					level = 1;
				}
			}
			
			
			switch (level) {
			case 1:
				response.set("Set-Cookie", "SESSID="+ session.getID() +"; HttpOnly");
				
			case 2:
				
				JSONObject json = new JSONObject(new String(request.body()));
				
				itahm.processRequest(json, session);
				
				try {
					response.send(channel, json.toString());
				} catch (IOException e) {
					e.printStackTrace();
					
					this.itahm.stop();
				}
				
				break;
				
			default:
				try {
					new Message("HTTP/1.1 401 Unauthorized").set("Connection", "Close").send(channel);
				} catch (IOException e) {
					e.printStackTrace();
					
					this.itahm.stop();
				}
			}
		}
	}

	@Override
	public void onError(Exception e) {
		e.printStackTrace();
		
		this.itahm.stop();
	}

	@Override
	public void close() throws IOException {
		this.listener.close();
	}
	
	public static void main(String [] args) {
		
	}

}
