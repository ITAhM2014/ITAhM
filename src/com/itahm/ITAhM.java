package com.itahm;

import java.io.Closeable;
import java.io.File;
import java.io.IOException;

import org.json.JSONObject;

import com.itahm.http.Session;
import com.itahm.json.JSONFile;

public class ITAhM implements Closeable {

	//private final String root;
	private final Http httpServer;
	//private final Snmp snmpServer;
	private final JSONFile account;
	
	public ITAhM(int udpPort, String path) throws IOException {
		//root = path;
		httpServer = new Http(this);
		//snmpServer = new Snmp(path);
		account = new JSONFile();
		
		account.load(new File(path, "account"));
		
		System.out.println(account.getJSONObject().length());
	}

	public boolean login(String user, String password) {
		return true;
	}
	
	public void processRequest(JSONObject json, Session session) {
		
	}

	public void stop() {
		try {
			close();
		} catch (IOException ioe) {
			ioe.printStackTrace();
		}
	}
	
	@Override
	public void close() throws IOException {
		this.account.close();
	}
	
	public static void main(String [] args) {
		try (ITAhM itahm = new ITAhM(2014, "c:\\Project\\test")) {
			System.out.println("service start");
			System.in.read();
			System.out.println("service end");
		} catch (IOException e) {
			e.printStackTrace();
		}
	}
}
