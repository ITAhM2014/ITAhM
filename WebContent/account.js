;"use strict";

(function (window, undefined) {
	var form, dialog;
	
	window.addEventListener("load", onLoad, false);
	//window.addEventListener("message", onMessage, false);
	
	function onLoad(e) {
		xhr = new JSONRequest(top.location.search.replace("?", ""), onResponse);
		form = document.getElementById("form");
		dialog = document.getElementById("dialog");
		
		form.addEventListener("submit", onAdd, false);
		
		xhr.request( {
			database: "account",
			command: "get",
			data: null
		});
	}
	
	function onAdd(e) {
		e.preventDefault();

		top.postMessage({
			message: "popup",
			html: "account_dialog.html",
		}, "*");
	}
	
	function onEdit(json, e) {
		e.preventDefault();
		
		top.postMessage({
			message: "popup",
			html: "account_dialog.html",
			data: json
		}, "*");
	}
	
	function onRemove(json, e) {
		if (!confirm("remove this account?")) {
			return;
		}
		
		var request = {
				database: "account",
				command: "delete",
				data: {}
		};
		
		request.data[json.username] = null;
		
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
				top.postMessage({
					message: "unauthorized"
				}, "*");
			}
		}
		else if ("json" in response) {
			var json = response.json;
			
			switch (json.command) {
			case "get":
				init (json.data);
				
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