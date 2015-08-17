;"use strict";

(function (window, undefined) {
	var form, dialog;
	
	window.addEventListener("load", onLoad, false);
	
	window.load = load;
	
	function onLoad(e) {
		xhr = new JSONRequest(top.location.search.replace("?", ""), onResponse);
		form = document.getElementById("form");
		dialog = document.getElementById("dialog");
		
		form.addEventListener("submit", onAdd, false);
	}
	
	function load() {
		xhr.request( {
			database: "profile",
			command: "get",
			data: null
		});
	}
	
	function onAdd(e) {
		e.preventDefault();

		top.showDialog("profile_dialog.html");
	}
	
	function onEdit(profile, e) {
		e.preventDefault();
		
		top.showDialog("profile_dialog.html", profile);
	}
	
	function onRemove(profile, e) {
		if (!confirm("remove this profile?")) {
			return;
		}
		
		var request = {
				database: "profile",
				command: "delete",
				data: {}
			};
		
		request.data[profile.name] = null;
		
		xhr.request(request);
	}

	function createProfile(json) {
		var form = document.createElement("form"),
			h3 = document.createElement("h3"),
			ul = document.createElement("ul"),
			udp = document.createElement("li"),
			version = document.createElement("li"),
			community = document.createElement("li");
		
		form.appendChild(h3);
		form.appendChild(ul);
		ul.appendChild(udp);
		ul.appendChild(version);
		ul.appendChild(community);
		
		h3.textContent = json.name;
		udp.textContent = "udp port : "+ json.udp;
		version.textContent = "version : "+ json.version;
		community.textContent = "community : "+ json.community;
		
		form.addEventListener("submit", onEdit.bind(form, json), false);
		form.addEventListener("reset", onRemove.bind(form, json), false);
		
		return form;
	}
	
	function init(profileData) {
		var list = document.getElementById("list"),
			control = document.getElementById("control"),
			data;
		
		for (var name in profileData) {
			list.appendChild(createProfile(profileData[name]))
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