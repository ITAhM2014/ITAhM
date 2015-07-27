;"use strict";

(function (window, undefined) {
	var form, dialog;
	
	window.addEventListener("load", onLoad, false);
	
	window.load = load;
	
	function onLoad(e) {
		form = document.getElementById("form");
		dialog = document.getElementById("dialog");
		
		form.addEventListener("submit", onAdd, false);
		
		xhr = new JSONRequest(top.server, onResponse);
	}
	
	function load() {
		xhr.request( {
			database: "account",
			command: "get",
			data: null
		});
	}
	
	function onAdd(e) {
		e.preventDefault();

		top.openContent("account_dialog.html");
		top.closeDialog();
	}
	
	function onEdit(json, e) {
		e.preventDefault();
		
		top.showDialog("account_dialog.html", json);
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
				top.signOut();
			}
		}
		else if ("json" in response) {
			var json = response.json;
			
			switch (json.command) {
			case "get":
				init (json.data);
				
				break;
			case "delete":
				top.openContent("account.html");
			}
		}
		else {
			console.log("fatal error");
		}
	}
	
}) (window);