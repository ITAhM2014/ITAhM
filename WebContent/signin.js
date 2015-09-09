;"use strict";

var elements = {};

(function (window, undefined) {
	var xhr;
	
	window.addEventListener("load", onLoad, false);
	window.addEventListener("keydown", onKeyDown, false);
	window.load = load;
	
	function onLoad() {
		var form = document.getElementById("form");
		
		elements.server = document.getElementById("server");
		elements.user = form.elements["username"];
		elements.password = form.elements["password"];
		
		form.addEventListener("submit", onSignIn, false);
	}
	
	function load(data) {
		elements.server.textContent = top.server;
		xhr = new JSONRequest(top.server, onResponse);
		
		top.clearScreen();
	}
	
	function onSignIn(e) {
		e.preventDefault();
		
		var request = {
				command: "signin",
				username: elements.user.value,
				password: elements.password.value
			};
		
		xhr.request(request);
	}
	
	function onKeyDown(e) {
		var keyCode = e.keyCode;
		
		if (keyCode == 27) {
			//top.closeDialog()();
		}
		else if (keyCode == 13) {
			//onSignIn();
		}
	}
	
	function onResponse(response) {
		if ("error" in response) {
			var status = response.error.status;
			
			if (status == 401) {
				alert("invalid USERNAME or PASSWORD");;
			}
		}
		else if ("json" in response) {
			top.home();
			top.closeDialog();
		}
		else {
			throw response;
		}
	}
	
}) (window);