;"use strict";

function Setting() {
	this.init();
}

(function (window, undefined) {

	var doc = document,
		accountList = undefined;
	
	Setting.prototype = {
		init: function () {
			
			accountList = doc.getElementById("account");
			profileList = doc.getElementById("profile");
			
			//form.addEventListener("submit", onSetCommunity, false);
			doc.getElementById("add_account").addEventListener("click", onAddAccount, false);
			doc.getElementById("add_profile").addEventListener("click", onAddProfile, false);
			
			itahm.request({
				profile: {
					get: null
				}
			});
			
			itahm.request({
				account: {
					get: null
				}
			});
		},
		
		profile: function (profiles) {
			var profile;
			
			while(profile = profileList.firstChild) {
				profileList.removeChild(profile);
			}
			
			for (var name in profiles) {
				profile = profileList.appendChild(doc.createElement("li"));
				profile.textContent = name;
				
				profile.addEventListener("click", itahm.popup.bind(itahm, "snmp", profiles[name]), false);
			}
		},
		
		set: function (config) {
			if (!config) {
				return;
			}
			
			for (var key in config) {
				if (key == "community") {
//					form.community.value = config["community"];
				}
				else if (key == "account") {
					var accounts = config["account"],
						account;
					
					while(account = accountList.firstChild) {
						accountList.removeChild(account);
					}
					
					for (var username in accounts) {
						account = accountList.appendChild(doc.createElement("li"));
						account.textContent = username;
						
						account.addEventListener("click", itahm.popup.bind(itahm, "account", accounts[username]), false);
					}
				}
			}
		}
	};
	/*
	function onSetCommunity(e) {
		e.preventDefault();
		
		var form = e.target;
		
		itahm.request({
			config: {
				set: {
					community: form.community.value
				}
			}
		});
	}
	*/
	function onAddAccount() {
		itahm.popup("account");
	}
	
	function onAddProfile() {
		itahm.popup("snmp");
	}
	
}) (window);