;"use strict";

(function (window, undefined) {
	var xhr, device, form, profile,
		func = {};
	
	window.addEventListener("load", onLoad, false);
	window.addEventListener("message", onMessage, false);
	window.addEventListener("keydown", function (e) {
		if (e.keyCode == 27) {
			form.reset();
		}
	}, false);
	window.focus();
	
	function onLoad(e) {
		form = document.getElementById("form");
		profile = document.getElementById("profile");
		
		form.addEventListener("submit", onApply, false);
		form.addEventListener("reset", onCancel, false);
		
		func["apply"] = apply.bind(form, null);
		
		xhr = new JSONRequest(top.location.search.replace("?", ""), onResponse);
	}
	

	function load() {
		if (!device) {
			func["apply"] = apply.bind(form, null);
			
			form.name.focus();
		}
		else {
			form.name.value = device.name;
			form.type.value = device.type;
			form.address.value= device.address;
			form.profile.value = device.profile;
			
			func["apply"] = apply.bind(form, device);
			
			form.name.select();
		}
		
		loadend();
	}
	
	function loadend() {
		top.postMessage({
			message: "loadend"
		}, "http://app.itahm.com");
	}
	
	function onMessage(e) {
		var data = e.data,
			message;
		
		if (!data) {
			return;
		}
		
		message = data.message;
		device = data.data;
		
		if (message === "data") {
			xhr.request({
				database: "profile",
				command: "get"
			});	
		}
	}
	
	function onApply(e) {
		e.preventDefault();
		
		func["apply"]();
	}
	
	function apply(json) {console.log(this.type.value);
		var name = this.name.value,
			type = this.type.value,
			address = this.address.value,
			profile = this.profile.value,
			request = {
				database: "device",
				command: "put",
				data: {}
			};
	
		if (json == null) {
			request.data["-1"] = (json = {});
			
			json["x"] = 0;
			json["y"] = 0;
		}
		else {
			request.data[json.id] = json;
		}
		
		json["name"] = name;
		json["type"] = type;
		json["address"] = address;
		json["profile"] = profile;
		
		xhr.request (request);
	}
	
	function onCancel(e) {
		top.postMessage({
			message: "popup"
		}, "http://app.itahm.com");
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
			var json = response.json,
				command = json.command,
				data = json.data;
				
			if (command === "get") {
				if (json.database == "profile") {
					for (var name in data) {
						profile.appendChild(document.createElement("option")).text = name;
					}
					
					load();
				}
			}
			else if (command === "put") {
				top.postMessage({
					message: "reload",
					html: "device_list.html"
				}, "*");
			}
		}
		else {
			throw "fatal error";
		}
	}
	
}) (window);