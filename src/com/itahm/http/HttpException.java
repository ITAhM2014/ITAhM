package com.itahm.http;

public class HttpException extends RuntimeException {

	private static final long serialVersionUID = 1L;

	public HttpException() {
	}
	
	public HttpException(String message) {
		super(message);
	}

}
