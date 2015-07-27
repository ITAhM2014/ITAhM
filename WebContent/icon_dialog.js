;"use strict";

var elements = {};

(function (window, undefined) {
	var form, icon;
	
	window.addEventListener("load", onLoad, false);
	
	window.load = load;
	
	function onLoad(e) {
		form = document.getElementById("form");
		
		elements["type"] = document.getElementById("type");
		elements["icon"] = document.getElementById("icon");
		
		form.elements["url"].focus();
		
		form.addEventListener("submit", onApply, false);
		form.addEventListener("reset", onCancel, false);
		
		window.xhr = new JSONRequest(top.server, onResponse);
	}
	
	function load(data) {
		var src = data.src,
			type = data.type;
		
		elements["icon"].src = src;
		elements["icon"].onload = top.clearScreen;
		
		elements["type"].textContent = type;
	}
	
	function onApply(e) {
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
			var json = response.json;
			if (json != null) {
			}
		}
		else {
			console.log("fatal error");
		}
	}
	
}) (window);