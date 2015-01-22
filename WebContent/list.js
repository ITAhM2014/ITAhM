;"use strict";

function DeviceList() {
	this.init();
}

function LineList() {
	this.init();
}

(function (window, undefined) {
	var doc = document,
		form = undefined,
		table = undefined,
		fragment = doc.createDocumentFragment();
	
	DeviceList.prototype = {
		
		init: function () {
			this.list = {};
			
			table = doc.getElementById("device_list");
			form = doc.getElementById("form_device_list");
			
			form.add.addEventListener("click", onAdd.bind(this), false);
			form.remove.addEventListener("click", this.remove.bind(this), false);
		},
		
		reload: function (list) {
			var row,
				index = 0;
			
			this.list = list;
			
			while (row = table.firstChild) {
				table.removeChild(row);
			}
			
			for (var id in list) {
				fragment.appendChild(add(list[id]));
			}
			
			table.appendChild(fragment);
		},
		
		add: function (device) {
			table.appendChild(add(device));
		},
		
		remove: function () {
			var checkbox = table.querySelectorAll("input[type=checkbox]:checked"),
				index = checkbox.length,
				device = {};
			
			while (index-- > 0) {
				device[checkbox[index].dataset["id"]] = null;
			}
			
			itahm.send({
				device: {
					remove: device
				}
			});
			
			itahm.send({
				device: {
					get: null
				}
			});
		},
		
		get: function (id) {
			return this.list[id];
		}
		
	};

	function add(device) {
		var row = document.createElement("tr"),
			checkbox = document.createElement("input"),
			cells,
			length = 6;
		
		while (length-- > 0) {
			row.insertCell(-1);
		}
		
		checkbox.type = "checkbox";
		checkbox.dataset["id"] = device.id;
		
		cells = row.cells;
		
		cells[0].appendChild(checkbox);
		cells[1].textContent = device.address;
		cells[2].textContent = device.type;
		cells[3].textContent = device.name;
		cells[4].textContent =  device.snmp;
		cells[5].textContent =  device.profile;
		
		row.addEventListener("click", onSelect.bind(this, device), false);
		
		return row;
	}
	
	function onAdd(e) {
		itahm.popup("device");
	}
	
	function onSelect(device, e) {
		if (e.target.nodeName == "INPUT") {
			return;
		}

		itahm.popup("device", device);
	}
	
}) (window);

(function (window, undefined) {
	var doc = document,
		form = undefined,
		table = undefined,
		fragment = doc.createDocumentFragment();
	
	LineList.prototype = {
		
		init: function () {
			this.list = {};
			
			table = doc.getElementById("line_list");
			form = doc.getElementById("form_line_list");
			
			//form.add.addEventListener("click", onAdd.bind(this), false);
			//form.remove.addEventListener("click", this.remove.bind(this), false);
		},
		
		reload: function (list) {
			var row,
				line,
				tmp;
			
			while (row = table.firstChild) {
				table.removeChild(row);
			}
			
			this.list = {};
			
			for (var id in list) {
				line = list[id];
				
				tmp = this.list[line.from];
				
				if (!tmp) {
					tmp = {};	
					this.list[line.from] = tmp;
				}
				
				tmp[line.to] = line;
				
				tmp = this.list[line.to];
				
				if (!tmp) {
					tmp = {};
					this.list[line.to] = tmp;
				}
				
				tmp[line.from] = line;
				
				//fragment.appendChild(add(line));
			}
			
			table.appendChild(fragment);
		},
		
		add: function (device) {
			
		},
		
		remove: function () {
			
		},
		
		get: function (from, to) {
			var from = this.list[from];
			
			return from && from[to];
		}
	};
	
}) (window);