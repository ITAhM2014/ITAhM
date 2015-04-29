;"use strict";

(function (window, undefined) {
	var xhr = new JSONRequest("local.itahm.com:2014", onResponse),
		form = document.getElementById("form"),
		profile = document.getElementById("profile"),
		applyWrapper = apply.bind(form, null);
	
	form.addEventListener("submit", onApply, false);
	form.addEventListener("reset", onCancel, false);
	window.addEventListener("load", onLoad, false);
	window.addEventListener("message", onMessage, false);
	
	function onLoad(e) {
		xhr.request({
			database: "profile",
			command: "get"
		});
	}
	
	function onMessage(e) {
		var json = e.data;
	
		if (json == null) {
			applyWrapper = apply.bind(form, null);
			
			form.name.focus();
		}
		else {
			form.name.value = json.name;
			form.type.vaule = json.type;
			form.address.value= json.address;
			form.profile.value = json.profile;
			
			applyWrapper = apply.bind(form, json);
			
			form.name.select();
		}
	}
	
	function onApply(e) {
		e.preventDefault();
		
		applyWrapper();
	}
	
	function apply(json) {
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
		parent.postMessage("close", "*");
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
				if (parent != window) {
					parent.location.reload(true);
				}
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
					parent.location.reload(true);
					
					break;
				}
			}
		}
		else {
			console.log("fatal error");
		}
	}
	
}) (window);