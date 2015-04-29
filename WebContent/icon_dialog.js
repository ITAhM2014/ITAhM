;"use strict";

(function (window, undefined) {
	var xhr = new JSONRequest("local.itahm.com:2014", onResponse);
		form = document.getElementById("form"),
		icon = document.getElementById("icon"),
		//applyWrapper = apply.bind(form, null);
	
	//form.addEventListener("submit", onApply, false);
	form.addEventListener("reset", onCancel, false);
	form.url.addEventListener("focus", onFocusIn, false);
	form.url.addEventListener("blur", onFocusOut, false);
	window.addEventListener("load", onLoad, false);
	window.addEventListener("message", onMessage, false);
	
	function onLoad(e) {
		/*xhr.request({
			database: "profile",
			command: "get"
		});*/
	}
	
	function onMessage(e) {
		var json = e.data;
	
		if (json == null) {
			//applyWrapper = apply.bind(form, null);
			
			//form.name.focus();
		}
		else {
			icon.src = json.src;
			form.type.value = json.type;
			
			form.url.focus();
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
		parent.postMessage("close", "*");
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