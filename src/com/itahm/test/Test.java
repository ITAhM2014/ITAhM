package com.itahm.test;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.Calendar;

public class Test {
	public Test() {
		System.out.println(this);
	}
	
	public static void main (String [] args) throws IOException {
	
		
		new File(new File("c:\\Project"), "test1\\test2\\test3").mkdirs();
		
	}
	
}
