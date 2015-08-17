;"use strict";

function Chart(id, height, max, onresize) {
	this.init(id, height, max, onresize);
}

(function (window, undefined) {
	var marginTop = 10,
		marginRight = 10,
		marginBottom = 80,
		marginLeft = 50;
	
	function resize() {
		var rect = this.client.getBoundingClientRect(),
			width = this.width || 0;
		
		this.width = Math.floor(Math.max(0, rect.width - marginLeft - marginRight));
		
		this.chart.width = this.width + marginLeft + marginRight;
		this.chart.height = this.height + marginTop + marginBottom;
	
		if (!this.from) {
			this.from = Math.floor(new Date().getTime() /60000) *60000 - (this.width -1) *60000;
		}
		else {
			this.from += (width - this.width) *60000;
		}
		 
		if (this.width > 0 && typeof this.onresize == "function") {
			this.onresize(this.from, this.width);
		}
	}
	
	function onResize() {
		clearTimeout(this.resize);
		
		this.resize = setTimeout(resize.bind(this), 300);
	}
	
	function onDrag(x, scroll, e) {
		var context = this.context,
			width = this.width,
			height = this.height,
			from = this.from,
			to = from + (width -1) *60000;
		
		scroll += (e.clientX - x);
		
		Chart.clear(this.chart);
		
		drawBox(context, width, height);
		drawMaxLabel(context, this.max);
		drawTimeScale(context, width, height, from - scroll *60000, to - scroll *60000);
		
		context.drawImage(this.graph, -Math.min(scroll, 0), 0, width - scroll, height, marginLeft + Math.max(0, scroll), marginTop, width - scroll, height);
		
		this.scroll = scroll;
	}
	
	function onMouseDown(e) {
		this.chart.onmousemove= onDrag.bind(this, e.clientX, this.scroll);
	}
	
	function onMouseUp(e) {
		if (this.chart.onmousemove) {
	
			this.from -= this.scroll * 60000;
			this.onresize(this.from, this.width);
			
			this.scroll = 0;
		}
		
		this.chart.onmousemove = undefined;
	}

	function drawBox(context, width, height) {
		context.save();
		
		context.strokeStyle = "#eee";
		context.lineWidth = .5;
		context.strokeRect(marginLeft -.5, marginTop -.5, width +1, height +1);
		
		context.restore();
	}
	
	function drawMaxLabel(context, max) {
		context.save();
		
		context.fillStyle = "#eee";
		context.textBaseline = "middle";
		context.textAlign = "right";
		context.setTransform(1, 0, 0, 1, marginLeft -10, marginTop);
		context.fillText(max, 0, 0);
		
		context.restore();
	}
	
	function drawTimeScale(context, width, height, from, to) {
		context.save();
		
		context.fillStyle = "#eee";
		
		context.translate(width + marginLeft, height + marginTop);
		context.rotate(Math.PI /2);
		
		for (var x=to, gap=0; x > from; x -= 3600000, gap += 60) {
			context.fillText(getTimeString(x), 10, gap);
		}
		
		context.restore();
	}
	
	function getTimeString(time) {
		var date = new Date(time);
		
		return date.getDate() +", "+ date.getHours() +":"+ date.getMinutes();
	}
	
	Chart.prototype = {
		init: function (id, height, max, onresize) {
			this.client = document.getElementById(id);
			this.graph = document.createElement("canvas");
			this.graphContext = this.graph.getContext("2d");
			this.chart = document.createElement("canvas");
			this.context = this.chart.getContext("2d");
			this.height = Math.floor(height);
			this.max = max;
			this.scale =1;
			this.sheets = {};
			this.scroll = 0;
			this.onresize = onresize;
			this.client.appendChild(this.chart);
			
			this.chart.addEventListener("mousedown", onMouseDown.bind(this), false);
			this.chart.addEventListener("mouseup", onMouseUp.bind(this), false);
			this.chart.addEventListener("mouseout", onMouseUp.bind(this), false);
			
			window.addEventListener("resize", onResize.bind(this), false);
			
			resize.call(this);
		},
		
		draw: function (json) {
			var sheet,
				color = ["#00f", "#0f0", "#f00", "#ff0", "#f0f", "#0ff"],
				colorIndex = 0,
				size = this.width,
				canvas = this.chart,
				context = this.context,
				gCanvas = this.graph,
				gContext = this.graphContext,
				from = this.from,
				to = from + (size -1) *60000,
				scaleY = this.height /100;
			
			gCanvas.width = this.width;
			gCanvas.height = this.height;
			gContext.setTransform(1, 0, 0, -1, 0, this.height);
			
			var x, i, data;
			for (var index in json) {
				data = json[index];
				
				gContext.strokeStyle = color[colorIndex++];
				gContext.beginPath();
				
				x = from;
				for (i=0; i<size; i++) {
					if (typeof data[x] == "number") {
						gContext.lineTo((x - from) /60000, data[x] * scaleY);
					}
					else {
						gContext.stroke();
						
						gContext.beginPath();
					}
					
					x += 60000;
				}
				
				gContext.stroke();
			}
			
			Chart.clear(this.chart);
			context.drawImage(this.graph, marginLeft, marginTop);
			
			drawBox(context, this.width, this.height);
			drawTimeScale(context, this.width, this.height, from, to);
			drawMaxLabel(context, this.max);
		}
		
	};

	Chart.clear = function (canvas) {
		var context = canvas.getContext("2d");
		
		context.save();
		
		context.setTransform(1, 0, 0, 1, 0, 0);
		context.clearRect(0, 0, canvas.width, canvas.height);
		
		context.restore();
	}
	
}) (window);

(function (window, undefined) {
	var xhr, form, ifentry, cpu, graph;
	
	window.addEventListener("load", onLoad, false);
	window.addEventListener("message", onMessage, false);
	
	function onLoad(e) {
		xhr = new JSONRequest(top.location.search.replace("?", ""), onResponse);
		form = document.getElementById("form");
		ifentry = document.getElementById("ifentry"),
		cpu = document.getElementById("cpu");
		
		
		graph = new Chart("graph", 100, 100, onResize);
	}
	
	function onResize(from, size) {
		xhr.request( {
			database: "cpu",
			command: "get",
			data: {
				"127.0.0.1": {
					from: from,
					size: size
				}
			}
		});
	}
	
	function onMessage(e) {
		var data = e.data;
		
		if (!data) {
			return;
		}
		
		switch(data.message) {
		}
	}
	
	function onResponse(response) {
		if ("error" in response) {
			var status = response.error.status;
			
			if (status == 401) {
				top.signOut();
			}
			
			console.log(status);
		}
		else if ("json" in response) {
			var json = response.json;
			
			switch (json.command) {
			case "get":
				graph.draw(json.data["127.0.0.1"]);
				
				break;
			}
		}
		else {
			throw "fatal error";
		}
	}
	
}) (window);