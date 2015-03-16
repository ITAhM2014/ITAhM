;"use strict";

function PopUp() {
	this.init(arguments);
}

function LoginDialog() {
	this.init(arguments);
}

function DeviceDialog() {
	this.init(arguments);
}

function LineDialog() {
	this.init(arguments);
}

function AccountDialog() {
	this.init(arguments);
}

function SnmpDialog() {
	this.init(arguments);
}

/*
 * PopUp
 */
(function (window, undefined) {
	var doc = document,
		popup = undefined,
		button = undefined;
	
	PopUp.prototype = {
		init: function () {
			this.dialog = {};
			
			popup = doc.getElementById("popup");
			button = doc.getElementById("popup_button");
		},
		
		add: function (dialogName, dialog) {
			this.dialog[dialogName] = dialog;
			
			return this;
		},
		
		show: function (dialogName) {
			var dialog = this.dialog[dialogName];
			
			if (dialog) {
				
				popup.appendChild(dialog.dialog).appendChild(button);
				dialog.set(arguments[1], arguments[2], arguments[3]);
				
				popup.classList.add("show");
			}
		},
		
		hide: function () {
			popup.classList.remove("show");
		}
	}
	
}) (window);


/*
 * LoginDialog
 */
(function (window, undefined) {

	var doc = document,
		form = undefined;
	
	LoginDialog.prototype = {
	
		init: function () {
			form = doc.getElementById("form_login");
			
			form.addEventListener("submit",onLogin, false);
			form.addEventListener("reset",onCancel, false);
			
			this.dialog = form;
		},
		
		set: function (account) {
			
		}
		
	};
	
	function onLogin(e) {
		e.preventDefault();
		
		itahm.login(form.server.value, form.username.value, form.password.value);
	}
	
	function onCancel(e) {
		itahm.popup();
	}
	
})(window);

/*
 * DeviceDialog
 */
(function (window, undefined) {
	var doc = document,
		form = undefined;
	
	DeviceDialog.prototype = {
		init: function () {
			form = doc.getElementById("form_device");
			
			form.addEventListener("submit", onApply.bind(this), false);
			form.addEventListener("reset", onCancel, false);
			
			form.snmp.addEventListener("click", onEnableSnmp, false);
			
			this.dialog = form;
		},
		
		set: function (device) {
			if (device) {
				form.address.value = device.address;
				form.type.value = device.type;
				form.name.value = device.name;
				form.profile.value = device.profile;
				
				form.snmp.checked = device.snmp;
				
				form.apply.value = "apply";
				
				this.apply = edit.bind(this, device);
			}
			else {
				onEnableSnmp();
				
				form.apply.value = "create";
				
				this.apply = add.bind(this);
			}
			
			onEnableSnmp();
		},
		
		profile: function (profiles) {
			var selectBox = form.profile,
				option;
			
			selectBox.options.length = 0;
			
			for (var name in profiles) {
				option = doc.createElement("option");
				option.text = name;
				
				//option.addEventListener("click", onSelectProfile.bind(this, profiles[name]), false);
				
				selectBox.add(option);
			}
		}
	};

	function onApply(e) {
		e.preventDefault();
		
		if (this.apply()) {
			form.reset();
		}
	}

	function onCancel(e) {
		itahm.popup();
	}

	function add() {
		var device = {
				x: 0,
				y: 0
			};
		
		if (update(device)) {
			itahm.request({
				"device": {
					create: [device]
				}
			});
			
			itahm.request({
				"device": {
					get: null
				}
			});
			
			return true;
		}
		
		return false;
	}

	function edit(device) {
		var data = {};
		
		data[device.id] = device;
		
		if (update(device)) {
			itahm.request({
				"device": {
					set: data
				}
			});
			
			itahm.request({
				"device": {
					get: null
				}
			});

			return true;
		}
		
		return false;
	}

	function update(device) {
		var checked = form.snmp.checked,
		address = form.address.value;
		
		if (checked && !address) {
			alert("ip address is required for snmp");
			
			form.address.focus();
			
			 return false;
		}
		
		device.address= address;
		device.type= form.type.value;
		device.name= form.name.value;
		device.snmp= checked;
		device.profile= form.profile.value;
		
		return true;
	}
	
	function close() {
		form.reset();
		
		itahm.popup();
	}

	function onEnableSnmp(e) {
		form.profile.disabled = !form.snmp.checked;
	}
	
}) (window);

/*
 * LineDialog
 */
(function (window, undefined) {
	var doc = document,
		form = undefined,
		linkCount = undefined;

	LineDialog.prototype = {
		init: function () {
			form = doc.getElementById("form_line");
			linkCount = doc.getElementById("link_count");
			
			form.addEventListener("submit",onApply.bind(this), false);
			form.addEventListener("reset",onCancel, false);

			form.index.addEventListener("change", onSelect.bind(this), false);
			form.remove.addEventListener("click", onRemove.bind(this), false);
			this.dialog = form;
		},
		
		set: function (from, to, line) {
			var link = line.link,
				index = form.index,
				option,
				count = link.length;
			
			form.from.value = from;
			form.to.value = to;
		
			this.apply = edit.bind(this, line);
			
			index.length = 0;
			
			if (count > 0) {
				for (var i=0; i<count; i++) {
					option = document.createElement("option");
					option.text = i +1;
					option.value = i;
					
					index.add(option);
				}
				
				this.remove = remove.bind(this, line);
			}
			
			linkCount.textContent = count;
			
			this.select = select.bind(this, link);
			
			option = document.createElement("option");
			option.text = "new";
			option.value = -1;
			
			index.add(option);
			
			select(link);
		}
	};
	
	function onApply(e) {
		e.preventDefault();
	
		this.apply();
		
		form.reset();
	}
	
	function onCancel(e) {
		itahm.popup();
	}
	
	function onSelect(e) {
		this.select();
	}
	
	function onRemove(e) {
		e.preventDefault();
		
		if (form.index.value != -1&& confirm("remove this link from selected line?")) {
			this.remove();
			
			form.reset();
		}
	}
	
	function edit(line) {
		var index = form.index.value,
			link = line.link,
			tmp = {
				from: form.ifFrom.value,
				to: form.ifTo.value,
				bandwidth: form.bandwidth.value * form.unit.value
			};
		
		if (link.length == 0) {
			line.link = [tmp];
			
			itahm.request({
				line: {
					create: [line]
				}
			});
		}
		else {
			link[index < 0? link.length: index] = tmp;
			
			var data = {};
			
			data[line.id] = line;
			
			itahm.request({
				line: {
					set: data
				}
			});
		}
		
		itahm.request({
			line: {
				get: null
			}
		});
	}
	
	function select(linkArray) {
		link = linkArray && linkArray[form.index.value];
		
		if (link) {
			var bandwidth = link.bandwidth || 0,
				unit = 1;
			
			while (bandwidth > 999) {
				bandwidth /= 1000;
				unit *= 1000;
			}
			
			form.unit.value = unit;
			form.bandwidth.value = bandwidth;
			form.ifFrom.value = link.from;
			form.ifTo.value = link.to;
		}
		else {
			//form.unit.value = 1000;
			//form.bandwidth.value = "";
			//form.ifFrom.value = "";
			//form.ifTo.value = "";
		}
	}
	
	function remove(line) {
		var data = {},
			link = line.link;
		
		link.splice(form.index.value, 1);
		
		if (link.length > 0) {
			data[line.id] = line;
			
			itahm.request({
				line: {
					set: data
				}
			});
		}
		else {
			data[line.id] = null;
			
			itahm.request({
				line: {
					remove: data
				}
			});
		}
		
		itahm.request({
			line: {
				get: null
			}
		});
	}
	
}) (window);

/*
 * AccountDialog
 */
(function (window, undefined) {
	var doc = document,
		form = undefined;
	
	AccountDialog.prototype = {
		init: function () {
			form = doc.getElementById("form_account");
			
			form.addEventListener("submit", onApply.bind(this), false);
			form.addEventListener("reset", onCancel.bind(this), false);
			
			form.remove.addEventListener("click", onRemove.bind(this), false);
			
			this.dialog = form;
		},
		
		set: function (account) {
			if (account) {
				form.username.readOnly = true;
				form.username.value = account.username;
				form.apply.value = "apply";
				
				this.apply = edit.bind(this, account);
				this.remove = remove.bind(this, account.username);
				
				form.password.select();
			}
			else {
				form.username.readOnly = false;
				form.apply.value = "create";
				form.remove.disabled = true;
				
				this.apply = add.bind(this);
				
				itahm.popup(form);
				
				form.username.focus();
			}
		}
	};

	function onApply(e) {
		e.preventDefault();
		
		if (form.password.value == form.confirm.value) {
			this.apply();
		}
		else {
			alert("Password doesn't match the confirmation");
			
			form.password.select();
		}
		
		form.reset();
	}

	function onCancel(e) {
		itahm.popup();
	}

	function onRemove(e) {
		e.preventDefault();
		
		if (confirm("remove this account?")) {
			this.remove();
			
			form.reset();
		}
	}
	
	function add() {
		var account = {},
			username = form.username.value;
		
		account[username] = {
			username: username,
			password: form.password.value
		};
		
		itahm.request({
			account: {
				add: account
			}
		});
		
		itahm.request({
			account: {
				get: null
			}
		});
	}

	function edit(device) {
		var account = {},
			username = form.username.value;
		
		account[username] = {
			username: username,
			password: form.password.value
		};
		
		itahm.request({
			account: {
				set: account
			}
		});
		
		itahm.request({
			account: {
				get: null
			}
		});
	}

	function remove(username) {
		var account = {};
		
		account[username] = null;
		
		itahm.request({
			account: {
				remove: account
			}
		});
		
		itahm.request({
			account: {
				get: null
			}
		});
	}
	
}) (window);

/*
 * SnmpDialog
 */
(function (window, undefined) {
	var doc = document,
		form = undefined;
	
	SnmpDialog.prototype = {
		init: function () {
			form = doc.getElementById("form_snmp");
			
			form.addEventListener("submit", onApply.bind(this), false);
			form.addEventListener("reset", onCancel, false);
			
			form.remove.addEventListener("click", onRemove, false);
			
			this.dialog = form;
		},
		
		set: function (profile) {
			form.reset();
			
			itahm.popup(form);
			
			if (profile) {
				// edit
				this.apply = edit.bind(this, profile);
				this.remove = remove.bind(this, profile);
				
				form.remove.disabled = false;
				
				form.apply.value = "apply";
				
				form.name.value = profile.name;
				form.version.value = profile.version;
				form.community.value = profile.community;

				form.community.select();
			}
			else {
				// add
				this.apply = add.bind(this);
				
				form.remove.disabled = true;
				
				form.apply.value = "create";
				
				form.name.focus();
			}
		}
	};

	function onApply(e) {
		e.preventDefault();
		
		this.apply();
		
		form.reset();
	}

	function onCancel(e) {
		itahm.popup();
	}

	function onRemove(e) {
		e.preventDefault();
		
		if (confirm("remove this profile?")) {
			remove();
			
			form.reset();
		}
	}
	
	function add() {
		var profile = {},
			name = form.name.value;
		
		profile[name] = {
			name: name,
			version: form.version.value,
			community: form.community.value
		};
		
		itahm.request({
			profile: {
				add: profile
			}
		});
		
		itahm.request({
			profile: {
				get: null
			}
		});
	}

	function edit() {
		var profile = {},
			name = form.name.value;
		
		profile[name] = {
			name: name,
			version: form.version.value,
			community: form.community.value
		};
		
		itahm.request({
			profile: {
				set: profile
			}
		});
		
		itahm.request({
			profile: {
				get: null
			}
		});
	}

	function remove() {
		var profile = {},
			name = form.name.value;
		
		profile[name] = null;
		
		itahm.request({
			profile: {
				remove: profile
			}
		});
		
		itahm.request({
			profile: {
				get: null
			}
		});
	}
	
}) (window);