;"use strict";

var elements = {};

function clearElement(element) {
	for (var firstChild; firstChild = element.firstChild; ) {
		element.removeChild(firstChild);
	}
}

function removeElement(element) {
	document.createDocumentFragment().appendChild(element);
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
	var xhr, xhrDetail,  device, chart,
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
		elements.fixStart = document.getElementById("fix_start");
		elements.startDate = document.getElementById("start_date");
		elements.fixEnd = document.getElementById("fix_end");
		elements.endDate = document.getElementById("end_date");
		elements.zoomIn = document.getElementById("zoom_in");
		elements.saveAs = document.getElementById("save_as");
		elements.refresh = document.getElementById("refresh");
		elements.setup = document.getElementById("setup");
		
		document.getElementById("minimize").addEventListener("click", onMaximize.bind(window, true), false);
		document.getElementById("maximize").addEventListener("click", onMaximize.bind(window, false), false);
		elements["switch"].addEventListener("change", onChangeSwitch, false);
	}
	
	function load(ipAddress) {
		ip = ipAddress;
		
		new JSONRequest(top.server, onInitResponse).request({
			database: "snmp",
			command: "get"
		});
	}
	
	function init() {
		var cpuList, memList, diskList, portList, storage, port, data,
			li, checkbox;
		
		elements.chart.removeChild(elements.navigation);
		elements.chart.removeChild(elements.setup);
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
				database: "inoctet",
				index: index,
				entry: "ifEntry",
				getDescription: function (resource) {
					return resource["ifName"] +" ("+ resource["ifDescr"] +")";
				},
				getCapacity: function (resource) {
					return Bandwidth.toString(resource["ifSpeed"]);
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
		
		elements["body"].classList.remove("loading");
	}
	/*
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
	*/
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
	
	/**
	 * monitor 하고자 하는 resource 선택이 추가되거나 제거되는 경우 발생하는 event
	 */
	function onChangeResource() {
		var date = new Date();
		
		clearElement(elements.chart);
	
		resourceList.each(createEachChart);
		
		resize();
	}
	
	function createEachChart(checkbox) {
		var data = resourceList.getData(checkbox),
			database = data.database,
			index = data.index;
	
		createChart(database, index);
		
		if (database === "inoctet") {
			createChart("outoctet", index);
		}
	}
	
	function createChart (database, index) {
		var chart = new Chart(),
			xhr = new JSONRequest(top.server, onResponse.bind(window, chart)),
			date = new Date(),
			request = {
				database: database,
				command: "get",
				data: {}
			},
			reqData = {
				index: index,
				end: date.setMinutes(0, 0, 0),
				start: date.setFullYear(date.getFullYear() -1),
				summary: true
			};
		
		chart.user.database = database;
		chart.user.index = index;
		chart.user.summary = true;
		chart.user.xhr = xhr;
		chart.title = database;
		chart.ondrag = onDrag.bind(window, chart);
		chart.chart.onmouseenter = onSelectChart.bind(window, chart);
		
		elements.chart.appendChild(chart.chart);
		
		request.data[ip] = reqData;
		
		xhr.request(request);
	}
	
	function requestTimer() {
		if (elements["switch"].value === "log") {
			return;
		}
		
		chart.clear();
		
		setTimeout(requestTimer, 1000);
	}
	
	function resize() {
		var event = document.createEvent("Event");
		
		event.initEvent("resize", true, true);
		
		window.dispatchEvent(event);
	}
	
	function onSendDetailRequest(chart) {
		if ((chart.end - chart.start) > 7 *24 *60 *60 *1000) {
			alert("can not draw more than 7days in detail");
			
			return;
		}
		
		sendDetailRequest(chart);
	}
	
	function sendDetailRequest(chart) {
		var request = {
				database: chart.user.database,
				command: "get",
				data: {}
			},
			reqData = {
				start: chart.start,
				end: chart.end,
				index: chart.user.index,
				summary: false
			};
		
		chart.user.summary = false;
		
		request.data[ip] = reqData;
		
		chart.user.xhr.request(request);
	}
	
	function onRefresh(chart) {
		chart.set(new Date(elements.startDate.value).setHours(0, 0, 0, 0), new Date(elements.endDate.value).setHours(0, 0, 0, 0));
	}
	
	function onDrag(chart, action, x) {
		if (action === "move") {
			if (elements.fixEnd.checked && elements.fixStart.checked) {
				chart.move(x);
			}
			else if (elements.fixEnd.checked) {
				chart.zoom(x, "end");
			}
			else if (elements.fixStart.checked) {
				chart.zoom(x, "start");
			}
			
			setDate(chart);
		}
	}

	function onMaximize(maximize) {
		if (maximize) {
			elements.body.classList.add("fullscreen");
		}
		else {
			elements.body.classList.remove("fullscreen");
		}
		
		resize();
	}
	
	function setDate(chart) {
		elements.startDate.value = Chart.toDateString(new Date(chart.start));
		elements.endDate.value = Chart.toDateString(new Date(chart.end));
	}
	
	function onSelectChart(chart) {
		if (chart.chart == elements.navigation.parentNode) {
			removeElement(elements.setup);
			
			return;
		}
		
		chart.chart.appendChild(elements.setup);
		elements.setup.onclick = onSetUpChart.bind(window, chart);
		
		setDate(chart);
	}
	
	function onSetUpChart(chart) {
		chart.chart.appendChild(elements.navigation);
		chart.chart.removeChild(elements.setup);
		
		elements.zoomIn.onclick = onSendDetailRequest.bind(window, chart);
		elements.saveAs.onmousedown = saveAs.bind(window, chart);
		elements.refresh.onclick = onRefresh.bind(window, chart);
	}
	
	function saveAs(chart) {
		var a = elements.saveAs,
			file = chart.getFile();
		
		a.download = "data.csv";
		a.href = file;
	}
	
	function parseResponse(response) {
		if ("error" in response) {
			var status = response.error.status;
			
			if (status == 401) {
				top.signOut();
			}
		}
		else if ("json" in response) {
			return response.json;
		}
		else {
			throw "fatal error";
		}
	}
	
	function onInitResponse(response) {
		var response = parseResponse(response),
			data = response && response.data;
		
		if (!data) {
			throw "null data";
		}
		
		device = data[ip];
			
		init();
	}
	
	function onResponse(chart, response) {
		var response = parseResponse(response),
		data = response && response.data;
		
		if (!data) {
			throw "null data.";
		}
		
		if (chart.user.summary) {
			chart.data = data[ip];
			
			chart.invalidate();
		}
		else {
			chart.draw(data[ip]);
		}
		
	}
	
}) (window);
