;"use strict";
var arguments = arguments;

if (!arguments || !arguments["server"] || !arguments["device"] ) {
	//alert("can not open monitor.");
	
	//window.close();
	throw "test";
}

var server = arguments["server"],
	ip = arguments["device"]["address"];
	elements = {};

(function (window, undefined) {
	var xhr, form, device, ifentry, cpuChart, memoryChart, trafficChart, selectedPort, colorIndex,
		curFocusedChart, curFocusedElement,
		schedule,
		colors = ["#f00", "#0f0", "#00f", "#ff0", "#f0f", "#0ff", "#800", "#080", "#008", "#880", "#808", "#088"];
	
	window.addEventListener("load", onLoad, false);
	window.addEventListener("message", onMessage, false);
	window.addEventListener("click", onBlur, false);
	window.addEventListener("mousewheel", onWheel, false);
	
	function onLoad(e) {
		elements["body"] = document.getElementsByTagName("body")[0];
		elements["status"] = document.getElementById("txt_status");
		elements["ip"] = document.getElementById("txt_ip");
		elements["name"] = document.getElementById("txt_name");
		elements["uptime"] = document.getElementById("txt_uptime");
		elements["description"] = document.getElementById("txt_description");
		elements["enterprise"] = document.getElementById("txt_enterprise");
		elements["cpu"] = document.getElementById("cpu");
		elements["memory"] = document.getElementById("memory");
		elements["traffic"] = document.getElementById("traffic");
		elements["zoomin"] = document.getElementById("btn_zoomin");
		elements["zoomout"] = document.getElementById("btn_zoomout");
		elements["cpu_notes"] = document.getElementById("cpu_notes");
		
		form = document.getElementById("form");
		ifentry = document.getElementById("ifentry");
		
		elements["cpu"].addEventListener("click", onFocus, false);
		elements["cpu"].addEventListener("mouseout", onBlur, false);
		elements["memory"].addEventListener("click", onFocus, false);
		elements["memory"].addEventListener("mouseout", onBlur, false);
		elements["traffic"].addEventListener("click", onFocus, false);
		elements["traffic"].addEventListener("mouseout", onBlur, false);
		
		elements["zoomin"].addEventListener("click", onZoomIn, false);
		elements["zoomout"].addEventListener("click", onZoomOut, false);
		
		xhr = new JSONRequest(server, onResponse);
		
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
		var hrStorageEntry = device["hrStorageEntry"],
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
		var hrStorageEntry = device["hrStorageEntry"],
			index = getMemoryIndex(),
			storage = hrStorageEntry[index];
			
		return Math.round(storage["hrStorageSize"] * storage["hrStorageAllocationUnits"] /1024 /1024);
	}
	
	function getDefaultPort() {
		var entry = device.ifEntry,
			max = -1,
			port;
		
		for (var index in entry) {
			port = entry[index];
			
			if (Math.max(port.ifHCInOctets || port.ifInOctets, port.ifHCOutOctets || port.ifOutOctets) > max) {
				selectedPort = port;
			}
		}
	}
	
	function load() {
		getDefaultPort();
		
		cpuChart = new Chart("cpu", 100, "100%", onRedrawCPU);
		memoryChart = new Chart("memory", 100, getMaxMemory(device) + "MB", onRedrawMemory);
		trafficChart = new Chart("traffic", 100, Bandwidth.toString(selectedPort["ifSpeed"]), onRedrawTraffic);
		
		document.getElementById("selectedPort").textContent = selectedPort["ifName"];
		
		if (device.timeout > 0) {
			elements["status"].textContent = "down ("+ new Date(device.timeout) +")";
			elements["status"].classList.add("down");
		}
		else {
			elements["status"].textContent = "up";
			elements["status"].classList.remove("down");
		}
		
		elements["ip"].textContent = "127.0.0.1";
		
		elements["uptime"].textContent = Uptime.toString(device["hrSystemUptime"]);
		
		elements["name"].textContent = device.sysName;
		elements["description"].textContent = device.sysDescr;
		elements["enterprise"].textContent = sysObjectID(device["sysObjectID"]);
		
		var colorIndex = 0,
			index,
			processor,
			notes = elements["cpu_notes"];
		
		for (index in device["hrProcessorEntry"]) {
			processor = document.createElement("span");
			notes.appendChild(processor);
			processor.textContent = " processor"+ index;
			processor.style.color = colors[colorIndex++];
		}
		
		for (index in device["ifEntry"]) {
			initIFEntry(device["ifEntry"][index]);
		}
		
		loadEnd();
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
		cpuChart.draw(data, colors[colorIndex++]);
	}
	
	function drawMemory(data) {
		memoryChart.draw(data, "orange");
		//memoryChart.end();
	}
	
	function drawTraffic(data) {
		trafficChart.draw(data["ifInOctets"], "#0f0");
		trafficChart.draw(data["ifOutOctets"], "#f80");
	}
	
	function onZoomIn() {
		cpuChart.zoom(true);
	}
	
	function onZoomOut() {
		cpuChart.zoom(false);
	}

	function onWheel(e) {
		if (!curFocusedChart) {
			return;
		}
	
		e.preventDefault();
	
		clearTimeout(schedule);
	
		schedule = setTimeout(function () {	
			curFocusedChart.zoom(e.wheelDelta > 0? true: false);
		}, 100);
	}	
	
	function onFocus(e) {
		e.stopPropagation();
		
		onBlur();
		
		var element = this,
			id = element.id;
		
		if (id == "cpu") {
			curFocusedChart = cpuChart;
		}
		else if (id == "memory") {
			curFocusedChart = memoryChart;
		}
		else if (id == "traffic") {
			curFocusedChart = trafficChart
		}
		
		curFocusedElement = element;
		
		element.classList.add("focused");
	}
	
	function onBlur() {
		if (curFocusedElement) {
			curFocusedElement.classList.remove("focused");
		}
		
		curFocusedElement = undefined;
		curFocusedChart = undefined;
	}
	
	function onSelectPort(port) {
		selectedPort = port;
		
		document.getElementById("selectedPort").textContent = selectedPort["ifName"];
		
		trafficChart = new Chart("traffic", 100, selectedPort["ifSpeed"], onRedrawTraffic);
	}
	
	function sendRequest(database, base, size, scale, index) {
		var o = null,
			request = {
				database: database,
				command: "get",
				data: {}
			};
		
		if (arguments.length > 1) {
			o = {
				base: base,
				size: size,
				scale: scale,
				index: index
			};
		}
		
		request.data[ip] = o;
		
		xhr.request(request);
	}
	
	function onRedrawCPU(base, size, scale) {
		colorIndex = 0;
		
		for (var index in device["hrProcessorEntry"]) {
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
					device = json.data[ip];
					
					load();
				}
				else {
					var data = json.data[ip];
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
