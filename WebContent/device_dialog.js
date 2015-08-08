;"use strict";

var elements = {};

(function (window, undefined) {
	var form, profile, device,
		func = {};
	
	window.addEventListener("load", onLoad, false);
	window.addEventListener("keydown", function (e) {
		if (e.keyCode == 27) {
			form.reset();
		}
	}, false);
	window.focus();
	
	window.load = load;
	
	function onLoad(e) {
		form = document.getElementById("form");
		profile = document.getElementById("profile");
		
		form.addEventListener("submit", onApply, false);
		form.addEventListener("reset", onCancel, false);
		elements["monitor"] = document.getElementById("monitor");
		
		func["apply"] = apply.bind(form, null);
		
		window.xhr = new JSONRequest(top.server, onResponse);
	}
	
	function load() {
		device = arguments[0];
		
		window.xhr.request({
			database: "profile",
			command: "get"
		});
	}
	
	function init() {
		if (!device) {
			func["apply"] = apply.bind(form, null);
			
			form.name.focus();
		}
		else {
			form.name.value = device.name;
			form.type.value = device.type;
			form.address.value= device.address;
			form.profile.value = device.profile;
			form.label.value = device.label || "";
			
			func["apply"] = apply.bind(form, device);
			
			if (device.address !== "" && device.profile !== "") {
				elements["monitor"].disabled = false;
				elements["monitor"].addEventListener("click", onMonitor, false);
			}
			
			form.name.select();
		}
		
		top.clearScreen();
	}
	
	function onApply(e) {
		e.preventDefault();
		
		func["apply"]();
	}
	
	function apply(json) {
		var name = this.name.value,
			type = this.type.value,
			address = this.address.value,
			profile = this.profile.value,
			label = trimLabel(this.label.value),
			request = {
				database: "device",
				command: "put",
				data: {}
			};
	
		if (json == null) {
			request.data["-1"] = (json = {});
			
			//json["x"] = 0;
			//json["y"] = 0;
		}
		else {
			request.data[json.id] = json;
		}
		
		json["name"] = name;
		json["type"] = type;
		json["address"] = address;
		json["profile"] = profile;
		json["label"] = label;
		
		window.xhr.request (request);
	}
	
	function trimLabel(labelString) {
		if (typeof labelString !== "string") {
			return "";
		}
		
		var labelArray = labelString.split(","),
			length = labelArray.length;
		
		for (var i=0; i<length; i++) {
			labelArray[i] = " "+ labelArray[i].trim();
		}
		
		return labelArray.join(",");
	}
	
	function onMonitor(e) {
		top.openContent("monitor.html", device["address"]);
		top.closeDialog();
	}
	
	function onCancel(e) {
		top.closeDialog();
	}
	
	function onResponse(response) {
		if ("error" in response) {
			var status = response.error.status;
			
			if (status == 401) {
				top.signOut();
			}
		}
		else if ("json" in response) {
			var json = response.json,
				command = json.command,
				data = json.data;
				
			if (command === "get") {
				if (json.database == "profile") {
					for (var name in data) {
						profile.appendChild(document.createElement("option")).text = name;
					}
					
					init();
				}
			}
			else if (command === "put") {
				top.openContent("device_list.html");
				top.closeDialog();
			}
		}
		else {
			throw "fatal error";
		}
	}
	
}) (window);