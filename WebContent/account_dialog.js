;"use strict";

(function (window, undefined) {
	var xhr, form;
	
	window.addEventListener("load", onLoad, false);
	window.addEventListener("message", onMessage, false);
	window.addEventListener("keydown", function (e) {
		if (e.keyCode == 27) {
			form.reset();
		}
	}, false);
	window.focus();
	
	function onLoad(e) {	
	}
	
	function load(data) {
		xhr = new JSONRequest(top.location.search.replace("?", ""), onResponse);
		form = document.getElementById("form");
		
		form.addEventListener("submit", onApply, false);
		form.addEventListener("reset", onCancel, false);
		
		if (data) {
			form.username.value = data.username;
			form.password.select();
		}
		else {
			form.username.select();
		}
		
		loadend();
	}

	function loadend() {
		top.postMessage({
			message: "loadend",
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
		
		var username = this.username.value,
			password = this.password.value,
			confirm = this.confirm.value;
		
		if (password == confirm) {
			var request = {
				database: "account",
				command: "put",
				data: {}
			};
			
			request.data[username] = {
				username: username,
				password: password
			};
			
			xhr.request(request);
		}
		else {
			alert("Password does not match the confirm password");
			
			this.password.select();
		}
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
					html: "account.html"
				}, "*");
			}
		}
		else {
			throw "fatal error";
		}
	}
	
}) (window);