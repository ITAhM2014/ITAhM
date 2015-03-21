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
import com.itahm.http.HttpException;
import com.itahm.http.Message;
import com.itahm.http.Parser;
import com.itahm.http.Response;
import com.itahm.http.TCPTimer;
//import com.itahm.snmp.Manager;
//import com.itahm.snmp.Worker;

// TODO: Auto-generated Javadoc
/**
 * The Class Server.
 */
public class Server implements Runnable, Closeable  {
	
	/** The Constant LOG_CONN. */
	private final static String LOG_CONN = "tcp session %s start";
	
	/** The Constant LOG_CLOSE. */
	private final static String LOG_CLOSE = "tcp session %s end";
	
	/** The Constant LOG_ERR_SERVER. */
	private final static String LOG_ERR_SERVER = "socket server exception : %s";
	
	/** The Constant LOG_ERR_CLIENT. */
	private final static String LOG_ERR_CLIENT = "socket client [%s] exception : %s";
	
	/** The Constant BUFF_SIZE. */
	final static int BUFF_SIZE = 2048;
	
	/** The logger. */
	private static Logger logger;
	
	/** The database. */
	private static Database database;
	//private final Manager snmpManager;
	//private final Worker snmpWorker;
	/** The listener. */
	private ServerSocket listener;
	
	/** The channel. */
	private final ServerSocketChannel channel = ServerSocketChannel.open();
	
	/** The selector. */
	private final Selector selector = Selector.open();
	
	/** The tcp timer. */
	private final TCPTimer tcpTimer;
	
	/** The shutdown. */
	private boolean shutdown = false;
	
	/** The buffer. */
	private final ByteBuffer buffer = ByteBuffer.allocateDirect(BUFF_SIZE);
	
	/**
	 * Instantiates a new server.
	 *
	 * @param udpPort the udp port
	 * @param root the root
	 * @throws IOException Signals that an I/O exception has occurred.
	 */
	public Server(int udpPort, String root) throws IOException {
		logger = new Logger(root);
		database = new Database(root);
//		snmpManager = new Manager();
//		snmpWorker = new Snmp(root);
		
	//	snmpManager.setWorker(snmpWorker);
		
		this.tcpTimer = new TCPTimer(this.selector);
		
		bind(udpPort);
		
		new Thread(this).start();
	}
	
	/**
	 * Bind.
	 *
	 * @param udpPort the udp port
	 * @throws IOException Signals that an I/O exception has occurred.
	 */
	private void bind(int udpPort) throws IOException {
		this.listener = this.channel.socket();
		
		this.listener.bind(new InetSocketAddress(InetAddress.getByName("0.0.0.0"), udpPort));
		
		channel.configureBlocking(false);
		
		channel.register(selector, SelectionKey.OP_ACCEPT);
	}
	
	/*
	 * PUBLIC 
	 */
	
	/**
	 * Gets the logger.
	 *
	 * @return the logger
	 */
	public static Logger getLogger() {
		return logger;
	}
	
	/**
	 * Gets the database.
	 *
	 * @return the database
	 */
	public static Database getDatabase() {
		return database;
	}
	
	/**
	 * Database.
	 *
	 * @return the database
	 */
	public static Database database() {
		return database;
	}
	
	/**
	 * Gets the address.
	 *
	 * @param channel the channel
	 * @return the address
	 */
	public static final String getAddress(SocketChannel channel) {
		try {
			InetSocketAddress sockAddr = (InetSocketAddress)channel.getRemoteAddress();
			
			return sockAddr.getAddress().getHostAddress() +":"+ sockAddr.getPort();
		}
		catch (IOException ioe) {
			return null;
		}
	}

	/**
	 * Reset.
	 *
	 * @param channel the channel
	 * @throws IOException Signals that an I/O exception has occurred.
	 */
	public static final void reset(SocketChannel channel ) throws IOException {
		Socket socket = channel.socket();
		
		socket.setSoLinger(true, 0);
		socket.close();
	}
	
	/**
	 * Tcp session count.
	 *
	 * @return the int
	 */
	public int tcpSessionCount() {
		return this.tcpTimer.size();
	}
	
	/* (non-Javadoc)
	 * @see java.lang.Runnable#run()
	 */
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
	
	/* (non-Javadoc)
	 * @see java.io.Closeable#close()
	 */
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
	
	/**
	 * Listen.
	 *
	 * @throws IOException Signals that an I/O exception has occurred.
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
	
	/**
	 * On connect.
	 *
	 * @param channel the channel
	 */
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
	
	/**
	 * On read.
	 *
	 * @param channel the channel
	 * @param parser the parser
	 */
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
					
					if (parser.update(this.buffer)) {System.out.println(9);
						Response.ok(channel, parser.message());
						
						parser.clear();
						//new Response(channel, parser);
					}
					// else continue
				}
				catch (HttpException pe) {
					//new Response().write(channel);
					new Message("HTTP/1.1 400 Bad Request").set("Connection", "Close").send(channel);
				}
				
				this.buffer.clear();
			}
		} catch (IOException ioe) {
			// channel.read, parser.parse, channel.write 시 exception
			onError(channel, ioe);
		}
	}

	/**
	 * On close.
	 *
	 * @param channel the channel
	 */
	public void onClose(SocketChannel channel) {
		logger.log(String.format(LOG_CLOSE, getAddress(channel)));
		
		try {
			channel.close();
			
			this.tcpTimer.remove(channel);
		} catch (IOException e) {
			e.printStackTrace();
		}
	}
	
	/**
	 * On error.
	 *
	 * @param e the e
	 */
	private void onError(Exception e) {
		logger.log(String.format(LOG_ERR_SERVER, e));
	}

	/**
	 * On error.
	 *
	 * @param channel the channel
	 * @param e the e
	 */
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

	/**
	 * The main method.
	 *
	 * @param args the arguments
	 * @throws IOException Signals that an I/O exception has occurred.
	 */
	public static void main (String [] args) throws IOException {
		String root = "";
		Server server;
		
		if (args.length > 0) {
			root = args[0];
		}
		
		server = new Server(2014, root);
		
		System.in.read();
		
		server.close();
	}
	
}
