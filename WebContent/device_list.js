;"use strict";

var elements = {};

(function (window, undefined) {
	var server, xhr, form, dialog,
		labels = {},
		selectedList = [],
		tmpList = document.createDocumentFragment();
	
	window.addEventListener("load", onLoad, false);
	window.addEventListener("message", onMessage, false);
	
	function onLoad(e) {
		form = document.getElementById("form");
		elements["form"] = form;
		elements["label"] = form.elements["label"];
		elements["list"] = document.getElementById("list");
		elements["monitor"] = document.getElementById("monitor");
		
		form.addEventListener("submit", onAdd, false);
		form.addEventListener("reset", onRemove, false);
		elements["label"].addEventListener("change", onSelectLabel, false);
		elements["monitor"].addEventListener("click", onMonitor, false);
		
		server = parent.location.search.replace("?", "");
		xhr = new JSONRequest(server, onResponse);
		
		xhr.request( {
			database: "device",
			command: "get",
			data: null
		});
	}
	
	function load(list) {
		var tmp = document.createDocumentFragment();
		
		for (var id in list) {
			tmp.appendChild(createRow(list[id]));
		}
		
		elements["list"].appendChild(tmp);
		
		for (var label in labels) {
			tmp.appendChild(document.createElement("option")).text = label;
		}
		
		elements["label"].appendChild(tmp);
	}
	
	function onMessage(e) {
		switch (e.data) {
		case "close":
			dialog.classList.remove("show");
			
			break;
		}
	}
	
	function onAdd(e) {
		top.postMessage({
			message: "popup",
			html: "device_dialog.html"
		}, "*");
	}
	
	function onRemove(e) {
		var length = selectedList.length;
		
		if (length === 0) {
			alert("select device(s) first.");
			
			return;
		}
		
		if (!confirm("remove "+ length +" device(s)?")) {
			return;
		}
		
		var data = {},
			request = {
				database: "device",
				command: "delete",
				data: data
			};
		
		for (var i=0; i<length; i++) {
			data[selectedList[i]["id"]] = null;
		}
			
		xhr.request(request);
	}
	
	function onEdit(json, e) {
		//e.preventDefault();
		top.postMessage({
			message: "popup",
			html: "device_dialog.html",
			data: json
		}, "*");
	}
	
	function onSelect(deviceData, e) {
		var index = selectedList.indexOf(deviceData);
		
		if (this.checked) {
			if (index === -1) {
				selectedList[selectedList.length] = deviceData;
			}
		}
		else {
			if (index !== -1) {
				selectedList.splice(index, 1);
			}
		}	
	}
	
	function onSelectLabel(e) {
		var label = this.value,
			rows = labels[label],
			list = elements["list"],
			node,
			tmp = document.createDocumentFragment();
		
		if (label === "all") {
			list.appendChild(tmpList);
		}
		else {
			while(node = list.firstChild) {
				tmpList.appendChild(node);
			}
		
			for (var i=0, _i=rows.length; i<_i; i++) {
				tmp.appendChild(rows[i]);
			}
			
			list.appendChild(tmp);
		}
	}
	
	function onMonitor(e) {
		var length = selectedList.length,
			device;
		
		if (length === 0) {
			alert("select device(s) first.");
			
			return;
		}
		
		for (var i=0; i<length; i++) {
			device = selectedList[i];
			
			if (device.ip !== "" && device.profile !== "") {
				window.open("monitor.html").arguments = {
					server: server, 
					device: device
				};
			}
		}
			
		xhr.request(request);
	}
	
	function createRow(deviceData) {
		var row = document.createElement("tr"),
			checkbox = document.createElement("input"),
			cols = 5;
		
		while (cols-- > 0) {
			row.insertCell();
		}
		
		checkbox.type = "checkbox";
		
		row.cells[0].appendChild(checkbox);
		row.cells[1].textContent = deviceData.name;
		row.cells[2].textContent = deviceData.type;
		row.cells[3].textContent = deviceData.address;
		row.cells[4].textContent = deviceData.profile;
		
		checkbox.addEventListener("click", onSelect.bind(checkbox, deviceData), false);
		row.cells[1].addEventListener("click", onEdit.bind(row, deviceData), false);
		
		parseLabel(deviceData, row);
		
		return row;
	}
	
	function parseLabel(deviceData, element) {
		var labelString = deviceData.label,
			labelArray,
			label,
			group,
			length;
		
		if (!labelString) {
			return;
		}
		
		labelArray = labelString.split(",");
		length = labelArray.length;
		
		for (var i=0; i<length; i++) {
			label = labelArray[i].trim();
			
			group = labels[label];
			if (group === undefined) {
				group = [];
				
				labels[label] = group;
			}
			
			group[group.length] = element;
		}
	}
	
	function onResponse(response) {
		if ("error" in response) {
			var status = response.error.status;
			
			if (status == 401) {
				if (parent != window) {
					parent.postMessage({
						message: "unauthorized"
					}, "*");
				}
			}
		}
		else if ("json" in response) {
			var json = response.json;
			
			switch (json.command) {
			case "get":
				load(json.data);
				
				break;
			case "delete":
				window.location.reload();
				
				break;
			}
		}
		else {
			throw "fatal error";
		}
	}
	
}) (window);