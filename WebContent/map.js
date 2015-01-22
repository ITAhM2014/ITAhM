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
		connector = undefined,
		showDeviceForm = new Function();
	
	Map.prototype = {
		init: function () {
			navigation = doc.getElementById("map_nav");
			map = new Canvas("map");
			iconLibrary = new Icon("icon");
			deviceLayer = Layer.create("draggable");
			lineLayer = Layer.create();
			connector = new Connector();
			
			map.add(lineLayer);
			map.add(deviceLayer);
			
			lineLayer.context({
				strokeStyle: "#282",
				lineWidth: 3,
				font: "10pt arial, \"맑은 고딕\"",
				textAlign: "center",
				textBaseline: "middle",
				fillStyle: "#999"
			});
			
			doc.getElementById("save_map").addEventListener("click", onSave, false);
			navigation.info.addEventListener("click", onInfo, false);
			navigation.link.addEventListener("click", onLink, false);
			map.on("select", onSelect);
			map.on("mousemove", onMouseMove);
		},
		
		set: function (name, list) {
			switch (name) {
			case "device":
				var device;
				
				deviceLayer.empty();
				
				for (var id in list) {
					device = list[id];
					
					deviceLayer.add(Node.create("device", device,  iconLibrary.get(device.type) || iconLibrary.get("unknown")));
				}
				
				deviceLayer.invalidate();
				
				break;
			case "line":
				var line;
				
				lineLayer.empty();
				
				for (var id in list) {
					line = list[id];
					
					lineLayer.add(Node.create("line", line, itahm.getDevice(line.from), itahm.getDevice(line.to)));
				}
				
				lineLayer.invalidate();
				
				break;
			}
		},
		
		reloadDevice: function (deviceList) {
			var device;
			
			navigation.classList.remove("show");
			
			map.empty();
			
			for (var key in deviceList) {
				device = deviceList[key];
				
				deviceLayer.add(Node.create("device", device,  iconLibrary.get(device.type) || iconLibrary.get("unknown")));
			}
			
			map.invalidate();
		},
		
		reloadLine: function (lineList) {
			var line;
			
			navigation.classList.remove("show");
			
			map.empty();
			
			for (var id in lineList) {
				line = lineList[id];
				lineLayer.add(Node.create("line", line, itahm.getDevice(line.from), itahm.getDevice(line.to)));
			}
			
			map.invalidate();
		},
		
		invalidate: function () {
			map.invalidate();
		}
	};
	
	function Connector() {
		var layer = Layer.create(),
			ready = false;
		
		map.add(layer);
		
		layer.context({
			lineWidth: 5,
			strokeStyle: "#777",
			lineCap: "round"
		});
		
		layer.context().setLineDash([10, 10]);
		
		this.to = {
			x: 0,
			y: 0
		};
		
		this.node = Node.create("line", {link: [{}]}, null, this.to);
		
		this.draw = function (x, y) {
			if (ready) {
				this.to.x = x;
				this.to.y = y;
				
				layer.invalidate();
			}
		};
		
		this.ready = function (b) {
			if (b === true) {
				ready = true;
				
				layer.add(this.node);
			}
			else if (b === false) {
				ready = false;
				
				this.node.to = this.to;
				
				layer.empty();
			}
			else {
				return ready;
			}
		};
		
		this.name = function (line) {
			var from = this.node.from,
				to = this.node.to;
			
			if (line.from == from.id) {
				return {
					from: from.name,
					to: to.name
				}
			}
			else {
				return {
					from: to.name,
					to: from.name
				}
			}
		};
		
		this.set = function (node) {
			return this.node.from = node;
		}
		
		this.get = function (node) {
			var from = this.node.from.id,
				to = node.id;
			
			this.node.to = node;
			
			return itahm.getLine(from, to) || {
				from: from,
				to: to,
				link: []
			}
		};
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
		if (connector.ready()) {
			if (device) {
				var line = connector.get(device.node),
					name = connector.name(line);
				
				itahm.popup("line", name.from, name.to, line);
				
				map.select();
			}
			
			connector.ready(false);
		}
		else {
			if (device) {
				navigation.classList.add("show");
				
				showDeviceForm = itahm.popup.bind(itahm, "device", connector.set(device.node));
			}
			else {
				navigation.classList.remove("show");
			}
		}
	}
	
	function onMouseMove(pos) {
		connector.draw(pos.x, pos.y);
	}
	
	function onInfo() {
		showDeviceForm();
	}
	
	function onLink() {
		navigation.classList.remove("show");
		
		connector.ready(true);
	}

}) (window);