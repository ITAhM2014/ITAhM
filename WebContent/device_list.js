;"use strict";

(function (window, undefined) {
	var xhr = new JSONRequest("local.itahm.com:2014", onResponse),
		list = document.getElementById("list"),
		form = document.getElementById("form"),
		dialog = document.getElementById("dialog"),
		removeWrapper = {};
	
	form.addEventListener("submit", onAdd, false);
	form.addEventListener("reset", onRemove, false);
	window.addEventListener("load", onLoad, false);
	window.addEventListener("message", onMessage, false);
	
	function onAdd(e) {
		e.preventDefault();
		
		dialog.contentWindow.postMessage(null, "*");
		
		dialog.classList.add("show");
	}
	
	function onRemove(e) {
		var array = [],
			length = 0;
		
		for (var id in removeWrapper) {
			array[length++] = removeWrapper[id];
		}
		
		if (confirm("remove "+ length +" device(s)?")) {
			while (length-- > 0) {
				array[length]();
			}
		}
	}
	
	function onLoad(e) {
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
	
	function onEdit(json, e) {
		//e.preventDefault();
		
		dialog.contentWindow.postMessage(json, "*");
		
		dialog.classList.add("show");
	}
	
	function onSelect(json, e) {
		if (this.checked) {
			removeWrapper[json.id] = remove.bind(window, json.id);
		}
		else {
			delete removeWrapper[json.id];
		}
		
	}
	
	function remove(id) {
		var request = {
			database: "device",
			command: "delete",
			data: {}
		};
		
		request.data[id] = null;
		
		xhr.request(request);
	}
	
	function createDevice(json) {
		var row = list.insertRow(),
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
		for (var id in json) {createDevice(json[id]);
			//list.appendChild(createDevice(json[id]));
		}
	}
	
	function onResponse(response) {
		if ("error" in response) {
			var status = response.error.status;
			
			if (status == 401) {
				location.href = "signin.html";
			}
			
			console.log(status);
		}
		else if ("json" in response) {
			var json = response.json;
			
			switch (json.command) {
			case "get":
				init (json.data);
				
				break;
			case "delete":
				window.location.reload();
			}
		}
		else {
			console.log("fatal error");
		}
	}
	
}) (window);