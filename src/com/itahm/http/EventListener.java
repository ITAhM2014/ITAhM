package com.itahm.http;

import java.nio.channels.SocketChannel;

public interface EventListener {
	public void onConnect(SocketChannel channel);
	public void onClose(SocketChannel channel);
	public void onRequest(SocketChannel channel, Message request, Message response);
	public void onError(Exception e);
}
