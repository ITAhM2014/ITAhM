;"use strict";

(function (window, undefined) {
	var xhr = new JSONRequest("local.itahm.com:2014", onResponse),
		form = document.getElementById("form");
	
	form.addEventListener("submit", onApply, false);
	form.addEventListener("reset", onCancel, false);
	window.addEventListener("message", onMessage, false);
	
	function onMessage(e) {
		var json = e.data;

		if (json != null) {
			form.name.value = json.name;
			form.version.value = json.version;
			form.community.value = json.community;
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
		parent.postMessage("close", "*");
	}
	
	function onResponse(response) {
		if ("error" in response) {
			var status = response.error.status;
			
			if (status == 401) {
			}
		}
		else if ("json" in response) {
			var json = response.json;
			if (json != null) {
				parent.postMessage("reload", "*");
			}
		}
		else {
			console.log("fatal error");
		}
	}
	
}) (window);