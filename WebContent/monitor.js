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
	var xhr, form, device, ifentry, chart, cpuChart, memoryChart, trafficChart, selectedPort, colorIndex,
		curFocusedChart, curFocusedElement,
		schedule,
		colors = ["#f00", "#0f0", "#00f", "#ff0", "#f0f", "#0ff", "#800", "#080", "#008", "#880", "#808", "#088"];
	
	window.addEventListener("load", onLoad, false);
	window.addEventListener("message", onMessage, false);
	window.addEventListener("mousewheel", onWheel, false);
	
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
		elements["select_cpu"] = document.getElementById("select_cpu");
		elements["switch"] = document.getElementById("switch");
		elements["range"] = document.getElementById("range");
		elements["title"] = document.getElementById("title");
		
		form = document.getElementById("form");
		ifentry = document.getElementById("ifentry");
		
		elements["select_cpu"].addEventListener("click", onSelectCPU, false);
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
		var cpuList, memList, diskList, portList, storage, port, obj,
			li, checkbox;
	//console.log(device);	
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
			onreset: onReset,
			onchange: onChangeBase
		});
		
		/**
		 * cpu
		 */
		cpuList = elements["cpu_list"];
		for (index in device["hrProcessorEntry"]) {
			li = document.createElement("li");
			checkbox = document.createElement("input");
			checkbox.type = "checkbox";
			checkbox.onchange = onChangeCPU;
			li.appendChild(checkbox);
			li.appendChild(document.createElement("span")).textContent = "index."+ index;
			cpuList.appendChild(li);
		}
		
		/**
		 * storage
		 */
		memList = elements["mem_list"];
		diskList = elements["disk_list"];
		obj = device["hrStorageEntry"];
		
		for (index in device["hrStorageIndex"]) {
			storage = obj[index];
			
			li = document.createElement("li");
			checkbox = document.createElement("input");
			checkbox.type = "checkbox";
			li.appendChild(checkbox);
			
			/**
			 * physical memory
			 */
			if (storage["hrStorageType"] === 2) {
				li.appendChild(document.createElement("span")).textContent = "index."+ index;
				checkbox.onchange = onChangeMemory;
				memList.appendChild(li);
			}
			/**
			 * non-removable storage
			 */
			else if (storage["hrStorageType"] === 4) {
				li.appendChild(document.createElement("span")).textContent = storage["hrStorageDescr"];
				checkbox.onchange = onChangeDisk;
				diskList.appendChild(li);
			}
		}
		
		/**
		 * interface
		 */
		portList = elements["port_list"];
		obj = device["ifEntry"];
		for (index in device["ifIndex"]) {
			port = obj[index];
			
			li = document.createElement("li");
			checkbox = document.createElement("input");
			checkbox.type = "checkbox";
			li.appendChild(checkbox);
			li.appendChild(document.createElement("span")).textContent = port["ifName"];
			checkbox.onchange = onChangePort;
			portList.appendChild(li);
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
	
	function drawChart(data) {
		chart.draw(data, colors[colorIndex++]);
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
	
	function onChangeBase(origin, base) {
		elements["range"].textContent = new Date(origin) +" ~ "+ new Date(base);
	}
	
	function onChangeSwitch(e) {
		if (this.value === "log") {
			
		}
		else {
			
		}
	}
	
	function onReset(base, size, scale) {
		console.log(base, size, scale);
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
	
	function onSelectCPU(e) {
		var cpuList = elements["cpu_list"],
			checked = this.checked,
			list = 	cpuList.firstChild;
		
		while (list) {
			list.firstChild.checked = checked;
			
			list = list.nextSibling;
		}
		
		onChangeCPU();
	}
	
	function onChangeCPU() {
		var cpuList = elements["cpu_list"],
			list = 	cpuList.firstChild;
		
		while (list) {
			// TODO
			list.firstChild.checked;
			
			list = list.nextSibling;
		}
	}
	
	function onChangeMemory() {
		
	}
	
	function onChangeDisk() {
		
	}

	function onChangePort() {
		
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

var device = {
        "udp": 161,
        "hrProcessorLoad": {},
        "ip": "127.0.0.1",
        "profile": "public",
        "sysObjectID": "1.3.6.1.4.1.311.1.1.3.1.1",
        "ifEntry": {
            "22": {
                "ifAlias": "isatap.{171E4F33-7948-4573-9B41-DDAF75E1C2BC}",
                "ifAdminStatus": 1,
                "ifIndex": 22,
                "ifoutOctets": 0,
                "ifType": 131,
                "ifPhysAddress": "\u0000\u0000\u0000\u0000\u0000\u0000\u0000?",
                "ifOutOctets": 0,
                "ifName": "tunnel_5",
                "ifSpeed": 100000,
                "ifInOctets": 0,
                "ifOperStatus": 2,
                "ifDescr": "Microsoft ISATAP Adapter #2\u0000"
            },
            "23": {
                "ifAlias": "",
                "ifAdminStatus": 1,
                "ifIndex": 23,
                "ifoutOctets": 12,
                "ifType": 71,
                "ifPhysAddress": "?*궎$-",
                "ifOutOctets": 1122,
                "ifName": "wireless_1",
                "ifSpeed": 108000000,
                "ifInOctets": 6595,
                "ifOperStatus": 1,
                "ifDescr": "Broadcom 802.11n Network Adapter-Virtual PC Network Filter Driver-0000\u0000"
            },
            "24": {
                "ifAlias": "",
                "ifAdminStatus": 1,
                "ifIndex": 24,
                "ifoutOctets": 0,
                "ifType": 71,
                "ifPhysAddress": "?*궎$-",
                "ifOutOctets": 1123,
                "ifName": "wireless_2",
                "ifSpeed": 108000000,
                "ifInOctets": 6599,
                "ifOperStatus": 1,
                "ifDescr": "Broadcom 802.11n Network Adapter-Virtual WiFi Filter Driver-0000\u0000"
            },
            "25": {
                "ifAlias": "",
                "ifAdminStatus": 1,
                "ifIndex": 25,
                "ifoutOctets": 0,
                "ifType": 6,
                "ifPhysAddress": "d1P\u000eD?",
                "ifOutOctets": 0,
                "ifName": "ethernet_2",
                "ifSpeed": 0,
                "ifInOctets": 0,
                "ifOperStatus": 2,
                "ifDescr": "Realtek RTL8168D/8111D Family PCI-E Gigabit Ethernet NIC(NDIS 6.20)-Virtual PC Network Filter Driver-0000\u0000"
            },
            "26": {
                "ifAlias": "",
                "ifAdminStatus": 1,
                "ifIndex": 26,
                "ifoutOctets": 0,
                "ifType": 6,
                "ifPhysAddress": "d1P\u000eD?",
                "ifOutOctets": 0,
                "ifName": "ethernet_3",
                "ifSpeed": 0,
                "ifInOctets": 0,
                "ifOperStatus": 2,
                "ifDescr": "Realtek RTL8168D/8111D Family PCI-E Gigabit Ethernet NIC(NDIS 6.20)-WFP LightWeight Filter-0000\u0000"
            },
            "27": {
                "ifAlias": "",
                "ifAdminStatus": 1,
                "ifIndex": 27,
                "ifoutOctets": 0,
                "ifType": 6,
                "ifPhysAddress": "\u0000??,뇛",
                "ifOutOctets": 0,
                "ifName": "ethernet_5",
                "ifSpeed": 4294967295,
                "ifInOctets": 0,
                "ifOperStatus": 2,
                "ifDescr": "Juniper Network Connect Virtual Adapter-Virtual PC Network Filter Driver-0000\u0000"
            },
            "28": {
                "ifAlias": "",
                "ifAdminStatus": 1,
                "ifIndex": 28,
                "ifoutOctets": 0,
                "ifType": 6,
                "ifPhysAddress": "\u0000??,뇛",
                "ifOutOctets": 0,
                "ifName": "ethernet_7",
                "ifSpeed": 4294967295,
                "ifInOctets": 0,
                "ifOperStatus": 2,
                "ifDescr": "Juniper Network Connect Virtual Adapter-QoS Packet Scheduler-0000\u0000"
            },
            "29": {
                "ifAlias": "",
                "ifAdminStatus": 1,
                "ifIndex": 29,
                "ifoutOctets": 0,
                "ifType": 6,
                "ifPhysAddress": "\u0000??,뇛",
                "ifOutOctets": 0,
                "ifName": "ethernet_11",
                "ifSpeed": 4294967295,
                "ifInOctets": 0,
                "ifOperStatus": 2,
                "ifDescr": "Juniper Network Connect Virtual Adapter-WFP LightWeight Filter-0000\u0000"
            },
            "30": {
                "ifAlias": "",
                "ifAdminStatus": 1,
                "ifIndex": 30,
                "ifoutOctets": 12,
                "ifType": 6,
                "ifPhysAddress": "t7 RAS",
                "ifOutOctets": 0,
                "ifName": "ethernet_12",
                "ifSpeed": 1073741824,
                "ifInOctets": 0,
                "ifOperStatus": 1,
                "ifDescr": "WAN Miniport (Network Monitor)-QoS Packet Scheduler-0000\u0000"
            },
            "31": {
                "ifAlias": "",
                "ifAdminStatus": 1,
                "ifIndex": 31,
                "ifoutOctets": 12,
                "ifType": 6,
                "ifPhysAddress": "t7 RAS",
                "ifOutOctets": 0,
                "ifName": "ethernet_13",
                "ifSpeed": 1073741824,
                "ifInOctets": 0,
                "ifOperStatus": 1,
                "ifDescr": "WAN Miniport (IP)-QoS Packet Scheduler-0000\u0000"
            },
            "10": {
                "ifAlias": "",
                "ifAdminStatus": 1,
                "ifIndex": 10,
                "ifoutOctets": 0,
                "ifType": 6,
                "ifPhysAddress": "d1P\u000eD?",
                "ifOutOctets": 0,
                "ifName": "ethernet_6",
                "ifSpeed": 0,
                "ifInOctets": 0,
                "ifOperStatus": 2,
                "ifDescr": "Realtek RTL8168D/8111D Family PCI-E Gigabit Ethernet NIC(NDIS 6.20)\u0000"
            },
            "32": {
                "ifAlias": "",
                "ifIndex": 32,
                "ifAdminStatus": 1,
                "ifType": 6,
                "ifPhysAddress": "t7 RAS",
                "ifOutOctets": 0,
                "ifName": "ethernet_14",
                "ifSpeed": 1073741824,
                "ifInOctets": 0,
                "ifOperStatus": 1,
                "ifDescr": "WAN Miniport (IPv6)-QoS Packet Scheduler-0000\u0000"
            },
            "11": {
                "ifAlias": "Bluetooth ",
                "ifAdminStatus": 1,
                "ifIndex": 11,
                "ifoutOctets": 0,
                "ifType": 6,
                "ifPhysAddress": "?*굱6?",
                "ifOutOctets": 0,
                "ifName": "ethernet_9",
                "ifSpeed": 1000000,
                "ifInOctets": 0,
                "ifOperStatus": 2,
                "ifDescr": "Bluetooth 장치(개인 영역 네트워크)\u0000"
            },
            "33": {
                "ifAlias": "",
                "ifIndex": 33,
                "ifAdminStatus": 1,
                "ifType": 71,
                "ifPhysAddress": "?*궎$-",
                "ifOutOctets": 1129,
                "ifName": "wireless_3",
                "ifSpeed": 108000000,
                "ifInOctets": 6634,
                "ifOperStatus": 1,
                "ifDescr": "Broadcom 802.11n Network Adapter-Native WiFi Filter Driver-0000\u0000"
            },
            "12": {
                "ifAlias": "",
                "ifAdminStatus": 2,
                "ifIndex": 12,
                "ifoutOctets": 0,
                "ifType": 1,
                "ifPhysAddress": "",
                "ifOutOctets": 0,
                "ifName": "other_0",
                "ifSpeed": 0,
                "ifInOctets": 0,
                "ifOperStatus": 6,
                "ifDescr": "Bluetooth 장치(RFCOMM 프로토콜 TDI)\u0000"
            },
            "34": {
                "ifAlias": "",
                "ifIndex": 34,
                "ifAdminStatus": 1,
                "ifType": 71,
                "ifPhysAddress": "?*궎$-",
                "ifOutOctets": 1129,
                "ifName": "wireless_4",
                "ifSpeed": 108000000,
                "ifInOctets": 6639,
                "ifOperStatus": 1,
                "ifDescr": "Broadcom 802.11n Network Adapter-WFP LightWeight Filter-0000\u0000"
            },
            "13": {
                "ifAlias": "Teredo Tunneling Pseudo-Interface",
                "ifAdminStatus": 1,
                "ifIndex": 13,
                "ifoutOctets": 0,
                "ifType": 131,
                "ifPhysAddress": "\u0000\u0000\u0000\u0000\u0000\u0000\u0000?",
                "ifOutOctets": 0,
                "ifName": "tunnel_6",
                "ifSpeed": 100000,
                "ifInOctets": 0,
                "ifOperStatus": 2,
                "ifDescr": "Teredo Tunneling Pseudo-Interface\u0000"
            },
            "14": {
                "ifAlias": "",
                "ifAdminStatus": 1,
                "ifIndex": 14,
                "ifoutOctets": 12,
                "ifType": 71,
                "ifPhysAddress": "?*궎$-",
                "ifOutOctets": 1117,
                "ifName": "wireless_0",
                "ifSpeed": 108000000,
                "ifInOctets": 6562,
                "ifOperStatus": 1,
                "ifDescr": "Broadcom 802.11n Network Adapter\u0000"
            },
            "15": {
                "ifAlias": "",
                "ifAdminStatus": 1,
                "ifIndex": 15,
                "ifoutOctets": 0,
                "ifType": 131,
                "ifPhysAddress": "\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000",
                "ifOutOctets": 0,
                "ifName": "tunnel_1",
                "ifSpeed": 0,
                "ifInOctets": 0,
                "ifOperStatus": 2,
                "ifDescr": "WAN Miniport (IKEv2)\u0000"
            },
            "16": {
                "ifAlias": "",
                "ifAdminStatus": 2,
                "ifIndex": 16,
                "ifoutOctets": 0,
                "ifType": 6,
                "ifPhysAddress": "???(U",
                "ifOutOctets": 0,
                "ifName": "ethernet_8",
                "ifSpeed": 0,
                "ifInOctets": 0,
                "ifOperStatus": 6,
                "ifDescr": "Apple Mobile Device Ethernet\u0000"
            },
            "17": {
                "ifAlias": "",
                "ifAdminStatus": 2,
                "ifIndex": 17,
                "ifoutOctets": 0,
                "ifType": 71,
                "ifPhysAddress": "?*궎$-",
                "ifOutOctets": 0,
                "ifName": "wireless_5",
                "ifSpeed": 0,
                "ifInOctets": 0,
                "ifOperStatus": 6,
                "ifDescr": "Microsoft Virtual WiFi Miniport Adapter\u0000"
            },
            "18": {
                "ifAlias": "isatap.{1CA8AC2D-4940-470A-A200-4D2FD7247274}",
                "ifAdminStatus": 1,
                "ifIndex": 18,
                "ifoutOctets": 0,
                "ifType": 131,
                "ifPhysAddress": "\u0000\u0000\u0000\u0000\u0000\u0000\u0000?",
                "ifOutOctets": 0,
                "ifName": "tunnel_8",
                "ifSpeed": 100000,
                "ifInOctets": 0,
                "ifOperStatus": 2,
                "ifDescr": "Microsoft ISATAP Adapter #4\u0000"
            },
            "19": {
                "ifAlias": "",
                "ifAdminStatus": 1,
                "ifIndex": 19,
                "ifoutOctets": 0,
                "ifType": 6,
                "ifPhysAddress": "\u0000??,뇛",
                "ifOutOctets": 0,
                "ifName": "ethernet_10",
                "ifSpeed": 4294967295,
                "ifInOctets": 0,
                "ifOperStatus": 2,
                "ifDescr": "Juniper Network Connect Virtual Adapter\u0000"
            },
            "1": {
                "ifAlias": "Loopback Pseudo-Interface 1",
                "ifAdminStatus": 1,
                "ifIndex": 1,
                "ifoutOctets": 0,
                "ifType": 24,
                "ifPhysAddress": "",
                "ifOutOctets": 0,
                "ifName": "loopback_0",
                "ifSpeed": 1073741824,
                "ifInOctets": 0,
                "ifOperStatus": 1,
                "ifDescr": "Software Loopback Interface 1\u0000"
            },
            "2": {
                "ifAlias": "",
                "ifAdminStatus": 1,
                "ifIndex": 2,
                "ifoutOctets": 0,
                "ifType": 131,
                "ifPhysAddress": "",
                "ifOutOctets": 0,
                "ifName": "tunnel_0",
                "ifSpeed": 1073741824,
                "ifInOctets": 0,
                "ifOperStatus": 1,
                "ifDescr": "WAN Miniport (SSTP)\u0000"
            },
            "3": {
                "ifAlias": "",
                "ifAdminStatus": 1,
                "ifIndex": 3,
                "ifoutOctets": 0,
                "ifType": 131,
                "ifPhysAddress": "",
                "ifOutOctets": 0,
                "ifName": "tunnel_2",
                "ifSpeed": 1073741824,
                "ifInOctets": 0,
                "ifOperStatus": 1,
                "ifDescr": "WAN Miniport (L2TP)\u0000"
            },
            "4": {
                "ifAlias": "",
                "ifAdminStatus": 1,
                "ifIndex": 4,
                "ifoutOctets": 0,
                "ifType": 131,
                "ifPhysAddress": "",
                "ifOutOctets": 0,
                "ifName": "tunnel_3",
                "ifSpeed": 1073741824,
                "ifInOctets": 0,
                "ifOperStatus": 1,
                "ifDescr": "WAN Miniport (PPTP)\u0000"
            },
            "5": {
                "ifAlias": "",
                "ifAdminStatus": 1,
                "ifIndex": 5,
                "ifoutOctets": 0,
                "ifType": 23,
                "ifPhysAddress": "",
                "ifOutOctets": 0,
                "ifName": "ppp_0",
                "ifSpeed": 1073741824,
                "ifInOctets": 0,
                "ifOperStatus": 1,
                "ifDescr": "WAN Miniport (PPPOE)\u0000"
            },
            "6": {
                "ifAlias": "",
                "ifAdminStatus": 1,
                "ifIndex": 6,
                "ifoutOctets": 0,
                "ifType": 6,
                "ifPhysAddress": "t7 RAS",
                "ifOutOctets": 0,
                "ifName": "ethernet_0",
                "ifSpeed": 1073741824,
                "ifInOctets": 0,
                "ifOperStatus": 1,
                "ifDescr": "WAN Miniport (IPv6)\u0000"
            },
            "7": {
                "ifAlias": "",
                "ifAdminStatus": 1,
                "ifIndex": 7,
                "ifoutOctets": 0,
                "ifType": 6,
                "ifPhysAddress": "t7 RAS",
                "ifOutOctets": 0,
                "ifName": "ethernet_1",
                "ifSpeed": 1073741824,
                "ifInOctets": 0,
                "ifOperStatus": 1,
                "ifDescr": "WAN Miniport (Network Monitor)\u0000"
            },
            "8": {
                "ifAlias": "",
                "ifAdminStatus": 1,
                "ifIndex": 8,
                "ifoutOctets": 0,
                "ifType": 6,
                "ifPhysAddress": "t7 RAS",
                "ifOutOctets": 0,
                "ifName": "ethernet_4",
                "ifSpeed": 1073741824,
                "ifInOctets": 0,
                "ifOperStatus": 1,
                "ifDescr": "WAN Miniport (IP)\u0000"
            },
            "9": {
                "ifAlias": "",
                "ifAdminStatus": 1,
                "ifIndex": 9,
                "ifoutOctets": 0,
                "ifType": 23,
                "ifPhysAddress": " ASYN?",
                "ifOutOctets": 0,
                "ifName": "ppp_1",
                "ifSpeed": 1073741824,
                "ifInOctets": 0,
                "ifOperStatus": 1,
                "ifDescr": "RAS Async Adapter\u0000"
            },
            "20": {
                "ifAlias": "isatap.{BCDC41C8-AEBA-4775-B5EC-CF8AEDD0ABD7}",
                "ifAdminStatus": 1,
                "ifIndex": 20,
                "ifoutOctets": 0,
                "ifType": 131,
                "ifPhysAddress": "\u0000\u0000\u0000\u0000\u0000\u0000\u0000?",
                "ifOutOctets": 0,
                "ifName": "tunnel_4",
                "ifSpeed": 100000,
                "ifInOctets": 0,
                "ifOperStatus": 2,
                "ifDescr": "Microsoft ISATAP Adapter\u0000"
            },
            "21": {
                "ifAlias": "isatap.{531BA947-168C-4A45-83A1-42C384D20E6C}",
                "ifAdminStatus": 1,
                "ifIndex": 21,
                "ifoutOctets": 0,
                "ifType": 131,
                "ifPhysAddress": "\u0000\u0000\u0000\u0000\u0000\u0000\u0000?",
                "ifOutOctets": 0,
                "ifName": "tunnel_7",
                "ifSpeed": 100000,
                "ifInOctets": 0,
                "ifOperStatus": 2,
                "ifDescr": "Microsoft ISATAP Adapter #3\u0000"
            }
        },
        "hrStorageEntry": {
            "1": {
                "hrStorageAllocationUnits": 4096,
                "hrStorageType": 4,
                "hrStorageDescr": "C:\\ Label:  Serial Number 38f144e0",
                "hrStorageSize": 31232511
            },
            "2": {
                "hrStorageAllocationUnits": 0,
                "hrStorageType": 7,
                "hrStorageDescr": "D:\\",
                "hrStorageSize": 0
            },
            "3": {
                "hrStorageAllocationUnits": 65536,
                "hrStorageType": 3,
                "hrStorageDescr": "Virtual Memory",
                "hrStorageSize": 95698
            },
            "4": {
                "hrStorageAllocationUnits": 65536,
                "hrStorageType": 2,
                "hrStorageDescr": "Physical Memory",
                "hrStorageSize": 47862
            },
            "5": {
                "hrStorageAllocationUnits": 65536,
                "hrStorageType": 2,
                "hrStorageDescr": "Physical Memory",
                "hrStorageSize": 47862
            },
            "6": {
                "hrStorageAllocationUnits": 65536,
                "hrStorageType": 2,
                "hrStorageDescr": "Physical Memory",
                "hrStorageSize": 2991
            }
        },
        "community": "public",
        "timeout": -1,
        "hrSystemUptime": 285544120,
        "sysDescr": "Hardware: x86 Family 6 Model 37 Stepping 5 AT/AT COMPATIBLE - Software: Windows Version 6.1 (Build 7601 Multiprocessor Free)",
        "delay": 463,
        "sysName": "NETRMS_COM",
        "hrProcessorEntry": {
            "4": 7,
            "5": 0,
            "6": 9,
            "7": 0
        }
};
