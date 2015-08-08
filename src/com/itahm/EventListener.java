package com.itahm;

import java.nio.channels.SocketChannel;

import com.itahm.http.Request;
import com.itahm.http.Response;
import com.itahm.json.Event;

public interface EventListener {
	public void onConnect(SocketChannel channel);
	public void onClose(SocketChannel channel);
	public void onRequest(SocketChannel channel, Request request, Response response);
	public void onError(Exception e);
	public void onEvent(Event event);
}
