package com.itahm;

import java.io.Closeable;
import java.io.IOException;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.ByteBuffer;
import java.nio.channels.ClosedSelectorException;
import java.nio.channels.SelectionKey;
import java.nio.channels.Selector;
import java.nio.channels.ServerSocketChannel;
import java.nio.channels.SocketChannel;
import java.util.Iterator;
import java.util.Set;

import com.itahm.database.Database;
import com.itahm.http.ParseException;
import com.itahm.http.Parser;
import com.itahm.http.Response;
import com.itahm.http.TCPTimer;
import com.itahm.snmp.Manager;
import com.itahm.snmp.Worker;

public class Server implements Runnable, Closeable  {
	private final static String LOG_CONN = "tcp session %s start";
	private final static String LOG_CLOSE = "tcp session %s end";
	private final static String LOG_ERR_SERVER = "socket server exception : %s";
	private final static String LOG_ERR_CLIENT = "socket client [%s] exception : %s";
	
	final static int BUFF_SIZE = 2048;
	
	private static Logger logger;
	private static Database database;
	private final Manager snmpManager;
	private final Worker snmpWorker;
	private ServerSocket listener;
	private final ServerSocketChannel channel = ServerSocketChannel.open();
	private final Selector selector = Selector.open();
	private final TCPTimer tcpTimer;
	
	private boolean shutdown = false;
	private final ByteBuffer buffer = ByteBuffer.allocateDirect(BUFF_SIZE);
	
	public static void main (String [] args) {
		String root = "";
		
		if (args.length > 0) {
			root = args[0];
		}
		
		try {
			new Server(2014, root);
		} catch (Exception e) {
			e.printStackTrace();
		}
		
	}
	
	public Server(int udpPort, String root) throws IOException {
		logger = new Logger(root);
		database = new Database(root);
		snmpManager = new Manager();
		snmpWorker = new Snmp(root);
		
		snmpManager.setWorker(snmpWorker);
		
		this.tcpTimer = new TCPTimer(this.selector);
		
		bind(udpPort);
		
		new Thread(this).start();
	}
	
	private void bind(int udpPort) throws IOException {
		this.listener = this.channel.socket();
		
		this.listener.bind(new InetSocketAddress(InetAddress.getByName("0.0.0.0"), udpPort));
		
		channel.configureBlocking(false);
		
		channel.register(selector, SelectionKey.OP_ACCEPT);
	}
	
	/*
	 * PUBLIC 
	 */
	
	public static Logger getLogger() {
		return logger;
	}
	
	public static Database getDatabase() {
		return database;
	}
	
	public static Database database() {
		return database;
	}
	
	public static final String getAddress(SocketChannel channel) {
		try {
			InetSocketAddress sockAddr = (InetSocketAddress)channel.getRemoteAddress();
			
			return sockAddr.getAddress().getHostAddress() +":"+ sockAddr.getPort();
		}
		catch (IOException ioe) {
			return null;
		}
	}

	public static final void reset(SocketChannel channel ) throws IOException {
		Socket socket = channel.socket();
		
		socket.setSoLinger(true, 0);
		socket.close();
	}
	
	public int tcpSessionCount() {
		return this.tcpTimer.size();
	}
	
	@Override
	public void run() {
		try {
			listen();
		}
		catch(IOException e) {
			onError(e);
		}
		
		if (!listener.isClosed()) {
			try {
				listener.close();				
			}
			catch(IOException ioe) {
				ioe.printStackTrace();
				
				onError(ioe);
			}
		}
		
		try {
			this.tcpTimer.close();
		} catch (IOException ioe) {
			ioe.printStackTrace();
			
			onError(ioe);
		}
	}
	
	@Override
	public synchronized void close() {
		shutdown = true;
		
		try {
			selector.close();
		} catch (IOException ioe) {
			onError(ioe);
		}
		
		try {
			listener.close();
		}
		catch (IOException ioe) {
			onError(ioe);
		}
	}

	/*
	 * PRIVATE
	 */
	
	private void listen() throws IOException{
		Set<SelectionKey> selectedKeys = null;
		Iterator<SelectionKey> iterator = null;
		SelectionKey key = null;
		try {
			while(selector.select() > 0) {
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
		catch (ClosedSelectorException cse) {
			if (!shutdown) {
				throw cse;
			}
		}
	}
	
	private void onConnect(SocketChannel channel) {
		try {
			channel.configureBlocking(false);
			channel.register(selector, SelectionKey.OP_READ, new Parser());
			
			this.tcpTimer.update(channel, System.currentTimeMillis());
			
			logger.log(String.format(LOG_CONN, getAddress(channel)));
		} catch (IOException e) {
			onError(e);
		}
	}
	
	private void onRead(SocketChannel channel, Parser 	parser) {
		this.tcpTimer.update(channel, System.currentTimeMillis());
		
		this.buffer.clear();
		
		try {
			if (channel.read(this.buffer) == -1) {
				// 정상 종료
				
				onClose(channel);
			}
			else {
				this.buffer.flip();
				
				try {
					
					if (parser.parse(this.buffer)) {
						new Response(channel, parser);
					}
					// else continue
				}
				catch (ParseException pe) {pe.printStackTrace();
					//new Response().write(channel);
					new Response(channel);
				}
				
				this.buffer.clear();
			}
		} catch (IOException ioe) {
			// channel.read, parser.parse, channel.write 시 exception
			onError(channel, ioe);
		}
	}

	public void onClose(SocketChannel channel) {
		logger.log(String.format(LOG_CLOSE, getAddress(channel)));
		
		try {
			channel.close();
			
			this.tcpTimer.remove(channel);
		} catch (IOException e) {
			e.printStackTrace();
		}
	}
	
	private void onError(Exception e) {
		logger.log(String.format(LOG_ERR_SERVER, e));
	}

	private void onError(SocketChannel channel, Exception e) {
		logger.log(String.format(LOG_ERR_CLIENT, getAddress(channel), e));
		
		// 리셋 채널
		try {
			reset(channel);
		} catch (IOException ioe) {
			ioe.printStackTrace();
		}
		
		this.tcpTimer.remove(channel);
	}

}
