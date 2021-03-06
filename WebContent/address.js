;"use strict";

(function (window, undefined) {
	var xhr, list;
	
	window.addEventListener("load", onLoad, false);
	
	window.load = load;
	
	function onLoad(e) {
		xhr = new JSONRequest(top.location.search.replace("?", ""), onResponse);
		
		xhr.request({
			command: "echo"
		});
	}
	
	function load() {
		list = document.getElementById("list");
		
		xhr.request( {
			database: "address",
			command: "get",
			data: null
		});
	}
	
	function createAddress(ip, data) {
		var row = document.createElement("tr"),
			cols = 4;
		
		while (cols-- > 0) {
			row.insertCell();
		}
		
		row.cells[0].textContent = ip;
		row.cells[1].textContent = data.mac;
		row.cells[2].textContent = new Date(data.from).toLocaleString();
		row.cells[3].textContent = new Date(data.last).toLocaleString();
		
		return row;
	}
	
	function init(json) {
		var table = document.createDocumentFragment();
		
		for (var ip in json) {
			table.appendChild(createAddress(ip, json[ip]));
		}
		
		list.appendChild(table);
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
				init (json.data);
			}
		}
		else {
			throw "fatal error";
		}
	}
	
}) (window);