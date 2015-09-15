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

(function (window, undefined) {
	var xhr, xhrDetail,  device, chart,
		savedBase, savedScale,
		checkedList = new function () {
			var list = [];
			
			function find(checkbox) {
				for (var i=0, length=list.length; i<length; i++) {
					if (list[i].checkbox === checkbox) {
						return list[i];
					}
				}
			}
			
			this.add = function (checkbox, chart) {
				/**
				 * item.checkbox
				 * item.chart
				 * item.summary
				 * item.request
				 * item.xhr
				 */
				var item = {
						checkbox: checkbox,
						chart: chart
					};
				
				item.xhr = new JSONRequest(top.server, onResponse.bind(window, item));
				
				return list[list.length] = item;
			};
			
			this.find = function (chart) {
				for (var i=0, length=list.length; i<length; i++) {
					if (list[i].chart === chart) {
						return list[i];
					}
				}
			};
			
			this.remove = function (checkbox) {
				return list.splice(list.indexOf(find(checkbox)), 1)[0];
			};
		};
	
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
		elements.cpuList = document.getElementById("cpu_list");
		elements.memList = document.getElementById("mem_list");
		elements.diskList = document.getElementById("disk_list");
		elements.portList = document.getElementById("port_list");
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
		elements.fixStart.addEventListener("click", onFixDate.bind(elements.fixStart, elements.startDate), false);
		elements.fixEnd.addEventListener("click", onFixDate.bind(elements.fixEnd, elements.endDate), false);
		//elements.navigation.addEventListener("mousedown", function (e) {e.stopPropagation();}, false);
	}
	
	function load(ipAddress) {
		ip = ipAddress;
		
		new JSONRequest(top.server, onInitResponse).request({
			database: "snmp",
			command: "get"
		});
	}
	
	function init() {
		var storage, port, data,
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
		checkbox.addEventListener("click", onCheckResource.bind(checkbox, "delay", 0), false);
		
		// cpu
		for (index in device.hrProcessorIndex) {
			checkbox = document.createElement("input");
			checkbox.addEventListener("click", onCheckResource.bind(checkbox, "processor", index), false);
			
			li = document.createElement("li");
			li.appendChild(checkbox).type = "checkbox";
			li.appendChild(document.createElement("span")).textContent = "index."+ index;
			
			elements.cpuList.appendChild(li);
		}
		
		// storage
		for (index in device["hrStorageIndex"]) {
			storage = device["hrStorageEntry"][index];
			
			li = document.createElement("li");
			checkbox = document.createElement("input");
			li.appendChild(checkbox).type = "checkbox";
			
			/**
			 * physical memory
			 */
			if (storage["hrStorageType"] === 2) {				
				li.appendChild(document.createElement("span")).textContent = "index."+ index;
				
				checkbox.addEventListener("click", onCheckResource.bind(checkbox, "memory", index), false);
				
				elements.memList.appendChild(li);
			}
			
			/**
			 * non-removable storage
			 */
			else if (storage["hrStorageType"] === 4) {
				li.appendChild(document.createElement("span")).textContent = storage["hrStorageDescr"];
				
				checkbox.addEventListener("click", onCheckResource.bind(checkbox, "storage", index), false);
				
				elements.diskList.appendChild(li);
			}			
		}
		
		/**
		 * interface
		 */
		for (index in device["ifIndex"]) {
			port = device["ifEntry"][index];
			
			checkbox = document.createElement("input");
			
			li = document.createElement("li");
			li.title = port["ifDescr"];
			li.appendChild(checkbox).type = "checkbox";
			li.appendChild(document.createElement("span")).textContent = port["ifName"];
			
			checkbox.addEventListener("click", onCheckResource.bind(checkbox, "inoctet", index), false);
			checkbox.addEventListener("click", onCheckResource.bind(checkbox, "ouoctet", index), false);
			
			elements.portList.appendChild(li);
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
	 * monitor 하고자 하는 resource가 선택되거나 해제되는 경우 발생하는 event
	 */
	function onCheckResource(database, index, e) {
		var checkbox = e.currentTarget;
		
		if (checkbox.checked) {
			var date = new Date(),
				request = {
					database: database,
					command: "get",
					data: {}
				},
				chart = createChart(database),
				item = checkedList.add(checkbox, chart);
			
			request.data[ip] = {
				index: index,
				end: date.setMinutes(0, 0, 0),
				start: date.setFullYear(date.getFullYear() -1),
				summary: true
			};
			
			item.request = request;
			
			elements.chart.appendChild(chart.chart);
			
			item.xhr.request(request);
		}
		else {
			elements.chart.removeChild(checkedList.remove(checkbox).chart.chart);
		}
		
		resize();
	}
	
	function createChart(database) {
		var chart = new Chart(),
			unit = "";
		
		if (database === "delay") {
			unit = "(ms)";
		}
		else if (database === "processor") {
			unit = "(%)";
		}
		else if (database === "storage" || database === "memory") {
			chart.onvalue = function () {
				
			}
			
			unit = "(MBytes)";
		}
		else if (database === "inoctet" || database === "outoctet") {
			unit = "(Mbps)";
		}
		
		chart.title = database + unit;
		chart.ondrag = onDrag.bind(window, chart);
		chart.chart.onmouseenter = onEnterChart.bind(window, chart);
		
		return chart;
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
		var item = checkedList.find(chart),
			request = item.request;
		
		if (!item) {
			throw "";
		}
		
		data = request.data[ip];
		
		data.start = chart.start;
		data.end = chart.end;
		data.summary = false;
		
		item.xhr.request(request);
	}
	
	function onRefresh(chart) {
		var start = elements.startDate.value,
			end = elements.endDate.value;
		
		if (start !== "" && end !== "") {
			chart.set(new Date(start).setHours(0, 0, 0, 0), new Date(end).setHours(0, 0, 0, 0));
		}
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
			else {
				return;
			}
			
			setDate(chart);
		}
	}

	function onFixDate(dateElement, e) {
		var checkbox = e.currentTarget;
		
		dateElement.disabled = !checkbox.checked;
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
	
	function onEnterChart(chart) {
		if (chart.chart == elements.navigation.parentNode) {
			removeElement(elements.setup);
			
			return;
		}
		
		chart.chart.appendChild(elements.setup);
		elements.setup.onclick = onSetUpChart.bind(window, chart);
		
		//setDate(chart);
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
	
	function onResponse(item, response) {
		var response = parseResponse(response),
			resData, reqData; 
		
		try {
			resData = response.data[ip];
			reqData = item.request.data[ip];
		}
		catch (e) {
			throw e;
		}
		
		if (!resData) {
			throw "null data";
		}
		
		if (reqData.summary) {
			item.chart.data = resData;
			
			item.chart.invalidate();
		}
		else {
			item.chart.draw(resData);
		}
		
	}
	
}) (window);
