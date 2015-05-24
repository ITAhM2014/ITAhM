;"use strict";

(function (window, undefined) {
	var xhr, form, line;
	
	window.addEventListener("load", onLoad, false);
	window.addEventListener("message", onMessage, false);
	
	function onLoad(e) {
	}
	
	function load() {
		xhr = new JSONRequest(top.location.search.replace("?", ""), onResponse);
		form = document.getElementById("form");
		
		form.addEventListener("submit", onApply, false);
		form.addEventListener("reset", onCancel, false);
		
		form.elements["index"].addEventListener("change", onSelectLink, false);
		form.elements["remove"].addEventListener("click", onRemove, false);
	}
	
	function onMessage(e) {
		var data = e.data;
	
		if (!data) {
			return;
		}
		
		switch (data.message) {
		case "data":
			load();
			
			set(data.data);
			break;
		}
	}
	
	function set(data) {console.log(data);
		var line = data.line,
			from = data.deviceFrom,
			to = data.deviceTo;
		
		if (!line) {	
			line = {
				from: from.id,
				to: to.id,
				link: []
			};
		}
		
		form.elements["from"].value = from.name;
		form.elements["to"].value = to.name;
		console.log("onMessage");
		setLink();
	}
	
	function onApply(e) {
		e.preventDefault();
		
		var id = form.elements["id"].value;
		
		if (id == "") {
			return;
		}
		
		apply(id);
	}
	
	function apply(id) {
		var index = form.elements["index"].value,
			request = {
				database: "line",
				command: "put",
				data: {}
			},
			link = {
				bandwidth: form.elements["bandwidth"].value * form.elements["unit"].value,
				from: form.elements["ifdesc_from"].value,
				to: form.elements["ifdesc_to"].value
			};
		
		request.data[id] = line;
		
		if (index < 0) {
			line.link.push(link);
		}
		else {
			line.link[index] = link;
		}
		
		xhr.request (request);
	}
	
	function onSelectLink(e) {
		var index = form.elements["index"].value;
		
		if (index < 0) {
			form.elements["bandwidth"].value = 100;
			form.elements["unit"].value = 1000000;
			form.elements["ifdesc_from"].value = "";
			form.elements["ifdesc_to"].value = "";
			
			form.elements["ifdesc_from"].focus();
		}
		else {
			var link = line.link[index],
				bandwidth = link.bandwidth,
				unit = 1;
			
			while (bandwidth >= 1000) {
				unit *= 1000;
				bandwidth /= 1000;
			}
			
			form.elements["bandwidth"].value = bandwidth;
			form.elements["unit"].value = unit;
			form.elements["ifdesc_from"].value = link.from;
			form.elements["ifdesc_to"].value = link.to;
		}
	}
	
	function onRemove(e) {
		e.preventDefault();
		
		var index = form.elements["index"].value;
		
		if (index < 0) {	
			return;
		}
		
		remove(index);
	}
	
	function remove(index) {
		if (!confirm("remove this link?")) {
			return;
		}
		
		var request = {
				database: "line",
				data: {}
			},
			id = form.elements["id"].value;
		
		line.link.splice(index, 1);
		
		if (line.link.length > 0) {
			request["command"] = "put";
			request.data[id] = line;
		}
		else if (id != -1){
			request["command"] = "delete";
			request.data[id] = null;
		}
		else {
			return;
		}
		
		xhr.request(request);
	}
	
	function reset() {
		parent.postMessage({
			message: "reLoadLine",
		}, "*");
		
		setLink();
	}
	
	function setLink() {
		var index = form.elements["index"],
			linkArray = line.link,
			option,
			numLink = linkArray.length;
		console.log(line);
		form.elements["id"].value = line.id || -1;
		
		index.length = 0;
		
		for (var i=0; i<numLink; i++) {
			option = document.createElement("option");
			option.text = i +1;
			option.value = i;
			
			index.add(option);
		}	
		
		option = document.createElement("option");
		option.text = "new";
		option.value = -1;
		
		index.add(option);
		
		form.elements["num_link"].value = numLink;
	
		onSelectLink();
	}
	
	function onCancel(e) {
		top.postMessage({
			message: "popup"
		}, "*");
	}
	
	function onResponse(response) {
		if ("error" in response) {
			var status = response.error.status;
			
			if (status == 401) {
				parent.location.reload(true);
			}
		}
		else if ("json" in response) {
			var json = response.json;
			if (json != null) {
				switch (json.command) {
				case "echo":
					load();
					
					break;
				case "put":
					for (var id in json.data) {
						break;
					}
					
					line = json.data[id];
					
					reset();
					
					break;
					
				case "delete":
					parent.postMessage({
						message: "reLoadLine",
					}, "*");
					
					onCancel();
					
					break;
				case "get":
					
					
					break;
				}
			}
		}
		else {
			throw "fatal error";
		}
	}
	
}) (window);