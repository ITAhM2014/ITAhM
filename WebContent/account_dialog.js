;"use strict";

(function (window, undefined) {
	var xhr, form;
	
	window.addEventListener("load", onLoad, false);
	window.addEventListener("keydown", function (e) {
		if (e.keyCode == 27) {
			form.reset();
		}
	}, false);
	window.focus();
	
	window.load = load;
	
	function onLoad(e) {
		form = document.getElementById("form");
		
		form.addEventListener("submit", onApply, false);
		form.addEventListener("reset", onCancel, false);
		
		xhr = new JSONRequest(top.server, onResponse);
	}
	
	function load(data) {
		if (data) {
			form.username.value = data.username;
			form.password.select();
		}
		else {
			form.username.select();
		}
		
		top.clearScreen();
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
			
			switch (json.command) {
			case "put":
				top.open("account.html");
				top.closeDialog();
			}
		}
		else {
			throw "fatal error";
		}
	}
	
}) (window);