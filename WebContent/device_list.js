;"use strict";

var elements = {};

(function (window, undefined) {
	var xhr, form, dialog, remove = {},
		labels = {},
		tmpList = document.createDocumentFragment();
	
	window.addEventListener("load", onLoad, false);
	window.addEventListener("message", onMessage, false);
	
	function onLoad(e) {
		form = document.getElementById("form");
		elements["form"] = form;
		elements["label"] = form.elements["label"];
		elements["list"] = document.getElementById("list");
		
		form.addEventListener("submit", onAdd, false);
		form.addEventListener("reset", onRemove, false);
		elements["label"].addEventListener("change", onSelectLabel, false);
		
		xhr = new JSONRequest(parent.location.search.replace("?", ""), onResponse);
		
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
		var array = [],
			length = 0;
		
		for (var id in remove) {
			array[length++] = remove[id];
		}
		
		if (confirm("remove "+ length +" device(s)?")) {
			while (length-- > 0) {
				array[length]();
			}
		}
	}
	
	function onEdit(json, e) {
		//e.preventDefault();
		top.postMessage({
			message: "popup",
			html: "device_dialog.html",
			data: json
		}, "*");
	}
	
	function onSelect(json, e) {
		if (this.checked) {
			remove[json.id] = _remove.bind(window, json.id);
		}
		else {
			delete remove[json.id];
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
	
	function _remove(id) {
		var request = {
			database: "device",
			command: "delete",
			data: {}
		};
		
		request.data[id] = null;
		
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