var
	MINUTES1 = 60000,
	HOURS1 = 3600000,
	HOURS24 = 86400000,
	GRID_MIN_WIDTH = 100,
	MARGIN_TOP = 20,
	MARGIN_RIGHT = 20,
	MARGIN_LEFT = 20,
	MARGIN_BOTTOM = 50,
	MARGIN_SCALE = 10,
	BG_COLOR = "#ffffff",
	MONTH_NAME = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function Chart(config) {
	this.init(config);
}

function Data() {
	this.init();
}

function sort(a, b) {
	return parseInt(a, 10) - parseInt(b, 10);
}

function clearCanvas(canvas) {
	var context = canvas.getContext("2d");
	
	context.save();
	
	context.setTransform(1, 0, 0, 1, 0, 0);
	context.clearRect(0, 0, canvas.width, canvas.height);
	
	context.restore();
}

function format(milliseconds, option) {
	var date = new Date(milliseconds),
		day = date.getDate();
	
	return MONTH_NAME[date.getMonth()] +" "+ (day > 9? "": "0")+ day +", "+ date.getHours();
}

function stroke(context, x1, y1, x2, y2) {
	context.beginPath();
	context.moveTo(x1, y1);
	context.lineTo(x2, y2);
	context.stroke();
}

(function (window, undefined) {
	
	function initCanvas(width, height) {
		this.canvas.width = width;
		this.canvas.height = height;
		this.max.width = width;
		this.max.height = height;
		this.avg.width = width;
		this.avg.height = height;
		this.min.width = width;
		this.min.height = height;
		this.grid.width = width;
		this.grid.height = height;
		
		this.width = width - MARGIN_LEFT - MARGIN_RIGHT;
		this.height = height - MARGIN_BOTTOM - MARGIN_TOP;
		
		this.tpp = HOURS24 / this.width;
		
		this.context.fillStyle = BG_COLOR;
		this.context.font = "14px tahoma, arial, '맑은 고딕'"
			
		this.avgCtx.lineWidth = 2;
		this.avgCtx.strokeStyle = this.strokeStyle;
		
		this.maxCtx.fillStyle = this.fillStyle;
		
		this.minCtx.fillStyle = BG_COLOR;
		this.gridCtx.font = "14px tahoma, arial, '맑은 고딕'"
		this.gridCtx.textBaseline="top";
	}
	
	function closePath2(avg, max, min, x, cpX, cpY) {
		max.lineTo(x, cpY);
		max.lineTo(cpX, cpY);
		max.closePath();
		max.fill();
		
		min.lineTo(x, 0);
		min.lineTo(cpX, 0);
		min.closePath();
		min.fill();
		
		avg.stroke();
		
		avg.beginPath();
		min.beginPath();
		max.beginPath();
	}
	
	function closePath(avg, max, min, x, cpX) {
		max.lineTo(x, 0);
		max.lineTo(cpX, 0);
		max.closePath();
		max.fill();
		
		min.lineTo(x, 0);
		min.lineTo(cpX, 0);
		min.closePath();
		min.fill();
		
		avg.stroke();
		
		avg.beginPath();
		min.beginPath();
		max.beginPath();
	}
	
	function resize() {
		this.resize();
		
		this.invalidate();
	}
	
	function onDrag(action, event) {
		var x = event.moveX;
		if (x != 0) {
			this.ondrag(action, event.moveX);
		}
	}
	
	Chart.prototype = {
		init: function (config) {
			config = config || {};
			
			this.canvas = document.createElement("canvas");
			this.max = document.createElement("canvas");
			this.avg = document.createElement("canvas");
			this.min = document.createElement("canvas");
			this.grid = document.createElement("canvas");
			
			this.context = this.canvas.getContext("2d");
			this.avgCtx = this.avg.getContext("2d");
			this.minCtx = this.min.getContext("2d");
			this.maxCtx = this.max.getContext("2d");
			this.gridCtx = this.grid.getContext("2d");
			
			this.user = {};
			
			this.strokeStyle = config.strokeStyle || "#75bdde";
			this.fillStyle = config.fillStyle || "#e0ffff";
			
			this.ondrag = config.ondrag || function () {};
			
			if (config.id) {
				this.chart = document.getElementById(config.id);
				
				this.resize();
			}
			else {
				this.chart = document.createElement("div");
			}
			
			this.canvas.className = "chart";
			
			this.chart.appendChild(this.canvas);
			
			this.start = new Date().setHours(0, 0, 0, 0);
			this.end = this.start + HOURS24;
			
			var draggable = new Draggable(this.chart);
			draggable.on("dragstart", onDrag.bind(this, "start"));
			draggable.on("dragmove", onDrag.bind(this, "move"));
			draggable.on("dragend", onDrag.bind(this, "end"));
			
			window.addEventListener("resize", resize.bind(this), false);
		},
		
		invalidate: function () {
			var
				data = this.data;
			
			if (!data) {
				return;
			}
			
			var
				block = HOURS1 / this.tpp,
				date = this.start,
				end = this.end,
				offset = 0,
				gridBlock =0,
				skip = 0,
				labelLength = 0,
				tmpData = new Data(),
				high, height, diff, value, gridX, cpX;
			
			diff = this.start - new Date(this.start).setMinutes(0, 0, 0);
			if (diff > 0) {
				offset = Math.round(diff /this.tpp);
				date = this.start - diff;
			}
			
			diff = this.end - new Date(this.end).setMinutes(0, 0, 0);
			if (diff > 0) {
				end = this.end - diff + HOURS1;
			}
			
			this.clear();
			
			this.avgCtx.save();
			this.avgCtx.setTransform(1, 0, 0, -1, MARGIN_LEFT - offset, MARGIN_TOP + this.height);
			
			this.minCtx.save();
			this.minCtx.setTransform(1, 0, 0, -1, MARGIN_LEFT - offset, MARGIN_TOP + this.height);
			
			this.maxCtx.save();
			this.maxCtx.setTransform(1, 0, 0, -1, MARGIN_LEFT - offset, MARGIN_TOP + this.height);
			
			this.gridCtx.save();
			this.gridCtx.setTransform(1, 0, 0, 1, MARGIN_LEFT - offset, MARGIN_TOP);
			
			this.avgCtx.beginPath();
			this.minCtx.beginPath();
			this.maxCtx.beginPath();
			
			for (var x=0; date <= end; x += block, date += HOURS1, gridBlock += block) {
				value = data[date];
				
				if (gridBlock > GRID_MIN_WIDTH) {
					gridX = Math.round(x - block /2) +.5;
					
					this.gridCtx.save();
					this.gridCtx.globalAlpha = .1;
					stroke(this.gridCtx, gridX, 0, gridX, this.height +5);
					this.gridCtx.restore();
					
					this.gridCtx.fillText(format(date), gridX, this.height + MARGIN_SCALE);
					
					gridBlock = 0;
				}
				
				if (value) {
					tmpData.push(x, value);
					
					labelLength = Math.max(labelLength, this.gridCtx.measureText(value.avg).width);
					labelLength = Math.max(labelLength, this.gridCtx.measureText(value.max).width);
					labelLength = Math.max(labelLength, this.gridCtx.measureText(value.min).width);
				}
				else {
					tmpData.wrap();
				}
			}
			
			tmpData.wrap();
			
			high = tmpData.high;
			this.high = high;
			
			for (var i=0, _i=tmpData.length(), j, block, blockX, blockV, x, v; i<_i; i++) {
				block = tmpData.get(i);
				blockX = block.x;
				blockV = block.v;
				
				for (j=0, _j=block.length; j<_j; j++) {
					x = blockX[j];
					value = blockV[j];
					
					this.avgCtx.lineTo(x, value.avg / high * this.height);
					this.minCtx.lineTo(x, value.min / high * this.height);
					this.maxCtx.lineTo(x, value.max / high * this.height);
				}
				
				//closePath(this.avgCtx, this.maxCtx, this.minCtx, x, block.z, this.height);
				closePath(this.avgCtx, this.maxCtx, this.minCtx, x, block.z);
			}
			
			this.avgCtx.restore();
			this.minCtx.restore();
			this.maxCtx.restore();
			this.gridCtx.restore();
			
			this.context.fillRect(MARGIN_LEFT + labelLength + 5, MARGIN_TOP, this.width - labelLength -5, this.height);
			
			this.context.save();
			this.context.globalCompositeOperation = "source-atop";
			this.context.drawImage(this.max, 0, 0);
			this.context.drawImage(this.min, 0, 0);
			this.context.drawImage(this.avg, 0, 0);
			this.context.restore();
			
			this.gridCtx.strokeRect(MARGIN_LEFT + labelLength +5 -.5, MARGIN_TOP -.5, this.width - labelLength -5, this.height);
			
			this.gridCtx.save();
			this.gridCtx.textBaseline = "bottom";
			this.gridCtx.fillText(this.title || "", MARGIN_LEFT + labelLength + this.width /2, MARGIN_TOP + this.height + MARGIN_BOTTOM);
			this.gridCtx.restore();
			this.gridCtx.save();
			this.gridCtx.textAlign = "right";
			this.gridCtx.textBaseline="middle";
			this.gridCtx.fillText(tmpData.high || "", MARGIN_LEFT + labelLength, MARGIN_TOP);
			this.gridCtx.fillText("0", MARGIN_LEFT + labelLength, MARGIN_TOP + this.height);
			this.gridCtx.restore();
			
			
			this.context.drawImage(this.grid, 0, 0);
			
			this.detail = undefined;
		},
		
		draw: function (detail) {
			if (this.detail) {
				return;
			}
			
			var
				block = this.width * MINUTES1 / (this.end - this.start),
				date = new Date(this.start),
				end = this.end,
				offset = 0,
				high = this.high,
				height = this.height,
				key = date.setSeconds(0, 0),
				diff, value;
			
			diff = this.start - key;
			if (diff > 0) {
				offset = Math.round(diff /this.tpp);
			}
			
			diff = this.end - new Date(this.end).setSeconds(0, 0);
			if (diff > 0) {
				end = this.end - diff + MINUTES1;
			}
			
			this.avgCtx.save();
			this.avgCtx.setTransform(1, 0, 0, 1, MARGIN_LEFT - offset, MARGIN_TOP);
			
			for (var x=0; key <= end; x += block, key = date.setMinutes(date.getMinutes() +1)) {
				value = detail[key];
				
				if (value) {
					this.avgCtx.lineTo(x, (high - value) / high * height);
				}
				else {
					this.avgCtx.stroke();
					this.avgCtx.beginPath();
				}
			}
			this.avgCtx.stroke();
			this.avgCtx.restore();
			
			this.context.save();
			this.context.globalCompositeOperation = "source-atop";
			this.context.drawImage(this.avg, 0, 0);
			this.context.restore();
			
			this.detail = detail;
		},
		
		/**
		 * 
		 * @param amount px 양수는 확대, 음수는 축소
		 * @param origin start or end
		 */
		zoom: function (amount, origin) {
			var sign = amount < 0? 1: -1;
			
			if (amount === 0 || !this[origin]) {
				return;
			}
			
			amount = Math.abs(amount);
			
			for (var i=0; i<amount; i++ ) {
				this[origin] += sign * this.tpp;
				
				this.tpp = (this.end - this.start) / this.width;
			}
			
			this.invalidate();
		},
		
		move: function (amount) {
			var move = this.tpp * amount;
			
			this.start -= move;
			this.end -= move;
			
			this.invalidate();
		},
		
		set: function (start, end) {
			this.tpp = (end - start) / this.width;
			this.start = start;
			this.end = end;
			
			this.invalidate();
		},
		
		clear: function () {
			var width = this.canvas.width,
				height = this.canvas.height;
			
			this.context.save();
			this.context.setTransform(1, 0, 0, 1, 0, 0);
			this.context.clearRect(0, 0, width, height);
			this.context.restore();
			
			this.avgCtx.save();
			this.avgCtx.setTransform(1, 0, 0, 1, 0, 0);
			this.avgCtx.clearRect(0, 0, width, height);
			this.avgCtx.restore();
			
			this.maxCtx.save();
			this.maxCtx.setTransform(1, 0, 0, 1, 0, 0);
			this.maxCtx.clearRect(0, 0, width, height);
			this.maxCtx.restore();
			
			this.minCtx.save();
			this.minCtx.setTransform(1, 0, 0, 1, 0, 0);
			this.minCtx.clearRect(0, 0, width, height);
			this.minCtx.restore();
			
			this.gridCtx.save();
			this.gridCtx.setTransform(1, 0, 0, 1, 0, 0);
			this.gridCtx.clearRect(0, 0, width, height);
			this.gridCtx.restore();		
		},
		
		resize: function () {
			var rect;
			
			document.createDocumentFragment().appendChild(this.canvas);
			
			rect = this.chart.getBoundingClientRect();
			
			initCanvas.call(this, rect.width, rect.height);
			
			this.chart.appendChild(this.canvas);
		},
		
		getFile: function () {
			var file=[];
			
			if (this.detail) {
				var data = this.detail,
					date = new Date(this.start),
					end = this.end,
					key = date.setSeconds(0, 0),
					index=0, value;
				
				file[0] = "index,date,value";
				
				while (key < end) {
					value = data[key];
					
					if (value) {
						file[file.length] = index++ +","+ date.toISOString().slice(0, 10) + " "+ date.toTimeString().slice(0, 8) +","+ value;
					}
					
					key = date.setMinutes(date.getMinutes() +1);
				}
			}
			else {
				var data = this.data,
					date = new Date(this.start),
					end = this.end,
					key = date.setMinutes(0, 0, 0),
					index=0, value;
				
				file[0] = "index,date,max,avg,min";
				
				while (key < end) {
					value = data[key];
					
					if (value) {
						file[file.length] = index++ +","+ date.toISOString().slice(0, 10) + " "+ date.toTimeString().slice(0, 8) +","+ value.max +","+ value.avg +","+ value.min;
					}
					
					key = date.setHours(date.getHours() +1);
				}
			}
			
			if (file.length > 0) {
				return "data:text/csv;charset=utf-8,"+ encodeURI(file.join("\n"));
			}
		}
		
	};
	
	Chart.toDateString = function (date) {
		var year = date.getFullYear();
		var month = date.getMonth() + 1;
		var date  = date.getDate();
		
		return year +"-"+ (month > 9? "": "0") + month +"-"+ (date > 9? "": "0") + date;
	};
	
	Data.prototype = {
		init: function () {
			this.data = [];
			this.summary = [];
			this.block = Data.create();
		},
		
		length: function () {
			return this.data.length;
		},
		
		get: function (index) {
			return this.data[index];
		},
		
		// 일반적인 push
		_push: function (x, v) {
			var index = this.block.length;
			
			if (index === 0) {
				this.block.z = x;
			}
			
			this.block.x[index] = x;
			this.block.v[index] = v;
			
			this.block.length = index +1;
		},
		
		// summary push
		push: function (x, v) {
			var index = this.block.length,
				blockX = this.block.x,
				blockV = this.block.v;
			
			// 시작점 저장 (closePath 시 돌아갈 곳)
			if (index === 0) {
				this.block.z = x;
			}
			// data가 충분히 많아서 1px에 여러 좌표를 그리게 될 경우 summary 
			else if (x - blockX[index -1] < 1) {
				this.summary[this.summary.length] = v;
				
				return;
			}
			else {
				var value = {
						avg: v.avg,
						max: v.max,
						min: v.min
					},
					summary,
					sum = 0;
				
				for (var i=0, length=this.summary.length; i<length; i++) {
					summary = this.summary[i];
					
					value.avg += summary.avg;
					value.max = Math.max(value.max, summary.max);
					value.min = Math.min(value.min, summary.min);
				}
				
				value.avg /= (length +1);
				
				v = value;
				
				this.summary = [];
			}
			
			blockX[index] = x;
			blockV[index] = v;
			
			this.high = Math.max(this.high || v.max, v.max);
			this.low = Math.min(this.low || v.min, v.min);
			
			this.block.length = index +1;
		},
		
		wrap: function () {
			if (this.block.length === 0) {
				return;
			}
			
			this.data[this.data.length] = this.block;
			
			this.block = Data.create();
		}
		
	}
	
	Data.create = function () {
		return {
			length: 0,
			x: [],
			v: []
		};
	};
	
}) (window);