/**

	Will Document This At Some Point
	
*/
;(function ( $ ) {
	'use strict'
	var re = /([^&=]+)=?([^&]*)/g;
	var decodeRE = /\+/g;  // Regex for replacing addition symbol with a space
	var decode = function (str) {return decodeURIComponent( str.replace(decodeRE, " ") );};
	$.parseParams = function(url) {
		var params = {}, e;
		if (url === undefined) return params;
		var query = url.split('?')[1] || '';
		while ( e = re.exec(query) ) { 
			var k = decode( e[1] ), v = decode( e[2] );
			if (k.substring(k.length - 2) === '[]') {
				k = k.substring(0, k.length - 2);
				(params[k] || (params[k] = [])).push(v);
			}
			else params[k] = v;
		}
		return params;
	};
	
	$.fn.serializeObject = function() {
	   var o = {};
	   var a = this.serializeArray();
	   $.each(a, function() {
		   if (o[this.name]) {
			   if (!o[this.name].push) {
				   o[this.name] = [o[this.name]];
			   }
			   o[this.name].push(this.value || '');
		   } else {
			   o[this.name] = this.value || '';
		   }
	   });
	   return o;
	};
})( jQuery );
;(function ( $ ) {
	'use strict'
	
	var _objects = {};
	var _builder = {};
	
	if ( typeof Object.create !== "function" ) {
		Object.create = function (o) {
			function F() {}
			F.prototype = o;
			return new F();
		};
	};
	
	var _setBuilder = function(object) {
		var buildIT = { metadata: [], inits: [] };
		if (object.builder) {
			if (object.builder.metadataFn) { buildIT['metadata'].push(object.builder.metadataFn); };
			if (object.builder.initFn) { buildIT['inits'].push(object.builder.initFn); };
		}
		return buildIT;
	};
	
	var _extendBuilder = function(buildIT,extend) {
		if (extend && _builder[extend]) {
			var bbl = _builder[extend];
			bbl['metadata'].forEach(function(elem) {
				if (!buildIT['metadata'].includes(elem)) { buildIT['metadata'].push(elem); }
			});
			bbl['inits'].forEach(function(elem) {
				if (!buildIT['inits'].includes(elem)) { buildIT['inits'].push(elem); }
			});
		}
		return buildIT;
	};

	var _applyBuilder = function(buildIT, name, elem, extend) {
		var result = {};
		if (name && buildIT[name]) {
			buildIT[name].forEach(function(chunk) {
				if (extend) {
					result = $.extend(true, {}, result, chunk.apply(elem));
				} else { chunk.apply(elem) }
			});
		}
		return result;
	};
	
	var _Object = {
		name: undefined,
		defaults: {},
		framework: {},
		methods: {
			data: function() {
				return this;
			},
			api: function() {
				return this.config;
			}
		},
		init: function(elem, options, name){
			this.elem = elem;
			this.$elem = $(elem);
			this.options = options;
			this.defaults = this.__proto__.defaults;
			this.methods = this.__proto__.methods;
			this.metadata = _applyBuilder(_builder[name], 'metadata', this, true);
			this.config = this.builder.configFn.apply(this);
			_applyBuilder(_builder[name], 'inits', this, false);
			return this;
		},
		extendz: undefined,
		builder: {
			metadataFn: function() { return {}; },
			configFn: function() {
				return $.extend(true, { }, this.defaults, this.options, this.metadata, this.framework);
			},
			initFn: function() { return this; }
		}
	};
	
	$.plugin = function( name, object, extend ) {
	
		object.name = name;
		
		var buildIT = _setBuilder(object)
		
		if (extend && _objects[extend]) { 
			_Object = _objects[extend];
			object.extendz = extend;
			buildIT = _extendBuilder(buildIT, extend)
		}
		
		_builder[name] = buildIT;
		
		_objects[name] = $.extend(true, { }, _Object, object);
		
		var _init = function( options ) {
			return this.each(function() {
				if ( undefined === $(this).data(name) ){
					var data = Object.create(_objects[name]).init(this, options, name);
					data.$elem.data(name, data);
				}
			});
		};
	
		$.fn[name] =  function (options) {
			if (_objects[name].methods[options]) {
				return _objects[name].methods[options].apply($(this).data(name), Array.prototype.slice.call(arguments, 1));
			} else if ( typeof options === 'object' || !options ) {
				return _init.apply(this, arguments);
			} else {
				console.log(name+' - Error!');
			}
		};
		
		$[name] = function() { return true; };
		$[name].setDefaults = function(options) {
			_objects[name].defaults = $.extend(true, { }, _objects[name].defaults, options);
		};
	};
	
})( jQuery );