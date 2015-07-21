;"use strict";
var arguments = arguments;

if (!arguments || !arguments["server"] || !arguments["device"] ) {
	//alert("can not open monitor.\n"+"try again.");
	
	//window.close();
}

//var server = arguments["server"],
//	ip = arguments["device"]["address"],

var server = "127.0.0.1:2014",
	ip = "127.0.0.1",
	elements = {};

document.title = "ITAhM["+ ip +"]";

(function (window, undefined) {
	var xhr, form, device, ifentry, chart, selectedPort,
		realTimeData = {
			hrProcessorLoad: {},
			hrStorageUsed: {},
			ifInOctets: {},
			ifOutOctets: {}
		},
		savedBase, savedScale,
		checkboxList = [],
		colorIndex, colorArray = ["#f00", "#0f0", "#00f", "#ff0", "#f0f", "#0ff", "#800", "#080", "#008", "#880", "#808", "#088"];
	
	window.addEventListener("load", onLoad, false);
	window.addEventListener("message", onMessage, false);
	
	function onLoad(e) {
		elements["body"] = document.getElementsByTagName("body")[0];
		elements["status"] = document.getElementById("txt_status");
		elements["ip"] = document.getElementById("ip");
		elements["name"] = document.getElementById("txt_name");
		elements["uptime"] = document.getElementById("txt_uptime");
		elements["description"] = document.getElementById("txt_description");
		elements["enterprise"] = document.getElementById("txt_enterprise");
		elements["cpu_list"] = document.getElementById("cpu_list");
		elements["mem_list"] = document.getElementById("mem_list");
		elements["disk_list"] = document.getElementById("disk_list");
		elements["port_list"] = document.getElementById("port_list");
		elements["memory"] = document.getElementById("memory");
		elements["traffic"] = document.getElementById("traffic");
		elements["zoomin"] = document.getElementById("btn_zoomin");
		elements["zoomout"] = document.getElementById("btn_zoomout");
		elements["cpu_notes"] = document.getElementById("cpu_notes");
		elements["check_cpu"] = document.getElementById("check_cpu");
		elements["check_mem"] = document.getElementById("check_mem");
		elements["check_disk"] = document.getElementById("check_disk");
		elements["check_port"] = document.getElementById("check_port");
		elements["switch"] = document.getElementById("switch");
		elements["range"] = document.getElementById("range");
		elements["title"] = document.getElementById("title");
		
		form = document.getElementById("form");
		ifentry = document.getElementById("ifentry");
		
		elements["check_cpu"].addEventListener("click", onCheckResource.bind(elements["check_cpu"], elements["cpu_list"]), false);
		elements["check_mem"].addEventListener("click", onCheckResource.bind(elements["check_mem"], elements["mem_list"]), false);
		elements["check_disk"].addEventListener("click", onCheckResource.bind(elements["check_disk"], elements["disk_list"]), false);
		elements["check_port"].addEventListener("click", onCheckResource.bind(elements["check_port"], elements["port_list"]), false);
		elements["switch"].addEventListener("change", onChangeSwitch, false);
		
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
	
	function load(deviceObject) {
		var cpuList, memList, diskList, portList, storage, port, obj,
			li, checkbox;
		
		device = deviceObject;
		
		elements["ip"].textContent = ip;
		elements["status"].textContent = device.timeout > 0? "down ("+ new Date(device.timeout) +")": "up";
		elements["uptime"].textContent = Uptime.toString(device["hrSystemUptime"]);
		elements["name"].textContent = device["sysName"];
		elements["description"].textContent = device["sysDescr"];
		elements["enterprise"].textContent = sysObjectID(device["sysObjectID"]);
		elements["title"].textContent = device["sysName"] +"["+ ip +"]";
		
		elements["body"].classList.remove("loading");
		
		chart = new Chart({
			id: "chart",
			zoom: "auto",
			color: "#000",
			onreset: onReset,
			onchange: onChangeBase
		});
		
		/**
		 * cpu
		 */
		cpuList = elements["cpu_list"];
		for (index in device["hrProcessorEntry"]) {
			checkbox = document.createElement("input");
			checkbox.type = "checkbox";
			checkbox.dataset["database"] = "processor";
			checkbox.dataset["index"] = index;
			checkbox.dataset["entry"] = "hrProcessorEntry";
			checkbox.onchange = onChangeResource;
			checkboxList[checkboxList.length] = checkbox;
			
			li = document.createElement("li");
			li.appendChild(checkbox);
			li.appendChild(document.createElement("span")).textContent = "index."+ index;
			
			cpuList.appendChild(li);
			
			realTimeData["hrProcessorLoad"][index] = {};
		}
		
		/**
		 * storage
		 */
		memList = elements["mem_list"];
		diskList = elements["disk_list"];
		obj = device["hrStorageEntry"];
		
		for (index in device["hrStorageIndex"]) {
			storage = obj[index];
			
			checkbox = document.createElement("input");
			checkbox.type = "checkbox";
			checkbox.dataset["database"] = "storage";
			checkbox.dataset["index"] = index;
			checkbox.dataset["entry"] = "hrStorageEntry";
			checkbox.onchange = onChangeResource;
			checkboxList[checkboxList.length] = checkbox;
			
			li = document.createElement("li");
			li.appendChild(checkbox);
			
			/**
			 * physical memory
			 */
			if (storage["hrStorageType"] === 2) {
				li.appendChild(document.createElement("span")).textContent = "index."+ index;
				
				memList.appendChild(li);
			}
			/**
			 * non-removable storage
			 */
			else if (storage["hrStorageType"] === 4) {
				li.appendChild(document.createElement("span")).textContent = storage["hrStorageDescr"];
				
				diskList.appendChild(li);
			}
			
			realTimeData["hrStorageUsed"][index] = {};
		}
		
		/**
		 * interface
		 */
		portList = elements["port_list"];
		obj = device["ifEntry"];
		for (index in device["ifIndex"]) {
			port = obj[index];
			
			checkbox = document.createElement("input");
			checkbox.type = "checkbox";
			checkbox.dataset["database"] = "traffic";
			checkbox.dataset["index"] = index;
			checkbox.dataset["entry"] = "ifEntry";
			checkbox.onchange = onChangeResource;
			checkboxList[checkboxList.length] = checkbox;
			
			li = document.createElement("li");
			li.title = port["ifDescr"];
			li.appendChild(checkbox);
			li.appendChild(document.createElement("span")).textContent = port["ifName"];
			
			portList.appendChild(li);
			
			realTimeData["ifInOctets"][index] = {};
		}
	}
	
	function update(device) {
		var checkbox,
			entry, key,
			date = new Date(device["lastResponse"]);
		
		date.setMilliseconds(0);
		key = date.getTime();
		
		for (var i=0, length=checkboxList.length; i<length; i++) {
			checkbox = checkboxList[i];
			
			if (checkbox.checked === true) {
				entry = checkbox.dataset["entry"];
				index = checkbox.dataset["index"];
				
				if (entry === "hrProcessorEntry") {
					realTimeData["hrProcessorLoad"][index][key] = device[entry][index];
					
					chart.draw(realTimeData["hrProcessorLoad"][index]);
				}
				else if (entry === "hrStorageEntry") {
					realTimeData["hrStorageUsed"][index][key] = device[entry][index]["hrStorageUsed"];
					
					chart.draw(realTimeData["hrStorageUsed"][index]);
				}
				else if (entry === "ifEntry") {
					realTimeData["ifInOctets"][index][key] = device[entry][index]["ifInOctets"];
					
					chart.draw(realTimeData["ifInOctets"][index]);
					
					realTimeData["ifOutOctets"][index][key] = device[entry][index]["ifOutOctets"];
					
					chart.draw(realTimeData["ifOutOctets"][index]);
				}
			}
		}
		
		console.log(realTimeData["hrProcessorLoad"][4]);
		
		setTimeout(sendRequest.bind(window, "realtime"), 1000);
	}
	
	function onChangeBase(origin, base) {
		if (elements["switch"].value === "log") {
			elements["range"].textContent = new Date(origin) +" ~ "+ new Date(base);
		}
	}
	
	function onChangeSwitch(e) {
		if (this.value === "log") {
			chart.setBase(savedBase);
			chart.setScale(savedScale);
		}
		else {
			chart.setScale(0);
			
			/*realTimeData = {
				hrProcessorLoad: {},
				hrStorageUsed: {},
				ifInOctets: {},
				ifOutOctets: {}
			};*/
			
			elements["range"].textContent = "real time";
		}
		
		chart.clear();
	}
	
	function onReset(base, size, scale) {
		if (elements["switch"].value === "log") {
			var checkbox;
		
			savedBase = base;
			savedScale = scale;
			
			for (var i=0, length=checkboxList.length; i<length; i++) {
				checkbox = checkboxList[i];
				
				if (checkbox.checked === true) {
					sendRequest(checkbox.dataset["database"], scale, Number(checkbox.dataset["index"]), base, size);
				}
			}
		}
		else {
			sendRequest("realtime");
		}
	}
	
	function onCheckResource(list, e) {
		var checked = this.checked,
			item = list.firstChild;
		
		while (item) {
			item.firstChild.checked = checked;
			
			item = item.nextSibling;
		}
		
		onChangeResource();
	}
	
	function onChangeResource(entry, index) {
		chart.clear();
	}
	
	function sendRequest(database, scale, index, base, size) {
		var o = null,
			request = {
				database: database,
				command: "get",
				data: {}
			};
		
		o = {
			base: base || null,
			size: size || null,
			scale: scale || null,
			index: index || null
		};
		
		request.data[ip] = o;
		
		xhr.request(request);
	}
	
	function drawGraph(database, data) {
		if (database === "traffic") {
			chart.draw(data["ifInOctets"]);
			chart.draw(data["ifOutOctets"]);
		}
		else {
			chart.draw(data);
		}
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
			
			if (json.command === "get") {
				if (json.database == "snmp") {
					if (!device) {
						load(json.data[ip]);
					}
				}
				else if (json.database === "realtime") {
					if (elements["switch"].value !== "log") {
						update(json.data[ip]);
					}
				}
				else {
					drawGraph(json.database, json.data[ip]);
				}
			}
		}
		else {
			throw "fatal error";
		}
	}
	
}) (window);
