var 
	HOURS1 = 3600000,
	HOURS24 = 86400000,
	GRID_MIN_WIDTH = 100,
	MARGIN_TOP = 20,
	MARGIN_RIGHT = 20,
	MARGIN_LEFT = 120,
	MARGIN_BOTTOM = 50,
	MARGIN_SCALE = 10,
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
		
		this.avgCtx.lineWidth = 2;
		//avgCtx.strokeStyle = "#fa8072";
		//maxCtx.fillStyle = "#fafad2";
		this.avgCtx.strokeStyle = "#fafad2";
		this.maxCtx.fillStyle = "#fa8072";
		
		this.gridCtx.font = "14px tahoma, arial, '맑은 고딕'"
		this.gridCtx.globalAlpha = .1;
		//this.gridCtx.textAlign = "left";
		this.gridCtx.textBaseline="top";
	}
	
	function closePath(x, point) {
		this.maxCtx.lineTo(x, this.height);
		this.maxCtx.lineTo(point, this.height);
		this.maxCtx.closePath();
		this.maxCtx.fill();
		
		this.minCtx.lineTo(x, 0);
		this.minCtx.lineTo(point, 0);
		this.minCtx.closePath();
		this.minCtx.fill();
		
		this.avgCtx.stroke();
		
		this.avgCtx.beginPath();
		this.minCtx.beginPath();
		this.maxCtx.beginPath();
	}
	
	function resize() {
		this.resize();
		
		this.draw();
	}
	
	function onDrag(event) {
		this.ondragmove(event.moveX);
	}
	
	Chart.prototype = {
		init: function (config) {
			config = config || {};
			
			if (config.id) {
				this.chart = document.getElementById(config.id);
			}
			else {
				this.chart = document.createElement("div");
			}
			
			this.ondragmove = config.ondragmove || function () {};
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
			
			this.resize();
			
			this.canvas.className = "chart";
			
			this.chart.appendChild(this.canvas);
			
			this.start = new Date().setHours(0, 0, 0, 0);
			this.end = this.start + HOURS24;
			this.tpp = HOURS24 / this.width;
			
			new Draggable(this.chart).on("dragmove", onDrag.bind(this));
			
			window.addEventListener("resize", resize.bind(this), false);
		},
		
		draw: function () {
			var
				block = this.width * HOURS1 / (this.end - this.start),
				date = this.start,
				end = this.end,
				offset = 0,
				gridBlock =0,
				max = 100,
				skip = 0,
				data = new Data(),
				diff, value, gridX, point;
			
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
			this.avgCtx.setTransform(1, 0, 0, 1, MARGIN_LEFT - offset, MARGIN_TOP);
			//this.avgCtx.setTransform(1, 0, 0, 1, offset + MARGIN_LEFT , MARGIN_TOP);
			
			this.minCtx.save();
			this.minCtx.setTransform(1, 0, 0, 1, MARGIN_LEFT - offset, MARGIN_TOP);
			//this.minCtx.setTransform(1, 0, 0, 1, offset + MARGIN_LEFT, MARGIN_TOP);
			
			this.maxCtx.save();
			this.maxCtx.setTransform(1, 0, 0, 1, MARGIN_LEFT - offset, MARGIN_TOP);
			//this.maxCtx.setTransform(1, 0, 0, 1, offset + MARGIN_LEFT, MARGIN_TOP);
			
			this.gridCtx.save();
			this.gridCtx.setTransform(1, 0, 0, 1, MARGIN_LEFT - offset, MARGIN_TOP);
			//this.gridCtx.setTransform(1, 0, 0, 1, offset + MARGIN_LEFT, MARGIN_TOP);
			
			this.avgCtx.beginPath();
			this.minCtx.beginPath();
			this.maxCtx.beginPath();
			
			for (var x=0; date <= end; x += block, date += HOURS1, gridBlock += block) {
				value = this.data[date];
				
				if (gridBlock > GRID_MIN_WIDTH) {
					gridX = Math.round(x - block /2) +.5;
					
					stroke(this.gridCtx, gridX, 0, gridX, this.height +5);
					this.gridCtx.save();
					
					this.gridCtx.globalAlpha = 1;
					this.gridCtx.fillText(format(date), gridX, this.height + MARGIN_SCALE);
					this.gridCtx.restore();
					
					gridBlock = 0;
				}
				
				if (value) {
					data.push(x, value);
				}
				else {
					data.wrap();
				}
			}
			
			data.wrap();
			
			for (var i=0, _i=data.length(), j, block, blockX, blockV, x, v; i<_i; i++) {
				block = data.get(i);
				blockX = block.x;
				blockV = block.v;
				
				for (j=0, _j=block.length; j<_j; j++) {
					x = blockX[j];
					value = blockV[j];
					
					this.avgCtx.lineTo(x, (max - value.avg) / max * this.height);
					this.minCtx.lineTo(x, (max - value.min) / max * this.height);
					this.maxCtx.lineTo(x, (max - value.max) / max * this.height);
				}
				
				closePath.call(this, x, block.z);
			}
			
			this.avgCtx.restore();
			this.minCtx.restore();
			this.maxCtx.restore();
			this.gridCtx.restore();
			
			this.context.fillRect(MARGIN_LEFT, MARGIN_TOP, this.width, this.height + MARGIN_BOTTOM);
			
			this.maxCtx.save();
			this.maxCtx.globalCompositeOperation = "destination-in";
			this.maxCtx.drawImage(this.min, 0, 0);
			this.maxCtx.restore();
			
			this.maxCtx.drawImage(this.avg, 0, 0);
			this.maxCtx.drawImage(this.grid, 0, 0);
			
			this.context.save();
			this.context.globalCompositeOperation = "source-in";
			this.context.drawImage(this.max, 0, 0);
			this.context.restore();
			
			this.context.strokeRect(MARGIN_LEFT -.5, MARGIN_TOP -.5, this.width, this.height);
			//this.context.drawImage(this.grid, 0, 0);
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
			
			this.draw();
		},
		
		move: function (amount) {
			var move = this.tpp * amount;
				
			this.start -= move;
			this.end -= move;
			
			return this.draw();
		},
		
		set: function (milliseconds, origin) {
			this[origin] = milliseconds;
			
			this.draw();
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
			var rect = this.chart.getBoundingClientRect();
			
			initCanvas.call(this, rect.width, rect.height);
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