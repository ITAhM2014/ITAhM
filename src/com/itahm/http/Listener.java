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

import com.itahm.EventListener;
import com.itahm.ITAhMException;

public class Listener implements Runnable, Closeable {

	private final ServerSocketChannel channel;
	private final ServerSocket listener;
	private final Selector selector;
	private final Thread thread;
	private boolean shutdown;
	private final ByteBuffer buffer;
	private final EventListener itahm;
	
	public Listener(EventListener itahm) throws IOException {
		this(itahm , 80);
	}

	public Listener(EventListener handler, int tcp) throws IOException {
		channel = ServerSocketChannel.open();
		listener = channel.socket();
		selector = Selector.open();
		thread = new Thread(this);
		shutdown = false;
		buffer = ByteBuffer.allocateDirect(1024);
		itahm = handler;
		
		listener.bind(new InetSocketAddress(InetAddress.getByName("0.0.0.0"), tcp));
		channel.configureBlocking(false);
		channel.register(selector, SelectionKey.OP_ACCEPT);
		thread.start();
	}
	
	private void listen() throws IOException{
		Set<SelectionKey> selectedKeys = null;
		Iterator<SelectionKey> iterator = null;
		SelectionKey key = null;
		int count;
		
		while(!this.shutdown) {
			count = selector.select();
			
			if (count > 0) {
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
		
		System.out.println("shutdown");
	}
	
	private void onConnect(SocketChannel channel) throws IOException {
		channel.configureBlocking(false);
		channel.register(selector, SelectionKey.OP_READ, new Parser());
		
		this.itahm.onConnect(channel);
	}
	
	private Response getPreProcessMessage() throws IOException{
		Response response = new Response()
			.header("Access-Control-Allow-Headers", "Authorization, Content-Type")
			.header("Access-Control-Allow-Origin", "http://app.itahm.com")
			.header("Access-Control-Allow-Credentials", "true");
		
		return response;
	}
	
	private void preProcessRequest(SocketChannel channel) throws IOException{
		Response response = getPreProcessMessage();
		
		response.status(400, "Bad Request").header("Connection", "Close").send(channel, "");
	}
	
	private void preProcessRequest(SocketChannel channel, Request request) throws IOException{
		Response response = getPreProcessMessage();
		
		String method = request.method();
		
		if (!"HTTP/1.1".equals(request.version())) {
			response.status(505, "HTTP Version Not Supported").send(channel, "");
		}
		else {
			if ("OPTIONS".equals(method)) {
				response.status(200, "OK").header("Allow", "OPTIONS, POST, GET").send(channel, "");
			}
			else if ("POST".equals(method) || "GET".equals(method)) {
				this.itahm.onRequest(channel, request, response);
			}
			else {
				response.status(405, "Method Not Allowed").header("Allow", "OPTIONS, POST").send(channel, "");
			}
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
			catch (ITAhMException itahme) {
				preProcessRequest(channel);
			}
			
			this.buffer.clear();
		}
	}

	public void onClose(SocketChannel channel) throws IOException {
		this.itahm.onClose(channel);
		
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
			this.itahm.onError(ioe);
		}
	}

	public static void main(String[] args) throws IOException {
		final Listener listener = new Listener(new EventListener() {
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
			public void onRequest(SocketChannel channel, Request request, Response response) {
				
			}

			@Override
			public void onError(Exception e) {
				e.printStackTrace();
			}

			@Override
			public void onEvent() {
				// TODO Auto-generated method stub
				
			}
			
		}, 2015);

		Runtime.getRuntime().addShutdownHook(new Thread()
        {
            @Override
            public void run()
            {
            	try {
					listener.close();
				} catch (IOException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
	        }
        });
	}
	
}
