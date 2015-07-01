package com.itahm.test;

import java.io.Closeable;
import java.util.*;

public class Test2 {
	
	private static enum En {
		e1, e2, e3
	}
	
	public Test2() {
	}
	
	public static void main (String [] args) {
		HashMap <En, String> map = new HashMap <En, String> ();
		
        for (En e :En.values()) {
        	map.put(e, e.name());
        	System.out.println(e.name());
        }
	}

}
