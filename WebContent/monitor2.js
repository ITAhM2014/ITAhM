;"use strict";

var elements = {},
	COLOR_GRAY = "#777777",
	COLOR_RED = "#ff0000",
	COLOR_BLUE = "#0000ff",
	COLOR_ORANGE = "#ffaa00",
	COLOR_GREEN = "#00ff00",
	COLOR_PURPLE = "#800080",
	COLOR_YELLOW = "#ffff00";

function clearElement(element) {
	for (var firstChild; firstChild = element.firstChild; ) {
		element.removeChild(firstChild);
	}
}

function ResourceList() {
	this.init(arguments);
}

(function (window, undefined) {
	function onCheckResource(e) {
		var checkbox = e.currentTarget,
			index = this.checked.indexOf(checkbox);
		
		if (checkbox.checked) {	
			if (index === -1) {
				this.checked[this.checked.length] = checkbox;
			}
		}
		else {
			if (index !== -1) {
				this.checked.splice(index, 1);
				this.getData(checkbox)["realTimeData"] = {};
			}
		}
		
		this.onchange();
	}
	
	ResourceList.prototype = {
		init: function (args) {
			this.array = [];
			this.data = [];
			this.checked = [];
			this.onchange = args[0] || function () {};
		},
		
		add: function (resource, data) {
			var index = this.array.indexOf(resource);
			
			if (index !== -1) {
				return null;
			}
			
			index = this.array.length;
			
			this.array[index] = resource;
			this.data[index] = data;
			
			resource.addEventListener("click", onCheckResource.bind(this), false);
			
			return resource;
		},

		each: function (func) {
			for (var i=0, length=this.checked.length; i<length; i++) {
				func(this.checked[i]);
			}
		},
		
		getData: function (resource) {
			var index = this.array.indexOf(resource);
			
			if (index !== -1) {
				return this.data[index];
			}
		}
		
	};
	
}) (window);

(function (window, undefined) {
	var xhr, device, chart,
		resourceList = new ResourceList(onChangeResource),
		savedBase, savedScale,
		checkboxList = [];
	
	window.addEventListener("load", onLoad, false);
	
	window.load = load;
	
	function onLoad(e) {
		elements["body"] = document.getElementsByTagName("body")[0];
		elements.chart = document.getElementById("chart");
		elements["status"] = document.getElementById("txt_status");
		elements["ip"] = document.getElementById("ip");
		elements["name"] = document.getElementById("txt_name");
		elements["uptime"] = document.getElementById("txt_uptime");
		elements["description"] = document.getElementById("txt_description");
		elements["enterprise"] = document.getElementById("txt_enterprise");
		elements["delay"] = document.getElementById("delay");
		elements["cpu_list"] = document.getElementById("cpu_list");
		elements["mem_list"] = document.getElementById("mem_list");
		elements["disk_list"] = document.getElementById("disk_list");
		elements["port_list"] = document.getElementById("port_list");
		elements["memory"] = document.getElementById("memory");
		elements["traffic"] = document.getElementById("traffic");
		elements["switch"] = document.getElementById("switch");
		elements.navigation = document.getElementById("navigation");
		
		elements["switch"].addEventListener("change", onChangeSwitch, false);
	}
	
	function load(ipAddress) {
		ip = ipAddress;
		
		xhr = new JSONRequest(top.server, onResponse);
		
		sendRequest("snmp");
	}
	
	function init() {
		document.createDocumentFragment().appendChild(elements.navigation);
		
		setUp();
		
		elements["body"].classList.remove("loading");
	}
	
	function setUp() {
		var cpuList, memList, diskList, portList, storage, port, data,
			li, checkbox;
	
		elements["ip"].textContent = ip;
		elements["status"].textContent = device.timeout > 0? "down ("+ new Date(device.timeout) +")": "up";
		elements["uptime"].textContent = Uptime.toString(device["hrSystemUptime"]);
		elements["name"].textContent = device["sysName"];
		elements["description"].textContent = device["sysDescr"];
		elements["enterprise"].textContent = sysObjectID(device["sysObjectID"]);
		
		// delay
		checkbox = document.getElementById("check_delay");
		resourceList.add(document.getElementById("check_delay"), {
			database: "delay",
			color: COLOR_PURPLE,
			getDescription: function (resource) {
				return "snmp response time";
			},
			getValue: function (resource) {
				return resource;
			},
			getCapacity: function (resource) {
				return "5000 mills";
			},
			getCurrent: function (resource) {
				return resource  +" mills";
			},
			getPercentage: function (resource) {
				return (resource / 50).toFixed(2);
			},
			realTimeData: {}
		});
		
		// cpu
		cpuList = elements["cpu_list"];
		
		for (index in device["hrProcessorEntry"]) {
			checkbox = resourceList.add(document.createElement("input"), {
				database: "processor",
				color: COLOR_BLUE,
				index: index,
				entry: "hrProcessorEntry",
				getDescription: function () {
					return "processor load index of "+ index;
				},
				getCapacity: function (resource) {
					return "100 %";
				},
				getCurrent: function (resource) {
					return (resource).toFixed(2) +" %";
				},
				getPercentage: function (resource) {
					return (resource).toFixed(2);
				},
				realTimeData: {}
			});
			
			li = document.createElement("li");
			li.appendChild(checkbox).type = "checkbox";
			li.appendChild(document.createElement("span")).textContent = "index."+ index;
			
			cpuList.appendChild(li);
		}
		
		// storage
		memList = elements["mem_list"]
		diskList = elements["disk_list"]
		
		for (index in device["hrStorageIndex"]) {
			storage = device["hrStorageEntry"][index];
			
			checkbox = resourceList.add(document.createElement("input"), data = {
				index: index,
				entry: "hrStorageEntry",
				getCapacity: function (resource) {
					return Storage.toString(resource["hrStorageSize"] * resource["hrStorageAllocationUnits"]);
				},
				getCurrent: function (resource) {
					return Storage.toString(resource["hrStorageUsed"] * resource["hrStorageAllocationUnits"]);
				},
				getPercentage: function (resource) {
					return (resource["hrStorageUsed"] / resource["hrStorageSize"] *100).toFixed(2);
				},
				realTimeData: {}
			});
			
			li = document.createElement("li");
			li.appendChild(checkbox).type = "checkbox";
			
			/**
			 * physical memory
			 */
			if (storage["hrStorageType"] === 2) {
				data["database"] = "memory";
				data["color"] = COLOR_RED;
				data["getDescription"] = function (resource) {
					return "physical memory usage index of "+ index;
				};
				
				li.appendChild(document.createElement("span")).textContent = "index."+ index;
				
				memList.appendChild(li);
			}
			
			/**
			 * non-removable storage
			 */
			else if (storage["hrStorageType"] === 4) {
				data["database"] = "storage";
				data["color"] = COLOR_YELLOW;
				data["getDescription"] = function (resource) {
					return "storage usage of "+ resource["hrStorageDescr"];;
				};
				
				li.appendChild(document.createElement("span")).textContent = storage["hrStorageDescr"];
				
				diskList.appendChild(li);
			}
		}
		
		/**
		 * interface
		 */
		portList = elements["port_list"];

		for (index in device["ifIndex"]) {
			port = device["ifEntry"][index];
			
			checkbox = resourceList.add(document.createElement("input"), data = {
				database: "traffic",
				color: COLOR_GREEN, // COLOR_ORANGE
				index: index,
				entry: "ifEntry",
				getDescription: function (resource) {
					return resource["ifName"] +" ("+ resource["ifDescr"] +")";
				},
				getCapacity: function (resource) {
					return Bandwidth.toString(resource["ifSpeed"]);
				},
				getCurrent: function (resource) {
					return Bandwidth.toString(resource["ifInOctets"]);
				},
				getPercentage: function (resource) {
					return (resource["ifInOctets"] / resource["ifSpeed"] *100).toFixed(2);
				},
				realTimeData: {
					ifInOctets: {},
					ifOutOctets: {}
				}
			});
			
			li = document.createElement("li");
			li.title = port["ifDescr"];
			li.appendChild(checkbox).type = "checkbox";
			li.appendChild(document.createElement("span")).textContent = port["ifName"];
			
			portList.appendChild(li);
		}
	}
	
	function update(checkbox) {
		var key, data, database, entry, index, drawData;
		
		data = resourceList.getData(checkbox);
		database = data["database"];
		entry = device[data["entry"] || "delay"];
		index = data["index"];
		resource = entry[index] || entry;
		drawData = data["realTimeData"];
		
		key = new Date(device["lastResponse"]).setMilliseconds(0);
		drawData[key] = Number(data.getPercentage(resource));
		data["realTimeData"] = chart.draw(drawData, data["color"], true);
	}
	
	function onChangeSwitch(e) {
		if (this.value === "log") {
			chart.setBase(savedBase);
			chart.setScale(savedScale);
			
			chart.clear();
		}
		else {
			chart.setScale(0);
			
			requestTimer();
		}
	}
	
	function onReset(origin, base, size, scale) {
		if (elements["switch"].value === "log") {
			var checkbox;
		
			savedBase = base;
			savedScale = scale;
			
			resourceList.each(sendLogRequest.bind(undefined, scale, base, size));
		}
		else {
			if (resourceList.checked.length > 0) {
				sendRequest("realtime");
			}
		}
	}
	
	/*
	 * monitor 하고자 하는 resource 선택이 추가되거나 제거되는 경우 발생하는 event
	 * realtime인 경우에는 반복해서 발생
	 */
	function onChangeResource() {
		resourceList.each(sendLogRequest.bind(undefined, scale, base, size));
		
		clearElement(elements.chart);
	}
	
	function resetResource() {
		var detail = elements["detail"],
			doc = document.createDocumentFragment();
	
		clearElement(detail);
		
		detail.appendChild(doc);
	}
	
	function requestTimer() {
		if (elements["switch"].value === "log") {
			return;
		}
		
		chart.clear();
		
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
		
		request.data[ip] = o;
		
		xhr.request(request);
	}
	
	function sendLogRequest(scale, base, size, checkbox) {
		var data = resourceList.getData(checkbox);
		
		sendRequest(data["database"], scale, data["index"], base, size);
		
		elements.chart.appendChild(new Chart({}).chart);
	}
	
	function drawGraph(database, data) {
		if (!data) {
			throw "null data.";
		}
		
		if (database === "traffic") {
			chart.draw(data["ifInOctets"], COLOR_GREEN);
			chart.draw(data["ifOutOctets"], COLOR_ORANGE);
		}
		else if (database === "processor") {
			chart.draw(data, COLOR_BLUE);
		}
		else if (database === "memory") {
			chart.draw(data, COLOR_RED);
		}
		else if (database === "storage") {
			chart.draw(data, COLOR_YELLOW);
		}
		else if (database === "delay") {
			chart.draw(data, COLOR_PURPLE);
		}
	}
	
	function onResponse(response) {
		if ("error" in response) {
			var status = response.error.status;
			
			if (status == 401) {
				top.signOut();
			}
		}
		else if ("json" in response) {
			var json = response.json;
			
			if (json.command === "get") {
				if (json.database == "snmp") {
					if (!device) {
						device = json.data[ip];
						
						init();
					}
					else {
						console.log("debug");
					}
				}
				else if (json.database === "realtime") {
					if (elements["switch"].value !== "log") {
						device = json.data[ip];
						
						resourceList.each(update);
						
						resetResource();
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
