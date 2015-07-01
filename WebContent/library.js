;"use strict";

var library = {
		server: {
			group: "server",
			alt: "server",
			src: "img/server.png"
		},
		mainframe: {
			group: "server",
			alt: "mainframe",
			src: "img/mainframe.png"
		},
		database: {
			group: "server",
			alt: "database",
			src: "img/database.png"
		},
		storage: {
			group: "server",
			alt: "storage",
			src: "img/storage.png"
		},
		www: {
			group: "server",
			alt: "web server",
			src: "img/www.png"
		},
		network: {
			group: "network",
			alt: "network",
			src: "img/network.png"
		},
		workgroup: {
			group: "network",
			alt: "workgroup switch",
			src: "img/workgroup.png"
		},
		dummy: {
			group: "network",
			alt: "dummy hub",
			src: "img/hub.png"
		},
		l4switch: {
			group: "network",
			alt: "layer4 switch",
			src: "img/l4switch.png"
		},
		l3switch: {
			group: "network",
			alt: "layer4 switch",
			src: "img/l4switch.png"
		},
		router: {
			group: "network",
			alt: "router",
			src: "img/router.png"
		},
		firewall: {
			group: "network",
			alt: "firewall",
			src: "img/firewall.png"
		},
		vpn: {
			group: "network",
			alt: "vpn gateway",
			src: "img/gateway.png"
		},
		concentrator: {
			group: "network",
			alt: "vpn concentrator",
			src: "img/concentrator.png"
		},
		wireless: {
			group: "network",
			alt: "wireless device",
			src: "img/wireless.png"
		},
		accesspoint: {
			group: "network",
			alt: "accesspoint",
			src: "img/accesspoint.png"
		},
		office: {
			group: "etc",
			alt: "office",
			src: "img/office.png"
		},
		cloud: {
			group: "etc",
			alt: "cloud",
			src: "img/cloud.png"
		},
		unknown: {
			group: "etc",
			alt: "unknown",
			src: "img/unknown.png"
		},
	};

function IconLoader(func) {
	this.init(func);
}

(function (window, undefined) {
	
	function loadIcon() {
		var id = this.queue.pop();
		
		if (id) {
			var icon = new Image();
			
			icon.onload = loadIcon.bind(this);
			
			icon.src = library[id].src;
			
			this.map[id] = icon;
		}
		else {
			this.complete(this.map);
		}
	}
	
	IconLoader.prototype = {
			init: function (func) {
				this.map = {};
				this.queue = [];
				this.complete = func;
				
				for (var id in library) {
					this.queue.push(id);
				}
				
				loadIcon.call(this);
			}
		};
	
}) (window);