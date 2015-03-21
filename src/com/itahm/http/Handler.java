package com.itahm.http;

import java.nio.channels.SocketChannel;

public interface Handler {
	public void onConnect(SocketChannel channel);
	public void onClose(SocketChannel channel);
	public void onRequest(SocketChannel channel, Message message);
	public void onError(Exception e);
}
