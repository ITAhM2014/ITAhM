;"use strict";

(function (window, undefined) {
	var server, xhr, body, dialog, form;
	
	window.addEventListener("load", onLoad, false);
	window.addEventListener("message", onMessage, false);
	
	function onMessage(e) {
		var data = e.data;
		
		if (!data) {
			return;
		}
		
		switch(data.message) {
		case "unauthorized":
			xhr.request({
				command: "echo"
			});
			
			break;
		case "signin":
			popup();
			
			load();
			
			break;
		case "popup":
			popup(data.html, data.data);
			
			break;
		case "reload":
			reload(data.html);
			
			break;
		}
	}

	function onLoad(e) {
		server = location.search.replace("?", "");
		body = document.getElementById("body");
		dialog = document.getElementById("dialog");
		content = document.getElementById("content");
		form = document.getElementById("form");
		
		if (server == "") {
			location.href = "ITAhM.html?"+ prompt("server address[:tcp port]");
			
			return;
		}
		
		xhr = new JSONRequest(server, onResponse);
		
		xhr.request({
			command: "echo"
		});
	}
	
	function load() {
		form.signout.addEventListener("click", onSignOut, false);
		
		content.src = "home.html";
		
		//body.classList.remove("dialog");
		body.classList.remove("loading");
	}
	
	function onSignOut(e) {
		xhr.request({command: "signout"});
	}
	
	function signOut() {
		popup("signin.html");
		
		content.src = "about:blank";
	}
	
	function onResponse(response) {
		if ("error" in response) {
			var status = response.error.status;
			
			if (status == 401) {
				signOut();
			}
		}
		else if ("json" in response) {
			var json = response.json;
			if (json != null) {
				switch(json.command) {
				case "echo":
					load();
					
					break;
				case "signout":
					signOut();
					
					break;
				}
			}
		}
	}
	
	function popup(html, data) {
		if (html) {
			body.classList.add("loading");
			
			dialog.onload = onPopUp.bind(dialog, data);
			dialog.src = html;
		}
		else {
			body.classList.remove("dialog");
		}
	}
	
	function reload(html) {
		content.src = html || "about:blank";
		
		body.classList.remove("dialog");
	}

	function onPopUp(data, e) {
		dialog.contentWindow.postMessage({
			message: "data",
			data: data
		}, "*");
		
		body.classList.add("dialog");
		body.classList.remove("loading");
	}
	
})(window);



