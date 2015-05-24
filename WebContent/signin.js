;"use strict";

(function (window, undefined) {
	var 
		form;
		//xhr = new JSONRequest("local.itahm.com:2014", onResponse);
	
	window.addEventListener("load", onLoad, false);
	
	function onLoad() {
		form = document.getElementById("form");
		
		form.server.value = parent.location.search.replace("?", "");
		
		form.addEventListener("submit", onSignIn, false);
	}
	
	function onSignIn(e) {
		e.preventDefault();
		
		var username = form.username.value,
			password = form.password.value;
		
		new JSONRequest(form.server.value, onResponse).set("Authorization", "Basic "+ btoa(username +":"+password)).request();
	}
	
	function onResponse(response) {
		if ("error" in response) {
			var status = response.error.status;
			
			if (status == 401) {
				alert("invalid USERNAME or PASSWORD");;
			}
		}
		else if ("json" in response) {
			top.postMessage({
				message: "signin"
			}, "*");
		}
		else {
			
		}
	}
	
}) (window);