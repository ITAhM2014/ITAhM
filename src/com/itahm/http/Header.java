package com.itahm.http;

public final class Header {

	public final static String CONN_CLOSE = "Connection: Close\r\n";
	public final static String CONN_KA = "Connection: Keep-Alive\r\n";
	public final static String LEN = "Content-Length: %d\r\n";
	public final static String SESS_ID = "SESSID";
	public final static String COOKIE = "Set-Cookie: "+ SESS_ID +"=%s; HttpOnly\r\n";
	public final static String CRLF = "\r\n";
	public final static byte CR = (byte)'\r';
	public final static byte LF = (byte)'\n';
	
}
