;"use strict";

function InetAddress(bytes) {
	this.init(bytes);
}

(function( window, undefined ) {
	InetAddress.getByCode = function (code) {
		if (code != null && code.constructor == String && code.length == 4) {
			try {
				return new InetAddress([code.charCodeAt(0), code.charCodeAt(1), code.charCodeAt(2), code.charCodeAt(3)]);
			}
			catch (e) {
				console.log(e);
			}
		}
		
		return null;
	};

	InetAddress.getByAddress = function (addr) {
		if (addr != null && addr.constructor == String) {
			try {
				return new InetAddress(addr.match(/^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/));
			}
			catch (e) {
				console.log(e);
			}
		}
		
		return null;
	};

	InetAddress.prototype = {
		init: function (bytes) {
			if (bytes != null && bytes.constructor == Array && bytes.length == 4
				&& bytes[0] == (bytes[0] & 0xff)
				&& bytes[1] == (bytes[1] & 0xff)
				&& bytes[2] == (bytes[2] & 0xff)
				&& bytes[3] == (bytes[3] & 0xff)) {
				this.bytes = new Array(4);
				
				this.bytes[0] = bytes[0];
				this.bytes[1] = bytes[1];
				this.bytes[2] = bytes[2];
				this.bytes[3] = bytes[3];
			}
			else {
				throw "InvalidArguments";
			}
		},
		
		getAddress: function () {
			return this.bytes;
		},
		
		getCode: function () {
			return String.fromCharCode(this.bytes[0])
				+ String.fromCharCode(this.bytes[1])
				+ String.fromCharCode(this.bytes[2])
				+ String.fromCharCode(this.bytes[3]);
		},
		
		toString: function () {
			return this.bytes[0] +"."+ this.bytes[1] +"."+ this.bytes[2] +"."+ this.bytes[3];
		}
	};
	
}) (window);