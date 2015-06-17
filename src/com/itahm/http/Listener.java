package com.itahm.http;

import java.io.Closeable;
import java.io.IOException;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.nio.ByteBuffer;
import java.nio.channels.SelectionKey;
import java.nio.channels.Selector;
import java.nio.channels.ServerSocketChannel;
import java.nio.channels.SocketChannel;
import java.util.Iterator;
import java.util.Set;

public class Listener implements Runnable, Closeable {

	private final ServerSocketChannel channel;
	private final ServerSocket listener;
	private final Selector selector;
	private final Thread thread;
	private boolean shutdown;
	private final ByteBuffer buffer;
	private final EventListener server;
	
	public Listener(EventListener server) throws IOException {
		this(server , 80);
	}

	public Listener(EventListener handler, int tcp) throws IOException {
		channel = ServerSocketChannel.open();
		listener = channel.socket();
		selector = Selector.open();
		thread = new Thread(this);
		shutdown = false;
		buffer = ByteBuffer.allocateDirect(1024);
		server = handler;
		
		listener.bind(new InetSocketAddress(InetAddress.getByName("0.0.0.0"), tcp));
		channel.configureBlocking(false);
		channel.register(selector, SelectionKey.OP_ACCEPT);
		thread.start();
	}
	
	private void listen() throws IOException{
		Set<SelectionKey> selectedKeys = null;
		Iterator<SelectionKey> iterator = null;
		SelectionKey key = null;
		
		while(!this.shutdown) {
			if (selector.select() > 0) {
				selectedKeys = selector.selectedKeys();
	
				iterator = selectedKeys.iterator();
				while(iterator.hasNext()) {
					key = iterator.next();
					iterator.remove();
					
					if (key.isAcceptable()) {
						onConnect(channel.accept());
					}
					else if (key.isReadable()) {
						onRead((SocketChannel)key.channel(), (Parser)key.attachment());
					}
				}
			}
		}
	}
	
	private void onConnect(SocketChannel channel) throws IOException {
		channel.configureBlocking(false);
		channel.register(selector, SelectionKey.OP_READ, new Parser());
		
		this.server.onConnect(channel);
	}
	
	private void preProcessRequest(SocketChannel channel, Message request) throws IOException{
		Message response = new Message()
			.set("Access-Control-Allow-Headers", "Authorization, Content-Type")
			//.set("Access-Control-Allow-Origin", "http://local.itahm.com")
			.set("Access-Control-Allow-Origin", "http://app.itahm.com")
			.set("Access-Control-Allow-Credentials", "true");
		
		if (request != null) {
			String method = request.method();
			
			if (!"HTTP/1.1".equals(request.version())) {
				response.status("HTTP/1.1 505 HTTP Version Not Supported").send(channel);
			}
			else {
				if ("OPTIONS".equals(method)) {
					response.status("HTTP/1.1 200 OK").set("Allow", "OPTIONS, POST").send(channel);
				}
				else if ("POST".equals(method)) {
					this.server.onRequest(channel, request, response);
				}
				else {
					response.status("HTTP/1.1 405 Method Not Allowed").set("Allow", "OPTIONS, POST").send(channel);
				}
			}
		}
		else {
			response.status("HTTP/1.1 400 Bad Request").set("Connection", "Close").send(channel);
		}
	}
	
	private void onRead(SocketChannel channel, Parser 	parser) throws IOException {
		this.buffer.clear();
		
		if (channel.read(this.buffer) == -1) {
			onClose(channel);
		}
		else {
			this.buffer.flip();
			
			try {
				if (parser.update(this.buffer)) {
					
					preProcessRequest(channel, parser.message());
					
					parser.clear();
				}
				// else continue
			}
			catch (HttpException pe) {pe.printStackTrace();
				preProcessRequest(channel, null);
			}
			
			this.buffer.clear();
		}
	}

	public void onClose(SocketChannel channel) throws IOException {
		this.server.onClose(channel);
		
		channel.close();
	}
	
	@Override
	public void close() throws IOException {
		if (this.shutdown) {
			return;
		}
			
		this.shutdown = true;
			
		this.selector.wakeup();
		
		try {
			this.thread.join();
		} catch (InterruptedException ie) {
		}
	}

	@Override
	public void run() {
		try {
			listen();
			
			this.shutdown = true;
			
			this.selector.close();
			this.listener.close();
		}
		catch(IOException ioe) {
			this.server.onError(ioe);
		}
	}

	public static void main(String[] args) throws IOException {
		try (Listener listener = new Listener(new EventListener() {

			@Override
			public void onConnect(SocketChannel channel) {
				try {
					System.out.println("connect >> "+ channel.getRemoteAddress());
				} catch (IOException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
			}

			@Override
			public void onClose(SocketChannel channel) {
				try {
					System.out.println("close >> "+ channel.getRemoteAddress());
				} catch (IOException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
			}

			@Override
			public void onRequest(SocketChannel channel, Message request, Message response) {
				try {
					System.out.println("request >> "+ channel.getRemoteAddress());
				} catch (IOException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
			}

			@Override
			public void onError(Exception e) {
				// TODO Auto-generated method stub
				
			}
			
		}, 2014);
		) {
			System.in.read();
			
			listener.close();
		}
		
	}
	
}
