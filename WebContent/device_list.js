;"use strict";

(function (window, undefined) {
	var xhr, list, form, dialog, remove = {};
	
	window.addEventListener("load", onLoad, false);
	window.addEventListener("message", onMessage, false);
	
	function onLoad(e) {
		xhr = new JSONRequest(parent.location.search.replace("?", ""), onResponse);
		
		xhr.request({
			command: "echo"
		});
	}
	
	function load() {
		list = document.getElementById("list");
		form = document.getElementById("form");
		//dialog = document.getElementById("dialog");
		
		form.addEventListener("submit", onAdd, false);
		form.addEventListener("reset", onRemove, false);
		
		xhr.request( {
			database: "device",
			command: "get",
			data: null
		});
	}
	
	function onMessage(e) {
		switch (e.data) {
		case "close":
			dialog.classList.remove("show");
			
			break;
		}
	}
	/*
	function onAdd(e) {
		e.preventDefault();
		
		dialog.contentWindow.postMessage(null, "*");
		
		dialog.classList.add("show");
	}*/
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
	
	function _remove(id) {
		var request = {
			database: "device",
			command: "delete",
			data: {}
		};
		
		request.data[id] = null;
		
		xhr.request(request);
	}
	
	function createDevice(json) {
		var row = document.createElement("tr"),
			checkbox = document.createElement("input"),
			cols = 5;
		
		while (cols-- > 0) {
			row.insertCell();
		}
		
		checkbox.type = "checkbox";
		
		row.cells[0].appendChild(checkbox);
		row.cells[1].textContent = json.name;
		row.cells[2].textContent = json.type;
		row.cells[3].textContent = json.address;
		row.cells[4].textContent = json.profile;
		
		checkbox.addEventListener("click", onSelect.bind(checkbox, json), false);
		row.cells[1].addEventListener("click", onEdit.bind(row, json), false);
		
		return row;
	}
	
	function init(json) {
		var table = document.createDocumentFragment();
		
		for (var id in json) {
			table.appendChild(createDevice(json[id]));
		}
		
		list.appendChild(table);
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
			case "echo":
				load();
				
				break;
			case "get":
				init (json.data);
				
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