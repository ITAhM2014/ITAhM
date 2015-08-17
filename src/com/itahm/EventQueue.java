package com.itahm;

import com.itahm.json.Event;

public class EventQueue {

	private final Event [] queue;
	private final int capacity;
	private int position;
	
	public EventQueue(int size) {
		capacity = size;
		queue = new Event [size];
		position = 0;
	}

	public void push(Event event) {
		if (++this.position == this.capacity) {
			this.position = 0;
		}
		
		this.queue[this.position] = event;
	}
	
	public Event get(int index) {
		return this.queue[index];
	}
	
}
