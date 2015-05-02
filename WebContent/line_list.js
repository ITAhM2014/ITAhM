;"use strict";

(function (window, undefined) {
	var xhr = new JSONRequest("local.itahm.com:2014", onResponse),
		list = document.getElementById("list"),
		form = document.getElementById("form"),
		dialog = document.getElementById("dialog"),
		removeWrapper = {},
		unit = ["bps", "Kbps", "Mbps", "Gbps", "Tbps"];
	
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
			database: "line",
			command: "get",
			data: null
		});
	}
	
	function onMessage(e) {
		var data = e.data;
		
		if (!data) {
			return;
		}
		
		switch(data.message) {
		case "reLoadLine":
			reLoadLine();
			
			break;
		case "showLineDialog":
			showLineDialog();
			
			break;
		case "closeLineDialog":
			closeLineDialog();
			
			break;
		}
	}
	
	function onEdit(json, e) {
		//e.preventDefault();
		
		dialog.contentWindow.postMessage(json, "*");
		
		dialog.classList.add("show");
	}
	
	function closeLineDialog() {
		dialog.classList.remove("show");
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
	
	function createLink(line, index) {
		var link = line.link[index],
			row = list.insertRow(),
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
	}
	
	function init(json) {
		var line, link, index;
		
		for (var id in json) {
			line = json[id];
			link = line.link;
			
			for (index=0; index<link.length; index++) {
				createLink(line, index);
			}
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
				
				break;
			}
		}
		else {
			console.log("fatal error");
		}
	}
	
}) (window);