package com.itahm.test;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.Calendar;

interface Iaa {
	public void test();
}

public class Test {
	public Test() {
		System.out.println(this);
	}
	
	public static Iaa f1 () {
		return new Iaa() {
			public void test() {
				System.out.println(this);
			}
		};
	}
	
	public static void main (String [] args) throws IOException {
	
		System.out.println(Calendar.getInstance().getTimeInMillis());
		
	}
	
}
