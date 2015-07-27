;"use strict";

var elements = {};

(function (window, undefined) {
	var xhr, map = {}, dialog, group;
	
	window.addEventListener("load", onLoad, false);
	
	window.load = load;
	
	function onLoad(e) {
		xhr = new JSONRequest(top.location.search.replace("?", ""), onResponse);
		dialog = document.getElementById("dialog"),
		group = {
			server: document.getElementById("server"),
			network: document.getElementById("network"),
			etc: document.getElementById("etc")
		};
	}
	
	function load() {
		var icons = document.getElementsByTagName("img"),
		icon, li;
		
		for (var i=0, length=icons.length; i<length; i++) {
			icon = icons[i];
			
			map[icon.id] = icon;
			
			li = icon.parentNode;
			li.addEventListener("click", onSelect.bind(li, icon), false);
		}
		
		new IconLoader(onLoadIcon);
	}
	
	function onSelect(img, e) {
		top.showDialog("icon_dialog.html", {
			src: img.src,
			type: img.id
		});
	}
	
	function onLoadIcon(map) {
		var icon, img;
		
		for (var id in library) {
			img = map[id];
			icon = library[id];
			
			img.alt = icon.alt;
			img.id = id;
			
			group[icon.group].appendChild(createElement(id, img));
		}
	}
	
	function createElement(id, img) {
		var li = document.createElement("li");
		
		li.appendChild(img);
		li.appendChild(document.createElement("span")).textContent = id;

		li.addEventListener("click", onSelect.bind(li, img), false);
		
		return li;
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
				init (json.result);
				
				break;
			}
		}
		else {
			throw "fatal error";
		}
	}
	
}) (window);