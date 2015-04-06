;"use strict";

(function (window, undefined) {
	var xhr = new JSONRequest("local.itahm.com:2014", onResponse),
		form = document.getElementById("form"),
		dialog = document.getElementById("dialog");
	
	form.addEventListener("submit", onAdd, false);
	window.addEventListener("load", onLoad, false);
	window.addEventListener("message", onMessage, false);
	
	function onAdd(e) {
		e.preventDefault();
		
		dialog.classList.add("show");
	}
	
	function onLoad(e) {
		xhr.request( {
			database: "account",
			command: "get"
		});
	}
	
	function onMessage(e) {
		switch (e.data) {
		case "close":
			dialog.classList.remove("show");
			
			break;
		}
	}
	
	function onEdit(json, e) {
		e.preventDefault();
		
		dialog.contentWindow.postMessage(json, "*");
		
		dialog.classList.add("show");
	}
	
	function onRemove(json, e) {
		var request = {
				database: "account",
				command: "delete",
				key: json.username
		};
		
		xhr.request(request);
	}

	function createAccount(json) {
		var form = document.createElement("form"),
			h3 = document.createElement("h3");
		
		form.appendChild(h3);
		
		h3.textContent = json.username;
		
		form.addEventListener("submit", onEdit.bind(form, json), false);
		form.addEventListener("reset", onRemove.bind(form, json), false);
		
		return form;
	}
	
	function init(json) {
		var list = document.getElementById("list"),
			control = document.getElementById("control"),
			data;
		
		for (var username in json) {
			list.appendChild(createAccount(json[username]))
			.addEventListener("mouseenter", function (e) {
				this.appendChild(control);
			}, false);
		}
	}
	
	function onResponse(response) {
		if ("error" in response) {
			var status = response.error.status;
			
			if (status == 401) {
				location.href = "signin.html";
			}
			
			console.log(status);
		}
		else if ("json" in response) {
			var json = response.json;
			
			switch (json.command) {
			case "get":
				init (json.result);
				
				break;
			case "delete":
				window.location.reload();
			}
		}
		else {
			console.log("fatal error");
		}
	}
	
}) (window);