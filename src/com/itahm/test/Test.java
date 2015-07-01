package com.itahm.test;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationTargetException;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;
import java.util.Timer;
import java.util.TimerTask;
import java.util.Vector;

import org.json.JSONException;
import org.json.JSONObject;
import org.snmp4j.smi.IpAddress;
import org.snmp4j.smi.OID;

import com.itahm.ITAhMException;
import com.itahm.json.JSONFile;

public class Test {
	public Test() {
		int i=0;
		do {
			System.out.println(i);
			if (true) {
				i++;
				continue;
			}
		}
		while(i < 5);
		
	}
	
	public static void main (String [] args) throws IOException  {
		
		new Test();
	}
	
}
