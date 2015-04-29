;"use strict";

(function (window, undefined) {
	var xhr = new JSONRequest("local.itahm.com:2014", onResponse),
		map = {},
//		form = document.getElementById("form"),
		dialog = document.getElementById("dialog"),
		group = {
			server: document.getElementById("server"),
			network: document.getElementById("network"),
			etc: document.getElementById("etc")
		};
	
//	form.addEventListener("submit", onAdd, false);
	window.addEventListener("load", onLoad, false);
	window.addEventListener("message", onMessage, false);

	function onLoad(e) {
		var icons = document.getElementsByTagName("img"),
			icon, li;
		
		for (var i=0, length=icons.length; i<length; i++) {
			icon = icons[i];
			
			map[icon.id] = icon;
			
			li = icon.parentNode;
			li.addEventListener("click", onSelect.bind(li, icon), false);
		}
		
		new IconLoader(onLoadIcon);
		/*
		xhr.request( {
			database: "icon",
			command: "get"
		});*/
	}
	
	function onSelect(img, e) {
		var msg = {
			src: img.src,
			type: img.id
		};
		
		dialog.contentWindow.postMessage(msg, "*");
		
		dialog.classList.add("show");
	}
	
	
	function onMessage(e) {
		switch (e.data) {
		case "close":
			dialog.classList.remove("show");
			
			break;
		}
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
	/*
	
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

	function init(json) {
		var icon, id;

		for (id in json) {
			icon = json[id];
			
			map[id] = new Image();
			map[id].src = icon.src;
		}
	}
*/	
	function onResponse(response) {
		if ("error" in response) {
			var status = response.error.status;
			
			if (status == 401) {
				location.href = "signin.html";
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
			console.log("fatal error");
		}
	}
	
}) (window);