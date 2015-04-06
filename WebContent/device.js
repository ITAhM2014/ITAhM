;"use strict";

(function (window, undefined) {
	var form = document.getElementById("form");
	var xhr = new JSONRequest("local.itahm.com:2014", onResponse);
	
	form.addEventListener("submit", onTest, false);
	form.addEventListener("reset", onReset, false);
	
	function onSignOut(e) {
		xhr.request({command: "signout"});
	}
	
	function onTest(e) {
		e.preventDefault();
		
		console.log("submit");
	}
	
	function onReset(e) {
		console.log("onReset");
	}
	
	function onResponse(response) {
		if ("error" in response) {
			var status = response.error.status;
			
			if (status == 401) {
				parent.location.href = "signin.html";
			}
			
			console.log(status);
		}
		else if ("json" in response) {
			var json = response.json;
			if (json != null) {
				switch(json.command) {
				case "signout":
					parent.location.href = "signin.html";
					
					break;
				}
			}
		}
	}
}) (window);