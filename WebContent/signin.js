;"use strict";

(function (window, undefined) {
	var form = document.getElementById("form"),
		xhr = new JSONRequest(form.server.value, onResponse);
		//xhr = new JSONRequest("local.itahm.com:2014", onResponse);
	
	form.addEventListener("submit", onSignIn, false);
	
	function onSignIn(e) {
		e.preventDefault();
		
		var username = form.username.value,
			password = form.password.value;
		
		xhr.set("Authorization", "Basic "+ btoa(username +":"+password)).request();
	}
	
	function onResponse(response) {
		if ("error" in response) {
			var status = response.error.status;
			
			if (status == 401) {
				alert("invalid USERNAME or PASSWORD");;
			}
			
			console.log(status);
		}
		else if ("json" in response) {
			location.href = "home.html";
		}
		else {
		}
	}
}) (window);