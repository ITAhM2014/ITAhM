;"use strict";

(function (window, undefined) {
	var xhr, 	form, 	icon;
	
	window.addEventListener("load", onLoad, false);
	window.addEventListener("message", onMessage, false);
	
	function onLoad(e) {
	}
	
	function load(data) {
		xhr = new JSONRequest(top.location.search.replace("?", ""), onResponse);
		form = document.getElementById("form");
		icon = document.getElementById("icon");
		
		icon.src = data.src;
		form.type.value = data.type;
		form.url.focus();
		
		form.addEventListener("reset", onCancel, false);
		form.url.addEventListener("focus", onFocusIn, false);
		form.url.addEventListener("blur", onFocusOut, false);
		
		loadend();
	}
	
	function loadend() {
		top.postMessage({
			message: "loadend"
		}, "http://app.itahm.com");
	}
	
	function onMessage(e) {
		var data = e.data;
		
		if (!data) {
			return;
		}
		
		switch (data.message) {
		case "data":
			load(data.data);
			
			break;
		}
	}
	
	function onApply(e) {
		e.preventDefault();
		
		applyWrapper();
	}
	
	function onFocusIn(e) {
		//setTimeout(loadIcon, 1000);
	}
	
	function onFocusOut(e) {
		
	}
	
	function loadIcon() {
		
	}
	
	function apply(json) {
		var name = this.name.value,
			type = this.type.value,
			address = this.address.value,
			profile = this.profile.value,
			request = {
				database: "device",
				command: "put",
			};
	
		if (json == null) {
			request.value = {};
		}
		else {
			request.key = json.id;
			request.value = json;
		}
		
		request.value.name = name;
		request.value.type = type;
		request.value.address = address;
		request.value.profile = profile;
		
		xhr.request (request);
	}
	
	function onCancel(e) {
		parent.postMessage({
			message: "popup"
		}, "*");
	}
	
	function init(json) {
		//for (var name in json) {
		//	profile.appendChild(document.createElement("option")).text = name;
		//}
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
				case "echo":
					load();
					
					break;
				case "get":
					if (json.database == "profile") {
						init(json.result);
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