;"use strict";

var elements = {};

(function (window, undefined) {
	var xhr, line, id, from, to, loading = true;
	
	window.addEventListener("load", onLoad, false);
	window.addEventListener("keydown", function (e) {
		if (e.keyCode == 27) {
			elements["form"].reset();
		}
	}, false);
	window.focus();
	
	window.load = load;
	
	function onLoad(e) {
		elements["body"] = document.getElementsByTagName("body")[0];
		elements["form"] = document.getElementById("form");
		elements["dev_from"] = document.getElementById("dev_from");
		elements["dev_to"] = document.getElementById("dev_to");
		elements["if_from"] = document.getElementById("if_from");
		elements["if_to"] = document.getElementById("if_to");
		elements["if_list_from"] = document.getElementById("if_list_from");
		elements["if_list_to"] = document.getElementById("if_list_to");
		elements["index"] = document.getElementById("index");
		elements["count"] = document.getElementById("count");
		elements["remove"] = document.getElementById("btn_remove");
		elements["bandwidth"] = document.getElementById("bandwidth");
		elements["unit"] = document.getElementById("unit");
		elements["name"] = document.getElementById("name");
		
		elements["form"].addEventListener("submit", onApply, false);
		elements["form"].addEventListener("reset", onCancel, false);
		
		xhr = new JSONRequest(top.server, onResponse);
	}
	
	function load(data) {
		init(data);
	}
	
	function init(data) {
		
		
		line = data.line;
		id = line.id;
		
		if (!line) {
			throw "InvalidArgumentException";
		}
		
		
		
		elements["index"].addEventListener("change", onSelectLink, false);
		elements["remove"].addEventListener("click", onRemove, false);
		
		sendRequest("device", "get", line.from, null);
		sendRequest("device", "get", line.to, null);
	}
	
	function loadend() {
		var linkArray = line.link,
			option,
			numLink,
			index = elements["index"];
		
		elements["dev_from"].textContent = from.name;
		elements["dev_to"].textContent = to.name;
		
		index.length = 0;
		
		if (linkArray) {
			numLink = linkArray.length;
			
			for (var i=0; i<numLink; i++) {
				option = document.createElement("option");
				option.text = i +1;
				option.value = i;
				
				index.add(option);
			}	
		}
		option = document.createElement("option");
		option.text = "new";
		option.value = -1;
		
		index.add(option);
		
		elements["count"].textContent = numLink;
		
		onSelectLink();
		
		top.clearScreen();
	}
	
	function sendRequest(database, command, key, value) {
		var request = {
				database: database,
				command: command,
				data: {
				}
			};
		
		request.data[key] = value;
		
		xhr.request(request);
	}
	
	function onApply(e) {
		e.preventDefault();
		
		var index = elements["index"].value;
		
		Line.set(line, index,
			elements["if_from"].value,
			elements["if_to"].value,
			elements["bandwidth"].value * elements["unit"].value,
			elements["name"].value);
		
		sendRequest("line", "put", id, line);
	}
	
	function onSelectLink(e) {
		var index = elements["index"].value,
			from = "",
			to = "",
			bandwidth = 100,
			unit = 1000000,
			name = "";
		
		if (index > -1) {
			var link = line.link[index];
			
			bandwidth = link.bandwidth,
			unit = 1;
			
			while (bandwidth >= 1000) {
				unit *= 1000;
				bandwidth /= 1000;
			}
			
			from = link.from;
			to = link.to;
			name = link.name;
		}
		
		elements["bandwidth"].value = bandwidth;
		elements["unit"].value = unit;
		elements["if_from"].value = from;
		elements["if_to"].value = to;
		elements["name"].value = name;
	}
	
	function onRemove(e) {
		e.preventDefault();
		
		var index = elements["index"].value;
		
		if (index < 0 || !confirm("remove this link?")) {	
			return;
		}
		
		Line.remove(line, index);
		
		if (Line.count(line) > 0) {
			sendRequest("line", "put", id, line);
		}
		else if (id != -1){
			sendRequest("line", "delete", id, null);
		}
		else {
			throw "fatal error";
		}
	}
	
	function onCancel(e) {
		top.closeDialog();
	}
	
	function onResponse(response) {
		if ("error" in response) {
			var status = response.error.status;
			
			if (status == 401) {
				top.signOut();
			}
		}
		else if ("json" in response) {
			var json = response.json,
				command = json.command,
				database = json.database,
				data = json.data;
			
			if (command === "put" || command === "delete") {
				line = data[id = Object.keys(data)[0]];
				
				top.openContent("map_edit.html");
				top.closeDialog();
			}
			else if (command == "get") {
				if (database === "device") {
					if (from) {
						to = data[Object.keys(data)[0]];
						
						if (to.profile && to.address) {
							sendRequest("snmp", "get", to.address, null);
						}
						
						loadend();
					}
					else {
						from = data[Object.keys(data)[0]];
						
						if (from.profile && from.address) {
							sendRequest("snmp", "get", from.address, null);
						}
					}
				}
				else if (database === "snmp") {
					var device = data[Object.keys(data)[0]],
						list;
					
					if (device.ip == from.address) {
						list = elements["if_list_from"];
					}
					else if (device.ip == to.address) {
						list = elements["if_list_to"];
					}
					
					var ifEntry = device["ifEntry"],
						fragment = document.createDocumentFragment(),
						port, option;
					
					for (var index in ifEntry) {
						port = ifEntry[index];
						option = document.createElement("option");
						option.textContent = port.ifName;
						option.title = port.ifDescr;
						
						fragment.appendChild(option);
					}
					
					list.appendChild(fragment);
				}
			}
		}
		else {
			throw "fatal error";
		}
	}
	
}) (window);