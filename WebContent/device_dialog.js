;"use strict";

(function (window, undefined) {
	var xhr, form, profile, apply;
	
	window.addEventListener("load", onLoad, false);
	window.addEventListener("message", onMessage, false);
	
	function onLoad(e) {
	}
	
	function load() {
		xhr = new JSONRequest(top.location.search.replace("?", ""), onResponse);
		form = document.getElementById("form");
		profile = document.getElementById("profile");
		
		apply = _apply.bind(form, null);
		
		form.addEventListener("submit", onApply, false);
		form.addEventListener("reset", onCancel, false);
		
		xhr.request({
			database: "profile",
			command: "get"
		});
	}
	
	function onMessage(e) {
		var data = e.data;
		
		if (!data) {
			return;
		}
		
		switch (data.message) {
		case "data":
			set(data.data);
			
			break;
		}
	}
	
	function set(device) {
		load();
		
		if (!device) {
			apply = _apply.bind(form, null);
			
			form.name.focus();
		}
		else {
			form.name.value = device.name;
			form.type.vaule = device.type;
			form.address.value= device.address;
			form.profile.value = device.profile;
			
			apply = _apply.bind(form, device);
			
			form.name.select();
		}
	}
	
	function onApply(e) {
		e.preventDefault();
		
		apply();
	}
	
	function _apply(json) {
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
		}, "*");
	}
	
	function init(json) {
		for (var name in json) {
			profile.appendChild(document.createElement("option")).text = name;
		}
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
			if (json != null) {
				switch (json.command) {
				case "get":
					if (json.database == "profile") {
						init(json.data);
					}
					
					break;
				case "put":
					top.postMessage({
						message: "reload",
						html: "device_list.html"
					}, "*");
					
					break;
				}
			}
		}
		else {
			throw "fatal error";
		}
	}
	
}) (window);