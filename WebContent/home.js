;"use strict";
var elements = {};

(function (window, undefined) {
	var xhr, form, ifentry, cpu, memory, traffic, selectedPort, node, colorIndex,
		color = ["#00f", "#0f0", "#f00", "#ff0", "#f0f", "#0ff", "#008", "#080"];
	
	window.addEventListener("load", onLoad, false);
	window.addEventListener("message", onMessage, false);
	
	function onLoad(e) {
		elements["body"] = document.getElementsByTagName("body")[0];
		elements["status"] = document.getElementById("txt_status");
		elements["ip"] = document.getElementById("txt_ip");
		elements["name"] = document.getElementById("txt_name");
		elements["uptime"] = document.getElementById("txt_uptime");
		elements["description"] = document.getElementById("txt_description");
		elements["enterprise"] = document.getElementById("txt_enterprise");
		
		elements["zoomin"] = document.getElementById("btn_zoomin");
		elements["zoomout"] = document.getElementById("btn_zoomout");
		
		form = document.getElementById("form");
		ifentry = document.getElementById("ifentry");
		
		elements["zoomin"].addEventListener("click", onZoomIn, false);
		elements["zoomout"].addEventListener("click", onZoomOut, false);
		
		xhr = new JSONRequest(top.location.search.replace("?", ""), onResponse);
		
		sendRequest("snmp");
	}
	
	function onMessage(e) {
		var data = e.data;
		
		if (!data) {
			return;
		}
		
		switch(data.message) {
		}
	}
	
	function getMemoryIndex() {
		var hrStorageEntry = node["hrStorageEntry"],
			indexs = Object.keys(hrStorageEntry),
			storage;
		
		indexs.sort();
		for (var i=0, _i=indexs.length; i<_i; i++) {
			storage = hrStorageEntry[indexs[i]];
			
			if (storage["hrStorageType"] == 2) {
				return indexs[i];
			} 
		}
	}
	
	function getMaxMemory() {
		var hrStorageEntry = node["hrStorageEntry"],
			storage = hrStorageEntry[getMemoryIndex()];
			
		return storage["hrStorageSize"];
	}
	
	function getDefaultPort() {
		var entry = node.ifEntry,
			max = -1,
			port;
		
		for (var index in entry) {
			port = entry[index];
			
			if (Math.max(port.ifHCInOctets || port.ifInOctets, port.ifHCOutOctets || port.ifOutOctets) > max) {
				selectedPort = port;
			}
		}
	}
	
	function load(json) {
		node = json["127.0.0.1"];
		
		getDefaultPort();
		
		cpu = new Chart("cpu", 100, 100, "100%", onRedrawCPU);
		
		var maxMemory = getMaxMemory(node);
		memory = new Chart("memory", 100, maxMemory, maxMemory+ "MB", onRedrawMemory);
		
		var maxSpeed = selectedPort["ifSpeed"];
		traffic = new Chart("traffic", 100, maxSpeed, Bandwidth.toString(maxSpeed), onRedrawTraffic);
		
		document.getElementById("selectedPort").textContent = selectedPort["ifName"];
		
		if (node.timeout > 0) {
			elements["status"].textContent = "down ("+ new Date(node.timeout) +")";
			elements["status"].classList.add("down");
		}
		else {
			elements["status"].textContent = "up";
			elements["status"].classList.remove("down");
		}
		
		elements["ip"].textContent = "127.0.0.1";
		
		elements["uptime"].textContent = Uptime.toString(node["hrSystemUptime"]);
		
		elements["name"].textContent = node.sysName;
		elements["description"].textContent = node.sysDescr;
		elements["enterprise"].textContent = sysObjectID(node["sysObjectID"]);
		
		/*
		var index
		for (index in node.hrProcessorLoad) {
			cpu.appendChild(document.createElement("li")).textContent = node.hrProcessorLoad[index] +" %";
		}
		*/
		for (index in node["ifEntry"]) {
			initIFEntry(node["ifEntry"][index]);
		}
	}
	
	function initIFEntry(port) {
		var tr = ifentry.insertRow(),
			aStatus = ifAdminStatus[port.ifAdminStatus],
			oStatus = ifOperStatus[port.ifOperStatus],
			ifHCInOctets = port.ifHCInOctets,
			ifHCOutOctets = port.ifHCOutOctets;
		
		tr.insertCell().textContent = port.ifName;
		tr.insertCell().textContent = ifType[port.ifType] || "unknown";
		tr.insertCell().textContent = port.ifSpeed;
		tr.insertCell().textContent = aStatus;
		tr.insertCell().textContent = oStatus;
		tr.insertCell().textContent = ifHCInOctets != undefined? ifHCInOctets: port.ifInOctets;
		tr.insertCell().textContent = ifHCOutOctets != undefined? ifHCOutOctets: port.ifOutOctets;
		
		tr.title = port.ifDescr;
		
		tr.className = aStatus == "up" && oStatus == "up"? "up": "";
		
		tr.onclick = onSelectPort.bind(this, port);
	}
	
	function drawCPU(data) {
		cpu.draw(data, color[colorIndex++]);
		
	}
	
	function drawMemory(data) {
		//memory.begin(getMaxMemory(node)+ "MB");
		memory.draw(data, "orange");
		memory.end();
	}
	
	function drawTraffic(data) {
		//traffic.begin(Bandwidth.toString(selectedPort["ifSpeed"]));
		traffic.draw(data["ifInOctets"], "blue");
		traffic.draw(data["ifOutOctets"], "red");
		traffic.end();
	}
	
	function onZoomIn() {
		cpu.tmp(true);
	}
	
	function onZoomOut() {
		cpu.tmp(false);
	}

	function onSelectPort(port) {
		selectedPort = port;
		
		document.getElementById("selectedPort").textContent = selectedPort["ifName"];
		
		traffic = new Chart("traffic", 100, selectedPort["ifSpeed"], onRedrawTraffic);
	}
	
	function sendRequest(database, base, size, scale, index) {
		var o = null;
		
		if (arguments.length > 1) {
			o = {
				base: base,
				size: size,
				scale: scale,
				index: index
			};
		}
		
		xhr.request( {
			database: database,
			command: "get",
			data: {
				"127.0.0.1": o
			}
		});
	}
	
	function onRedrawCPU(base, size, scale) {
		colorIndex = 0;
		
		for (var index in node["hrProcessorEntry"]) {
			sendRequest("cpu", base, size, scale, index);
		}
	}
	
	function onRedrawMemory(base, size, scale) {
		sendRequest("memory", base, size, scale, getMemoryIndex());
	}
	
	function onRedrawTraffic(base, size, scale) {
		sendRequest("traffic", base, size, scale, selectedPort["ifIndex"]);
	}
	
	function loadEnd() {
		elements["body"].classList.remove("loading");
	}
	
	function onResponse(response) {
		if ("error" in response) {
			var status = response.error.status;
			
			if (status == 401) {
				top.postMessage({
					message: "unauthorized"
				}, "*");
			}
		}
		else if ("json" in response) {
			var json = response.json;
			
			switch (json.command) {
			case "get":
				if (json.database == "snmp") {
					loadEnd();
					
					load(json.data);
				}
				else {
					var data = json.data["127.0.0.1"];
					switch(json.database) {
					case "cpu":
						drawCPU(data);
						
						break;
					case "memory":
						drawMemory(data);
						
						break;
					case "traffic":
						drawTraffic(data);
						
						break;
					}
				}
				
				break;
			}
		}
		else {
			throw "fatal error";
		}
	}
	
}) (window);