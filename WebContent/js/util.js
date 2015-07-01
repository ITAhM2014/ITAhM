function Line() {
	this.init(arguments);
}

(function (window, undefined) {
	Line.create = function (from, to) {
		if (typeof from !== "string" || typeof to !== "string") {
			throw "InvalidArgumentException";
		}
		
		return {
			id: "-1",
			from: from,
			to: to,
			link: []
		};
	};
	
	Line.set = function (line, index, from, to, bandwidth, name) {
		var linkArray = link(line);
			linkObj = {
				from: from || "",
				to: to || "",
				bandwidth: bandwidth || 0,
				name:  name || ""
			};
		
		linkArray[index > -1? index: linkArray.length] = linkObj;
		
		return linkObj;
	};
	
	Line.remove = function (line, index) {
		var linkArray = link(line);
		
		linkArray.splice(index, 1);
		
		return linkArray;
	};
	
	Line.count = function (line) {
		var linkArray = link(line);
		
		return linkArray.length;
	}
	
	function link(line) {
		var linkArray = line.link;
		
		if (!Array.isArray(linkArray)) {
			throw "Line object has not link array";
		}
		
		return linkArray;
	}
	
})( window );
