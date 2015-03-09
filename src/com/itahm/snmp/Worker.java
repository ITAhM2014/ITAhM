package com.itahm.snmp;

import java.io.IOException;

public interface Worker {
	public void work(Node node, boolean success, String msg) throws IOException;
}