;"use strict";

var MINUTE = 60000,
	MINUTE5 = 300000,
	HOUR6 = 21600000,
	MARGIN_TOP = 20,
	MARGIN_RIGHT = 15,
	MARGIN_BOTTOM = 90,
	MARGIN_LEFT = 15,
	SCALE_SPACE = 60;

function Chart(config) {
	if (typeof config !== "object" || !config.id) {
		throw "InvalidArgumentException";
	}
	
	this.init(config);
}

(function (window, undefined) {	
	
	function resize() {
		var rect = this.client.getBoundingClientRect(),
			width = this.width,
			height = this.height,
			timeUnit = getTimeUnit(this.scale);
		
		this.width = Math.max(0, rect.width - MARGIN_LEFT - MARGIN_RIGHT);
		this.height = Math.max(0, rect.height - MARGIN_TOP - MARGIN_BOTTOM);
		
		if (this.width == width && this.height == height || this.width == 0) {
			return;
		}
		
		if (!this.base) {
			this.base = Chart.trim(new Date().getTime(), this.scale);
		}
		
		this.origin = this.base - (this.width -1)* timeUnit;
		
		this.chart.width = this.width + MARGIN_LEFT + MARGIN_RIGHT;
		this.chart.height = this.height + MARGIN_TOP + MARGIN_BOTTOM;
	
		this.graph.width = this.width;
		this.graph.height = this.height;
		
		this.onchange(this.origin, this.base);
		
		invalidate.call(this);
	}
	
	/**
	 * invalidate 발생하는 경우
	 * 1. resize
	 * 2. dragend
	 * 3. zoom
	 */
	function invalidate() {
		Chart.clear(this.chart);
		Chart.clear(this.graph);
		
		drawBackground(this.context, this.width, this.height);
		
		this.background = this.context.getImageData(0, 0, this.chart.width, this.chart.height);
		
		drawTimeScale(this.context, this.width, this.height, this.base - (this.width -1) *MINUTE, this.base, this.scale);
	
		this.graphContext.setTransform(1, 0, 0, -1, 0, this.height);
		
		this.onreset(this.base, this.width, this.scale);
	}
	
	function getTimeUnit(scale) {
		return scale === 2? MINUTE5: scale === 3? HOUR6: MINUTE;
	}
	
	function onResize() {
		clearTimeout(this.resize);
		
		this.resize = setTimeout(resize.bind(this), 300);
	}
	
	function onDrag(x, scroll, e) {
		var move;
		
		scroll += (e.clientX - x);
		
		Chart.clear(this.chart);
		
		this.context.putImageData(this.background, 0, 0);

		this.context.drawImage(this.graph,
				Math.max(-scroll, 0),
				0,
				this.width - Math.abs(scroll),
				this.height,
				MARGIN_LEFT + Math.max(0, scroll),
				MARGIN_TOP,
				this.width - Math.abs(scroll),
				this.height);
	
		move = scroll * getTimeUnit(this.scale);
		
		this.onchange(this.origin - move, this.base - move);
		
		this.scroll = scroll;
	}
	
	function onMouseDown(e) {
		this.chart.onmousemove= onDrag.bind(this, e.clientX, this.scroll);
	}
	
	function onMouseUp(e) {
		var onDrag = !!this.chart.onmousemove,
			scroll = this.scroll,
			move;
		
		this.chart.onmousemove = undefined;
		this.scroll = 0;
		
		if (!onDrag || scroll === 0) {
			return;
		}
		
		move = scroll * getTimeUnit(this.scale);
		
		this.base -= move;
		this.origin -= move;
			
		invalidate.call(this);
		
		drawTimeScale(this.context, this.width, this.height, this.origin, this.base, this.scale);
	}
	
	function onWheel(e) {
		e.stopPropagation();
		
		zoom.call(this, e.wheelDelta > 0);
	}
	
	function zoom(zoom) {
		var scale;
		if (zoom) {
			// 확대
			
			scale = Math.max(1, this.scale -1);
		}
		else {
			// 축소
			
			scale = Math.min(3, this.scale +1);
		}
		
		if (scale == this.scale) {
			return;
		}
		
		this.base = Chart.trim(this.base, scale);
		this.origin = this.base - (this.width -1) *getTimeUnit(scale);
			
		this.scale = scale;
			
		invalidate.call(this);
	}
	
	function drawBackground(context, width, height) {
		context.save();
		
		context.strokeStyle = "#eee";
		context.lineWidth = .5;
		context.strokeRect(MARGIN_LEFT -.5, MARGIN_TOP -5.5, width +1, height +11);
		
		context.save();
		context.globalAlpha = .7;
		
		var x1 = MARGIN_LEFT -10,
			x2 = MARGIN_LEFT + width +10,
			y = MARGIN_TOP +.5;
		
		for (var i=0; i<3; i++, y += height /2) {
			context.beginPath();
			context.moveTo(x1, y);
			context.lineTo(x2, y);
			context.stroke();
		}
		
		context.restore();
	}
	
	function drawTimeScale(context, width, height, origin, base, scale) {
		var timeUnit = MINUTE;
		
		if (scale == 2) {
			timeUnit = MINUTE5;
		}
		else if (scale == 3) {
			timeUnit = HOUR6;
		}
		
		context.save();
		
		context.fillStyle = "#eee";
		context.font = "10px tahoma, arial, '맑은 고딕'";
		
		context.translate(width + MARGIN_LEFT, height + MARGIN_TOP);
		context.rotate(Math.PI /2);
		
		/**
		 * @param x graph의 x축, 1눈금이 scale에 따라 1분, 5분, 6시간을 의미한다.
		 */
		var date, year, month, day, hour, minute,
			time = base,
			x = 0;
		
		/**
		 * 분(minute) 값이 0일때까지 x를 움직인다. scale3에서는 항상 x === 0 이다. (그렇지 않다면 오류)
		 */
		do {
			date = new Date(time);
			
			minute = date.getMinutes();
			if (minute === 0) {
				break;
			}
			
			time -= timeUnit;
		}
		while (x++ < width);
		
		for (; x < width; time -= timeUnit * SCALE_SPACE, x += SCALE_SPACE) {
			date = new Date(time);
			
			month = date.getMonth() +1;
			day = date.getDate();
			hour = date.getHours();
			
			context.fillText(date.getFullYear() +"-"+ (month > 9? month: "0"+ month) +"-"+ (day > 9? day: "0"+ day) +" "+ (hour > 9? hour: "0" + hour), 10, x);
		}
		
		context.restore();
	}
	
	Chart.prototype = {
		
		/**
		 * @param id chart가 그려질 부모 element의 id
		 * @param optional onreset chart가 다시 그려져야 하는 경우 callback
		 * @param optional onchange drag에 의해 base가 변경되는 경우 callback
		 */	
		//init: function (id, height, label, onreset) {
		init: function (config) {
			/**
			 * configuration
			 */
			var client = document.getElementById(config.id);
			
			this.client = client;
			this.onreset = config.onreset || new Function();
			this.onchange = config.onchange || new Function();
			
			if (config.scroll === "auto") {
				client.addEventListener("mousewheel", onWheel.bind(this), false);
			}
			
			if (!config.width || !config.height) {
				window.addEventListener("resize", onResize.bind(this), false);
			}
			
			/**
			 * initialize
			 */
			this.chart = document.createElement("canvas");
			this.context = this.chart.getContext("2d");
			this.graph = document.createElement("canvas");
			this.graphContext = this.graph.getContext("2d");
			
			this.scale =1;
			this.scroll = 0;
			
			// TODO what is this code?
			while (client.firstChild) {
				client.removeChild(this.client.firstChild);
			}
			
			client.appendChild(this.chart);
			
			this.chart.addEventListener("mousedown", onMouseDown.bind(this), false);
			this.chart.addEventListener("mouseup", onMouseUp.bind(this), false);
			this.chart.addEventListener("mouseout", onMouseUp.bind(this), false);
			
			resize.call(this);
		},
		
		draw: function (data, color) {
			if (typeof data !== "object") {
				throw "InvalidArgumentException: data"
			}
			
			var context = this.graphContext,
				width = this.width,
				height = this.height,
				base = this.base,
				timeUnit = getTimeUnit(this.scale);
			
			context.beginPath();
			context.strokeStyle = color;
			
			for (var x=this.origin, i=0; i<width; i++, x += timeUnit) {
				if (typeof data[x] === "number") {
					context.lineTo(i, Math.round(data[x] /100 * height));
				}
				else {
					context.stroke();
					
					context.beginPath();
				}
			}
			
			context.stroke();
			
			context = this.context;
			
			Chart.clear(this.chart);
			context.putImageData(this.background, 0, 0);
			drawTimeScale(context, width, height, base - (width -1) *MINUTE, base, this.scale);
			context.drawImage(this.graph, MARGIN_LEFT, MARGIN_TOP);
		},
		
		zoom: function (zoomIn) {
			zoom.call(this, zoomIn);
		}
		
	};

	Chart.clear = function (canvas) {
		var context = canvas.getContext("2d");
		
		context.save();
		
		context.setTransform(1, 0, 0, 1, 0, 0);
		context.clearRect(0, 0, canvas.width, canvas.height);
		
		context.restore();
	};
	
	Chart.trim = function (time, scale) {
		var date = new Date(time);
		
		date.setMilliseconds(0);
		date.setSeconds(0);
		
		if (scale == 2) {
			var minutes = date.getMinutes();
			
			date.setMinutes(minutes - minutes %5);
		}
		else if (scale == 3) {
			var hours = date.getHours();
			
			date.setMinutes(0);
			date.setHours(hours - hours %6);
		}
		
		return date.getTime();
	}
	
	Chart.getMarginWidth = function () {
		return MARGIN_RIGHT + MARGIN_LEFT;
	};
	
	Chart.getMarginHeight = function () {
		return MARGIN_TOP + MARGIN_BOTTOM;
	};
	
}) (window);