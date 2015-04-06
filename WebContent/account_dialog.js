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
			form.username.value = json.username;
		}
	}
	
	function onApply(e) {
		e.preventDefault();
		
		var username = this.username.value,
			password = this.password.value,
			confirm = this.confirm.value;
		
		if (password == confirm) {
			xhr.request ({
				database: "account",
				command: "put",
				key: username,
				value: {
					username: username,
					password: password
				}
			});
		}
		else {
			alert("Password does not match the confirm password");
			
			this.password.select();
		}
	}
	
	function onCancel(e) {
		parent.postMessage("close", "*");
	}
	
	function onResponse(response) {
		if ("error" in response) {
			var status = response.error.status;
			
			if (status == 401) {
				parent.location.reload(true);
			}
		}
		else if ("json" in response) {
			var json = response.json;
			if (json != null) {
				parent.location.reload(true);
			}
		}
		else {
			console.log("fatal error");
		}
	}
	
}) (window);