function JSONRequest() {
	this.init(arguments);
}

(function( window, undefined ) {

	JSONRequest.prototype = {
		init: function (args) {
			if (args && args.length > 1) {
				init.call(this, args[0], args[1]);
			};
		},
		
		request: function (json) {
			var data;
	
			try {
				data = JSON.stringify(json);
			}
			catch (e) {
				return false;
			}
			
			if (this.wait) {
				//this.queue.push(send.bind(this, data));
				this.queue[this.queue.length] = send.bind(this, data);
			}
			else {
				send.call(this, data);
			}
			
			return true;
		},
		
		set: function (name, value) {
			this.header[name] = value;
			
			return this;
		}
		
	};

	function init(url, callback) {
		this.xhr = new XMLHttpRequest();
		
		this.header = {};
		this.open = this.xhr.open.bind(this.xhr, "POST", "http://"+ url, true);
		this.onload = onLoad.bind(this, callback);
		this.onerror = onError.bind(this, callback);
		this.wait = false;
		this.queue = [];
	}
	
	function send(data) {
		// abort 등 network error에 의해 xhr이 닫힌 경우
		if (this.xhr === undefined) {
			this.xhr = new XMLHttpRequest();
		}
		
		this.open();
		
		this.xhr.withCredentials = true;

		for (var name in this.header) {
			this.xhr.setRequestHeader(name, this.header[name]);
		}
		
		this.header = {};
		
		this.xhr.onload = this.onload;
		this.xhr.onerror = this.xhr.ontimeout = this.xhr.onabort = this.onerror;
		
		this.xhr.send(data);
		
		this.wait = true;
	}
	
	function onLoad(callback) {
		if (callback) {
			if (this.xhr.status == 200) {
				var responseText = this.xhr.responseText;
				
				if (responseText === "") {
					callback({json: null});
				}
				else {
					var json;
					
					try {
						json = JSON.parse(responseText);
					}
					catch (e) {
						callback({error: {text: "invalid json response", status: 0}});
					}
					
					callback({json: json});
				}
			}
			else {
				callback({error: {text: this.xhr.statusText, status: this.xhr.status}});
			}
		}
		
		if (this.queue.length > 0) {
			this.queue.shift()();
		}
		else {
			this.wait = false;
		}
	}
	
	function onError(callback, e) {
		if (callback) {
			callback({error: {text: e.type, status: 0}});
		}
	}
	
})( window );
