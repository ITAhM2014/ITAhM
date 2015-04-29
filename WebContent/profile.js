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
			database: "profile",
			command: "get",
			data: null
		});
	}
	
	function onMessage(e) {
		switch (e.data) {
		case "reload":
			location.reload();
			
			break;
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
				database: "profile",
				command: "delete",
				data: {}
			};
		
		request.data[json.name] = null;
		
		xhr.request(request);
	}

	function createProfile(json) {
		var form = document.createElement("form"),
			h3 = document.createElement("h3"),
			ul = document.createElement("ul"),
			version = document.createElement("li"),
			community = document.createElement("li");
		
		form.appendChild(h3);
		form.appendChild(ul);
		ul.appendChild(version);
		ul.appendChild(community);
		
		h3.textContent = json.name;
		version.textContent = "version : "+ json.version;
		community.textContent = "community : "+ json.community;
		
		form.addEventListener("submit", onEdit.bind(form, json), false);
		form.addEventListener("reset", onRemove.bind(form, json), false);
		
		return form;
	}
	
	function init(json) {
		var list = document.getElementById("list"),
			control = document.getElementById("control"),
			data;
		
		for (var name in json) {
			list.appendChild(createProfile(json[name]))
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
				init (json.data);
				
				break;
			case "delete":
				location.reload();
			}
		}
		else {
			console.log("fatal error");
		}
	}
	
}) (window);