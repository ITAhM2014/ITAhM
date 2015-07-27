;"use strict";

var elements = {};

(function (window, undefined) {
	var xhr, form, device, ifentry, chart, selectedPort,
		realTimeData = {
			hrProcessorLoad: {},
			hrStorageUsed: {},
			ifInOctets: {},
			ifOutOctets: {}
		},
		realTimeQueue = [],
		savedBase, savedScale,
		checkboxList = [],
		colorIndex, colorArray = ["#f00", "#0f0", "#00f", "#ff0", "#f0f", "#0ff", "#800", "#080", "#008", "#880", "#808", "#088"];
	
	window.addEventListener("load", onLoad, false);
	
	window.load = load;
	
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
	}
	
	function load(ip) {
		window.ip = ip;
		
		xhr = new JSONRequest(top.server, onResponse);
		
		sendRequest("snmp");
	}
	
	function init(deviceObject) {
		var cpuList, memList, diskList, portList, storage, port, obj,
			li, checkbox;
		
		device = deviceObject;
		
		elements["ip"].textContent = window.ip;
		elements["status"].textContent = device.timeout > 0? "down ("+ new Date(device.timeout) +")": "up";
		elements["uptime"].textContent = Uptime.toString(device["hrSystemUptime"]);
		elements["name"].textContent = device["sysName"];
		elements["description"].textContent = device["sysDescr"];
		elements["enterprise"].textContent = sysObjectID(device["sysObjectID"]);
		elements["title"].textContent = device["sysName"] +"["+ window.ip +"]";
		
		elements["body"].classList.remove("loading");
		
		chart = new Chart({
			id: "chart",
			zoom: "auto",
			color: "#000",
			space: 1,
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
			
				checkbox.dataset["database"] = "memory";
			}
			/**
			 * non-removable storage
			 */
			else if (storage["hrStorageType"] === 4) {
				li.appendChild(document.createElement("span")).textContent = storage["hrStorageDescr"];
				
				diskList.appendChild(li);
				
				checkbox.dataset["database"] = "storage";
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
			realTimeData["ifOutOctets"][index] = {};
		}
	}
	
	function update(device) {
		var checkbox,
			entry, key, data,
			date = new Date(device["lastResponse"]);
		
		date.setMilliseconds(0);
		key = date.getTime();
		
		for (var i=0, length=checkboxList.length; i<length; i++) {
			checkbox = checkboxList[i];
			
			if (checkbox.checked === true) {
				entry = checkbox.dataset["entry"];
				index = checkbox.dataset["index"];
				
				if (entry === "hrProcessorEntry") {
					data = realTimeData["hrProcessorLoad"][index];
					data[key] = device[entry][index];
					
					realTimeQueue[realTimeQueue.length] = chart.draw.bind(chart, data, "#00f");
				}
				else if (entry === "hrStorageEntry") {
					data = realTimeData["hrStorageUsed"][index];
					entry = device["hrStorageEntry"][index];
					
					data[key] = entry["hrStorageUsed"] *100 / entry["hrStorageSize"];
					
					realTimeQueue[realTimeQueue.length] = chart.draw.bind(chart, data, checkbox.dataset["database"] === "memory"? "#f00": "#777");
				}
				else if (entry === "ifEntry") {
					var bandwidth = device["ifEntry"][index]["ifSpeed"];
					
					data = realTimeData["ifInOctets"][index];
					data[key] = device["ifEntry"][index]["ifInOctets"] *100 /bandwidth;
					realTimeQueue[realTimeQueue.length] = chart.draw.bind(chart, data, "#0f0");
					
					data = realTimeData["ifOutOctets"][index];
					data[key] = device["ifEntry"][index]["ifOutOctets"] *100 /bandwidth;
					realTimeQueue[realTimeQueue.length] = chart.draw.bind(chart, data, "#fa0");
				}
			}
		}
		
		chart.clear();
	}
	
	function changeBase(origin, base) {
		elements["range"].textContent = new Date(origin) +" ~ "+ new Date(base);
	}
	
	function onChangeBase(origin, base) {
		if (elements["switch"].value === "log") {
			changeBase(origin, base);
		}
	}
	
	function onChangeSwitch(e) {
		if (this.value === "log") {
			chart.setBase(savedBase);
			chart.setScale(savedScale);
			
			chart.clear();
		}
		else {
			chart.setScale(0);
			
			elements["range"].textContent = "real time";
			
			requestTimer();
		}
	}
	
	function onReset(origin, base, size, scale) {
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
			
			changeBase(origin, base);
		}
		else {
			var length=realTimeQueue.length;
			
			for (var i=0; i<length; i++) {
				realTimeQueue[i]();
			}
			
			realTimeQueue = [];
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
	
	function onChangeResource() {
		chart.clear();
	}
	
	function requestTimer() {
		if (elements["switch"].value === "log") {
			return;
		}
		
		sendRequest("realtime");
		
		setTimeout(requestTimer, 1000);
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
		
		request.data[window.ip] = o;
		
		xhr.request(request);
	}
	
	function drawGraph(database, data) {
		if (database === "traffic") {
			chart.draw(data["ifInOctets"], "#0f0");
			chart.draw(data["ifOutOctets"], "#fa0");
		}
		else if (database === "processor") {
			chart.draw(data, "#00f");
		}
		else if (database === "memory") {
			chart.draw(data, "#f00");
		}
		else if (database === "storage") {
			chart.draw(data, "#777");
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
						init(json.data[window.ip]);
					}
				}
				else if (json.database === "realtime") {
					if (elements["switch"].value !== "log") {
						update(json.data[window.ip]);
					}
				}
				else {
					drawGraph(json.database, json.data[window.ip]);
				}
			}
		}
		else {
			throw "fatal error";
		}
	}
	
}) (window);
