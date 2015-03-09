package com.itahm.http;

import java.io.Closeable;
import java.io.IOException;
import java.nio.channels.Selector;
import java.nio.channels.SocketChannel;
import java.util.Iterator;
import java.util.Map;
import java.util.Timer;
import java.util.TimerTask;
import java.util.concurrent.ConcurrentHashMap;

import com.itahm.Logger;
import com.itahm.Server;

public class TCPTimer extends TimerTask implements Closeable {
	private final static String LOG_RESET = "tcp session %s reset";
	//final static int TIME_OUT = 1000*60;
	private final static int TIME_OUT = 1000*10;
	
	private final Selector selector;
	private final  Timer timer = new Timer(true);
	private final Map<SocketChannel, Long> sessions = new ConcurrentHashMap<SocketChannel, Long>();
	private final static Logger logger = Server.getLogger();
	
	public TCPTimer(Selector selector) {
		this.selector = selector;
		this.timer.schedule(this, TIME_OUT); 
	}

	/*
	 * PUBLIC
	 */
	
	@Override
	public void close() throws IOException {
		this.timer.cancel();
		
		Iterator<SocketChannel> iterator = this.sessions.keySet().iterator();
		
		while(iterator.hasNext()) {
			try {
				Server.reset(iterator.next());
			} catch (IOException ioe) {
				ioe.printStackTrace();
			}
		}
		
		this.sessions.clear();
	}
	
	/*
	 * DEFAULT
	 */
	
	public final int size() {
		return this.sessions.size();
	}
	
	public final void update(SocketChannel channel, long time) {
		this.sessions.put(channel, time);
	}
	
	public final void remove(SocketChannel channel) {
		this.sessions.remove(channel);
	}
	
	public final void cleanUp() {
		
	}

	@Override
	public void run() {
		Iterator<SocketChannel> iterator = this.sessions.keySet().iterator();
		SocketChannel channel;
		long now = System.currentTimeMillis();
		
		while(iterator.hasNext()) {
			channel = iterator.next();
			if(now - this.sessions.get(channel) > TIME_OUT *2) {
				try {
					logger.log(String.format(LOG_RESET, Server.getAddress(channel)));
					
					Server.reset(channel);
					
					this.selector.wakeup();// important!
					
					iterator.remove();
				} catch (IOException e) {
					e.printStackTrace();
				}
			}
		}
	}
	
}
