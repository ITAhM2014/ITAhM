;"use strict";

(function (window, undefined) {

	window.addEventListener("load", onLoad, false);
	
	function onLoad(e) {
		
		map = new Map("sect_map");
		iconLibrary = new Icon("icon");
		
		map.add(deviceLayer);
		map.add(lineLayer);
		
		dAddDevice1.addEventListener("click", onAddDevice, false);
		
		sendRequest("device", null);
	}
	
}) (window);