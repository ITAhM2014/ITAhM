;"use strict";

(function (window, undefined) {
	var xhr, form, ifentry, cpu;
	
	window.addEventListener("load", onLoad, false);
	window.addEventListener("message", onMessage, false);
	
	function onLoad(e) {
		xhr = new JSONRequest(top.location.search.replace("?", ""), onResponse);
		
		xhr.request({
			command: "echo"
		});
	}
	
	function onMessage(e) {
		var data = e.data;
		
		if (!data) {
			return;
		}
		
		switch(data.message) {
		}
	}
	
	function load() {
		form = document.getElementById("form");
		ifentry = document.getElementById("ifentry"),
		cpu = document.getElementById("cpu");
		
		xhr.request( {
			database: "snmp",
			command: "get",
			data: {
				"127.0.0.1": null
			}
		});
	}
	
	function init(json) {
		var node = json["127.0.0.1"];
		console.log(node);
		if (node.timeout > 0) {
			form.elements["status"].value = "down ("+ new Date(node.timeout) +")";
			form.elements["status"].classList.add("down");
		}
		else {
			form.elements["status"].value = "up";
			form.elements["status"].classList.remove("down");
		}
		
		var uptime = node.hrSystemUptime /1000,
			days, hours, minutes, seconds;
		
		days = Math.floor(uptime /24 /3600);
		uptime -= days *24 *3600;
		
		hours = Math.floor((uptime /3600));
		uptime -= hours * 3600;
		
		minutes = Math.floor((uptime /60));
		uptime -= minutes * 60;
		
		form.elements["uptime"].value = days +" days " + hours +" hours " + minutes +" minutes " + Math.floor(uptime) +" seconds";
		
		form.elements["name"].value = node.sysName;
		form.elements["descr"].value = node.sysDescr;
		form.elements["enterprise"].value = sysObjectID(node.sysObjectID);
		
		var index
		for (index in node.hrProcessorLoad) {
			cpu.appendChild(document.createElement("li")).textContent = node.hrProcessorLoad[index] +" %";
		}
		
		for (index in node.ifEntry) {
			initIFEntry(node.ifEntry[index]);
		}
		//console.log(node);
	}
	
	function initIFEntry(entry) {
		var tr = ifentry.insertRow();
		
		tr.insertCell().textContent = entry.ifName;
		tr.insertCell().textContent = ifType[entry.ifType] || "unknown";
		tr.insertCell().textContent = entry.ifSpeed;
		tr.insertCell().textContent = ifAdminStatus[entry.ifAdminStatus];
		tr.insertCell().textContent = ifOperStatus[entry.ifOperStatus];
		tr.insertCell();
	}
	
	function onResponse(response) {
		if ("error" in response) {
			var status = response.error.status;
			
			if (status == 401) {
				top.postMessage({
					message: "unauthorized"
				}, "*");
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
			}
		}
		else {
			throw "fatal error";
		}
	}
	
}) (window);