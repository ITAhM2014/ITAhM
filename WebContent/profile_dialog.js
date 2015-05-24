;"use strict";

(function (window, undefined) {
	
	var xhr, form;
	
	window.addEventListener("load", onLoad, false);
	window.addEventListener("message", onMessage, false);
	
	function onLoad(e) {	
	}
	
	function load(data) {
		xhr = new JSONRequest(top.location.search.replace("?", ""), onResponse);
		form = document.getElementById("form");
		
		form.addEventListener("submit", onApply, false);
		form.addEventListener("reset", onCancel, false);
		
		if (data) {
			form.name.value = data.name;
			form.version.value = data.version;
			form.community.value = data.community;
			
			form.name.select();
		}
		else {
			form.name.focus();
		}
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
		
		var request = {
			database: "profile",
			command: "put",
			data: {}
		};
		
		request.data[this.name.value] = {
			name: this.name.value,
			version: this.version.value,
			community: this.community.value
		};
		
		xhr.request(request);
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
				top.postMessage({
					message: "unauthorized"
				}, "*");
			}
		}
		else if ("json" in response) {
			var json = response.json;
			
			switch (json.command) {
			case "put":
				top.postMessage({
					message: "reload",
					html: "profile.html"
				}, "*");
			}
		}
		else {
			throw "fatal error";
		}
	}
	
}) (window);