;"use strict";
var itahm;

function ITAhM() {
	this.init(arguments);
}

(function (window, undefined) {

	var doc = document,
		xhr = undefined,
		popup = undefined,
		mask = undefined,
		deviceList = undefined,
		lineList = undefined,
		deviceDialog = undefined,
		map = undefined,
		setting = undefined;
	
	ITAhM.prototype = {
	
		init: function () {
			
		},
		
		request: function (request) {
			mask.classList.add("show");
			
			xhr.request(request);
		},
		
		login: function (server, username, password) {
			mask.classList.add("show");
			
			sessionStorage.setItem("server", server);
			
			new JSONRequest(server, onResponse).set("Authorization", "Basic "+ btoa(username +":"+ password)).request({echo: null});
		},
		
		popup: function () {
			if (arguments.length > 0) {
				popup.show(arguments[0], arguments[1], arguments[2], arguments[3]);
			}
			else {
				popup.hide();
			}
		},
		
		getLine: function (from, to) {
			return lineList.get(from, to);
		},
		
		getDevice: function (id) {
			return deviceList.get(id);
		}
	}
	
	function onLoad(e) {
		var server = sessionStorage.getItem("server");
		
		itahm = new ITAhM();
		popup = new PopUp();
		
		mask = doc.getElementById("mask");
		
		popup.add("login", new LoginDialog);
		popup.add("device", deviceDialog = new DeviceDialog);
		popup.add("line", new LineDialog);
		popup.add("account", new AccountDialog);
		popup.add("snmp", new SnmpDialog);
		
		doc.getElementById("logout").addEventListener("click", function (e) {
			itahm.request({logout: null});
		}, false);
				
		if (server) {
			new JSONRequest(server, onResponse.bind(this)).request({echo: null});
		}
		else {
			itahm.popup("login");
			
			mask.classList.remove("show");
		}
		
		doc.body.classList.remove("loading");
	}	

	function onLoadSuccess(e) {
		xhr = new JSONRequest(sessionStorage.getItem("server"), onResponse.bind(this));
		
		
		deviceList = new DeviceList();
		lineList = new LineList();
		map = new Map();
		setting = new Setting();
		
		xhr.request({
			device: {
				get: null
			}
		});
		
		xhr.request({
			line: {
				get: null
			}
		});
		
		itahm.popup();
		//sendRequest("device", null);
	}

	function onLoadFail(e) {
		
		mask.classList.remove("show");
	}
	
	
	function onResponse (response) {
		var data,
			error;
		
		if ("error" in response) {
			error = response.error;
			
			var msg = doc.getElementById("login_fail");
			
			if (error.status == 401) {
				msg.textContent = "unauthorized. please check server, username, password and try log in.";
			}
			else {
				msg.textContent = ("server error" + response.error.text);
			}
			
			itahm.popup("login");
		}
		else {
			data = response.json;
			
			for (var command in data) {
				switch (command) {
				case "echo":
					onLoadSuccess();
					
					break;
				
				case "logout":
					location.reload();
					
					break;
					
				case "account":
					var accountObject = data[command];
					
					if (accountObject) {
						for (var command in accountObject) {
							if (command == "get") {
								setting.set({
									account: accountObject["get"]
								});
							}
							else if (command == "set") {
								console.log(accountObject);
							}
						}
						
					}
					
					break;
				
				case "profile":
					var profileObject = data["profile"];
					
					for (var command in profileObject) {
						if (command == "get") {
							var profiles = profileObject["get"];
							setting.profile(profiles);
							deviceDialog.profile(profiles);
						}
						else if (command == "set") {
							//console.log(configObject);
						}
					}
					
					break;
					
				case "config":
					var configObject = data["config"];
					
					for (var command in configObject) {
						if (command == "get") {
							setting.set(configObject["get"]);
						}
						else if (command == "set") {
							console.log(configObject);
						}
					}
					
					break;
					
				case "device":
					var device = data["device"];
					
					for (var command in device) {
						if (command == "get") {
							deviceList.reload(device["get"]);
							
							map.set("device", device["get"]);
						}
					}
					
					break;
				
				case "line":
					var line = data["line"];
					
					for (var command in line) {
						if (command == "get") {
							lineList.reload(line["get"]);
							
							map.set("line", line["get"]);
						}
					}
					
					break;
					
				case "logout":
					location.href = "/itahm/html/nms/login.html";
					
					break;
					
				default:
					throw "unknown command: "+ command;
				}
			}
		}
			
		mask.classList.remove("show");
	}
	
	window.addEventListener("load", onLoad, false);
	
})(window);



