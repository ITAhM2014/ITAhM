package com.itahm.http;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.Charset;
import java.nio.charset.CharsetDecoder;

import org.json.JSONException;
import org.json.JSONObject;

// TODO: Auto-generated Javadoc
/**
 * The Class Parser.
 */
public class Parser {
	
	/**
	 * The Enum Status.
	 */
	private static enum Status {
		
		/** The init. */
		init,
		
		/** The header. */
		header,
		
		/** The body. */
		body,
		
		/** The closed. */
		closed
	}
	
	/** The message. */
	private final Message message;
	
	/** The buffer. */
	private byte [] buffer;
	
	/** The content length. */
	private int contentLength = -1;
	
	/** The body. */
	private final ByteArrayOutputStream body;
	
	/** The status. */
	private Status status;
	
	/** The decoder. */
	private final CharsetDecoder decoder;
	
	/**
	 * Instantiates a new parser.
	 */
	public Parser() {
		message = new Message();
		body = new ByteArrayOutputStream();
		status = Status.init;
		decoder = Charset.forName("UTF-8").newDecoder();
	}
	
	/**
	 * Update.
	 *
	 * @param src the src
	 * @return true, if successful
	 * @throws IOException Signals that an I/O exception has occurred.
	 */
	public boolean update(ByteBuffer src) throws IOException {
		try {
			switch(this.status) {
			case init:
				return parseRequest(src);
				
			case header:
				return parseHeader(src);
				
			case body:
				return parseBody(src);
				
			default:
				return false;
			}
		}
		catch (HttpException pe) {
			this.status = Status.closed;
			
			throw pe;
		}
	}
	
	/**
	 * Message.
	 *
	 * @return the message
	 */
	public Message message() {
		return this.message;
	}
	
	/**
	 * Body.
	 *
	 * @return the JSON object
	 *
	public JSONObject body() {
		byte [] body = this.body.toByteArray();
		
		try {
			return body.length > 0? new JSONObject(this.decoder.decode(ByteBuffer.wrap(body)).toString()): null;
		} catch (JSONException | CharacterCodingException e) {
			return null;
		}
	}
	*/
	
	/**
	 * client가 socket이 닫히지 않은 상태로 재요청 하게되면 parser도 재활용됨.
	 */
	public void clear() {
		this.body.reset();
		this.message.clear();
	}
	
	/**
	 * Parses the request.
	 *
	 * @param src the src
	 * @return true, if successful
	 * @throws IOException Signals that an I/O exception has occurred.
	 */
	private boolean parseRequest(ByteBuffer src) throws IOException {
		String line = readLine(src);
		
		if (line == null) {
			// line을 얻지 못함. Listener의 다음 call을 기대함
			// 사실 발생하면 안되는...
			return false;
		}
		
		if (line.length() == 0) {
			//규약에 의해 request-line 이전의 빈 라인은 무시한다.
			return parseRequest(src);
		}
		
		// request-line 파싱
		String [] token = line.split(" ");
		if (token.length != 3 || !(token[0].equals("POST") || token[0].equals("OPTIONS")) || !token[2].equals("HTTP/1.1")) {
			throw new HttpException("invalid request line");
		}
		
		this.message.set(line);
		
		this.status = Status.header;
		
		return parseHeader(src);
	}
	
	/**
	 * Parses the header.
	 *
	 * @param src the src
	 * @return true, if successful
	 * @throws IOException Signals that an I/O exception has occurred.
	 */
	private boolean parseHeader(ByteBuffer src) throws IOException {
		String line = readLine(src);
		
		if (line == null) {
			// line을 얻지 못함. Listener의 다음 call을 기대함
			
			return false;
		}
		
		// header-field 파싱
		if (line.length() > 0) {
			int index = line.indexOf(":");
			
			if (index == -1) {
				throw new HttpException("invalid header field");
			}
			
			this.message.set(line.substring(0, index).toLowerCase(), line.substring(index + 1).trim());
			
			return parseHeader(src);
		}
		
		// header 파싱 완료
		String value = this.message.get("content-length");
		
		this.contentLength = 0;
		
		if (value != null) {
			try {
				this.contentLength = Integer.parseInt(value);
			}
			catch(NumberFormatException nfe) {
				throw new HttpException(String.format("invalid content-length %s", value));
			}
		}
		
		src.compact().flip();
		
		this.status = Status.body;
		
		return parseBody(src);
	}
	
	/**
	 * Parses the body.
	 *
	 * @param src the src
	 * @return true, if successful
	 * @throws IOException Signals that an I/O exception has occurred.
	 */
	private boolean parseBody(ByteBuffer src) throws IOException {
		byte [] bytes = new byte[src.limit()];
		
		src.get(bytes);
		this.body.write(bytes);
		
		int length = this.body.size();
		
		if (length < this.contentLength) {
			return false;
		}
		
		if (length > this.contentLength) {
			throw new HttpException(String.format("out of content length %d/%d", length, this.contentLength));
		}
		
		// body 조합 완료
		this.message.set(this.body.toByteArray());
		this.status = Status.init;
		
		return true;
	}
	
	/**
	 * Read line.
	 *
	 * @param src the src
	 * @return the string
	 * @throws IOException Signals that an I/O exception has occurred.
	 */
	private String readLine(ByteBuffer src) throws IOException {
		ByteArrayOutputStream buffer = new ByteArrayOutputStream();
		
		if (this.buffer != null) {
			buffer.write(this.buffer);
			
			this.buffer = null;
		}
		
		int b;
		
		while(src.hasRemaining()) {
			b = src.get();
			buffer.write(b);
			
			if (b == Message.LF) {
				String line = readLine(buffer.toByteArray());
				if (line != null) {
					return line;
				}
			}
		}
		
		this.buffer = buffer.toByteArray();
		
		return null;
	}
	
	/**
	 * Read line.
	 *
	 * @param src the src
	 * @return the string
	 * @throws IOException Signals that an I/O exception has occurred.
	 */
	private String readLine(byte [] src) throws IOException {
		int length = src.length;
		
		if (length > 1 && src[length - 2] == Message.CR) {
			return new String(src, 0, length -2);
		}
		
		return null;
	}
	
}
