;"use strict";

(function (window, undefined) {
	var xhr, form, ifentry, cpu, memory, traffic, selectedPort, node;
	
	window.addEventListener("load", onLoad, false);
	window.addEventListener("message", onMessage, false);
	
	function onLoad(e) {
		form = document.getElementById("form");
		ifentry = document.getElementById("ifentry");
		
		xhr = new JSONRequest(top.location.search.replace("?", ""), onResponse);
		
		xhr.request( {
			database: "snmp",
			command: "get",
			data: {
				"127.0.0.1": null
			}
		});
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
			
		return Math.round(storage["hrStorageSize"] * storage["hrStorageAllocationUnits"] /1024 /1024);
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
		
		cpu = new Chart("cpu", 100, 100, onRedrawCPU);
		memory = new Chart("memory", 100, getMaxMemory(node), onRedrawMemory);
		traffic = new Chart("traffic", 100, selectedPort["ifSpeed"], onRedrawTraffic);
		
		document.getElementById("selectedPort").textContent = selectedPort["ifName"];
		
		if (node.timeout > 0) {
			form.elements["status"].value = "down ("+ new Date(node.timeout) +")";
			form.elements["status"].classList.add("down");
		}
		else {
			form.elements["status"].value = "up";
			form.elements["status"].classList.remove("down");
		}
		
		form.elements["ip"].value = "127.0.0.1";
		
		form.elements["uptime"].value = Uptime.toString(node["hrSystemUptime"]);
		
		form.elements["name"].value = node.sysName;
		form.elements["descr"].value = node.sysDescr;
		form.elements["enterprise"].value = sysObjectID(node.sysObjectID);
		
		/*
		var index
		for (index in node.hrProcessorLoad) {
			cpu.appendChild(document.createElement("li")).textContent = node.hrProcessorLoad[index] +" %";
		}
		*/
		for (index in node.ifEntry) {
			initIFEntry(node.ifEntry[index]);
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
		var color = ["#00f", "#0f0", "#f00", "#ff0", "#f0f", "#0ff"],
			colorIndex = 0;
		
		cpu.begin("100%");
		
		for (var index in data) {
			cpu.draw(data[index], color[colorIndex++]);
		}
			
		cpu.end();
	}
	
	function drawMemory(data) {
		memory.begin(getMaxMemory(node)+ "MB");
		memory.draw(data, "orange");
		memory.end();
	}
	
	function drawTraffic(data) {
		traffic.begin(Bandwidth.toString(selectedPort["ifSpeed"]));
		traffic.draw(data["ifInOctets"], "blue");
		traffic.draw(data["ifOutOctets"], "red");
		traffic.end();
	}
	
	function onSelectPort(port) {
		selectedPort = port;
		
		document.getElementById("selectedPort").textContent = selectedPort["ifName"];
		
		traffic = new Chart("traffic", 100, selectedPort["ifSpeed"], onRedrawTraffic);
	}
	
	function sendRequest(database, base, size, scale, index) {
		xhr.request( {
			database: database,
			command: "get",
			data: {
				"127.0.0.1": {
					base: base,
					size: size,
					scale: scale,
					index: index
				}
			}
		});
	}
	
	function onRedrawCPU(base, size, scale) {
		sendRequest("cpu", base, size, scale);
	}
	
	function onRedrawMemory(base, size, scale) {
		sendRequest("memory", base, size, scale, getMemoryIndex());
	}
	
	function onRedrawTraffic(base, size, scale) {
		sendRequest("traffic", base, size, scale, selectedPort["ifIndex"]);
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