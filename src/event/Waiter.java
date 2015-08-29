package event;

import java.io.IOException;
import java.nio.channels.SocketChannel;

import com.itahm.http.Response;

public class Waiter {

	private SocketChannel channel;
	private Response response;
	private final int index;
	private Waiter next;

	public Waiter(int index) {
		this.index = index;
	}
	
	public Waiter(SocketChannel channel, Response response, int index) {
		this.channel = channel;
		this.response = response;
		this.index = index;
	}

	public void set(SocketChannel channel, Response response) {
		this.channel = channel;
		this.response = response;
	}
	
	public int index() {
		return this.index;
	}
	
	public SocketChannel getChannel() {
		return this.channel;
	}
	
	public void checkout(Event event) throws IOException {
		if (this.response != null && this.channel != null) {
			this.response.status(200, "OK").send(this.channel, event.toString());
		}
	}
	
	public void next(Waiter waiter) {
		this.next = waiter;
	}
	
	public Waiter next() {
		return this.next;
	}
}
