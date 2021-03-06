;"use strict";

var elements = {};

(function (window, undefined) {
	var list,form,dialog,remove = {};
	
	window.addEventListener("load", onLoad, false);
	
	window.load = load;
	
	function onLoad(e) {
		list = document.getElementById("list");
		form = document.getElementById("form");
		dialog = document.getElementById("dialog");
		
		form.addEventListener("submit", onAdd, false);
		form.addEventListener("reset", onRemove, false);
		
		window.unit = ["bps", "Kbps", "Mbps", "Gbps", "Tbps"];
		window.xhr = new JSONRequest(top.server, onResponse);
	}
	
	function load() {
		xhr.request( {
			database: "line",
			command: "get",
			data: null
		});
	}
	
	function onAdd(e) {
		e.preventDefault();
		
		top.showDialog("line_dialog.html");
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
	
	function onEdit(data, e) {
		top.showDialog("line_dialog.html", data);
	}
	
	function closeLineDialog() {
		dialog.classList.remove("show");
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
	
	function createLink(line, index) {
		var link = line.link[index],
			row = document.createElement("tr"),
			checkbox = document.createElement("input"),
			cols = 5,
			bandwidth = link.bandwidth;
		
		while (cols-- > 0) {
			row.insertCell();
		}
		
		for (var index=0; bandwidth > 999; index++) {
			bandwidth /= 1000;
		}
		
		checkbox.type = "checkbox";
		
		row.cells[0].appendChild(checkbox);
		row.cells[1].textContent = link.name || "";
		row.cells[2].textContent = bandwidth + unit[index];
		
		checkbox.addEventListener("click", onSelect.bind(checkbox, line, index), false);
		row.cells[1].addEventListener("click", onEdit.bind(row, line, index), false);
		
		return row;
	}
	
	function init(json) {
		var line, link, index,
			table = document.createDocumentFragment();
		
		for (var id in json) {
			line = json[id];
			link = line.link;
			
			for (index=0; index<link.length; index++) {
				table.appendChild(createLink(line, index));
			}
		}
		
		list.appendChild(table);
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
			console.log("fatal error");
		}
	}
	
}) (window);