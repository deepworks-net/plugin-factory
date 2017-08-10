/**

	Will Document This At Some Point
	
	This lib depends on JQuery.
	
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
	var _p_defs = {};
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
				if (!(buildIT['metadata'].indexOf(elem) > -1)) { buildIT['metadata'].push(elem); }
			});
			bbl['inits'].forEach(function(elem) {
				if (!(buildIT['inits'].indexOf(elem) > -1)) { buildIT['inits'].push(elem); }
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
	
	var _extendDefaults = function( name, options ) {
	
		_p_defs[name] = $.extend(true, {}, _p_defs[name], options);
		var _extendInIt = function( parent, nameit ) {

			_objects[nameit].defaults = $.extend(true, { }, _objects[parent].defaults, _p_defs[nameit]);
			$.each(_objects, function(i, obj){
				if (obj.extendz === nameit) { _extendInIt(nameit, obj.name); }
			});
			
		};
		
		_objects[name].defaults = $.extend(true, { }, _objects[name].defaults, options);
		$.each(_objects, function(i, obj){
			if (obj.extendz === name) { _extendInIt(name, obj.name); }
		});
	};
	
	$.plugin = function( name, object, extend ) {
	
		var _Obj = _Object;
		object.name = name;
		
		/* Move? */
		_p_defs[name] = (object.defaults) ? object.defaults : {};
		
		var buildIT = _setBuilder(object)
		
		if (extend && _objects[extend]) { 
			_Obj = _objects[extend];
			object.extendz = extend;
			buildIT = _extendBuilder(buildIT, extend)
		}
		
		_builder[name] = buildIT;
		
		_objects[name] = $.extend(true, { }, _Obj, object);
		
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
		
		// Should These Be defaults of the plugin or also for the builder?
		$[name] = function() { return true; };
		$[name].setDefaults = function(options) {
			_extendDefaults(name, options);
		};
	};
	
})( jQuery );