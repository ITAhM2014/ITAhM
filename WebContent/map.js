;"use strict";

function Map () {
	this.init();
}

(function (window, undefined) {
	
	var doc = document,
		map = undefined,
		navigation = undefined,
		iconLibrary = undefined,
		deviceLayer = undefined,
		lineLayer = undefined,
		tmpLayer = undefined,
		link = new Link(),
		showDeviceForm = new Function();
	
	Map.prototype = {
		init: function () {
			navigation = doc.getElementById("map_nav");
			map = new Canvas("map");
			iconLibrary = new Icon("icon");
			deviceLayer = Layer.create("draggable");
			lineLayer = Layer.create();
			tmpLayer = Layer.create();
			
			map.add(deviceLayer);
			map.add(lineLayer);
			map.add(tmpLayer);
			
			tmpLayer.context({
				lineWidth: 5,
				strokeStyle: "#777",
				lineCap: "round"
			});
			
			tmpLayer.context().setLineDash([10, 10]);
			
			doc.getElementById("save_map").addEventListener("click", onSave, false);
			navigation.info.addEventListener("click", onInfo, false);
			navigation.link.addEventListener("click", onLink, false);
			map.on("select", onSelect);
			map.on("mousemove", onMouseMove);
		},
		
		reload: function (deviceList) {
			var device;
			
			navigation.classList.remove("show");
			
			map.empty();
			
			for (var key in deviceList) {
				device = deviceList[key];
				
				deviceLayer.add(Node.create("device", device,  iconLibrary.get(device.type) || iconLibrary.get("unknown")));
			}
			
			map.invalidate();
		},
	};
	
	function Link() {
		var dummy = {
			x: 0,
			y: 0
		},
		line = Node.create("line", {link: [{}]}, null, Node.create("device", dummy));
		
		this.ready = false;
		
		this.move = function (x, y) {
			dummy.x = x;
			dummy.y = y;
		}
		
		this.line = function (to) {
			var from = line.from.node.id,
				line = itahm.findLine(from, to);
			
			return {
				from: from.node.id,
				to: to.node.id,
				link: line && line.node.link
			};
		}
		
		this.node = function () {
			return line;
		},
		
		this.set = function (device) {
			line.from = device;
		}
		
		//this.to = undefined;
		//this.from = undefined;
	}
	
	function onSave(e) {
		var data = {},
			device;
		
		/*deviceLayer.zIndex.map(function (deviceObject) {
			device = deviceObject.node;
			data[device.id] = device;
		});*/
		deviceLayer.each(function (deviceObject) {
			device = deviceObject.node;
			data[device.id] = device;
		});
		
		itahm.request({
			device: {
				set: data
			}
		});
	}
	
	function onSelect(device) {
		if (link.ready) {
			if (device) {
				var node = device.node;
				
				itahm.popup("line", line.from.node.name, node.name, link.line(device.node.id));
				
				map.select();
			}
			
			link.ready = false;
			
			tmpLayer.empty();
		}
		else {
			link.set(device);
			
			if (device) {
				navigation.classList.add("show");
				
				showDeviceForm = itahm.popup.bind(itahm, "device", device.node);
			}
			else {
				navigation.classList.remove("show");
			}
		}
	}
	
	function onMouseMove(pos) {
		link.move(pos.x, pos.y);
		
		tmpLayer.invalidate();
	}
	
	function onInfo() {
		showDeviceForm();
	}
	
	function onLink() {
		navigation.classList.remove("show");
		
		link.ready = true;
		
		tmpLayer.add(link.node());
	}

}) (window);