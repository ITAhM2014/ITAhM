package com.itahm;

import java.nio.channels.SocketChannel;

import com.itahm.http.Message;

public interface EventListener {
	public void onConnect(SocketChannel channel);
	public void onClose(SocketChannel channel);
	public void onRequest(SocketChannel channel, Message request, Message response);
	public void onError(Exception e);
	public void onEvent();
}
