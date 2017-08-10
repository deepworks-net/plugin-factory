/**

	Will Document This At Some Point
	
	This lib depends on the validationEngine and JQuery
	
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
	
	if ( typeof Object.create !== "function" ) {
		Object.create = function (o) {
			function F() {}
			F.prototype = o;
			return new F();
		};
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
		init: function(elem, options){
			this.elem = elem;
			this.$elem = $(elem);
			this.options = options;
			this.defaults = this.__proto__.defaults;
			this.methods = this.__proto__.methods;
			this.metadata = this.builder.metadataFn.apply(this);
			this.config = this.builder.configFn.apply(this);
			this.builder.initFn.apply(this);
			return this;
		},
		super: function() { return this; },
		builder: {
			metadataFn: function(){ return undefined; },
			configFn: function() {
				return $.extend(true, { }, this.defaults, this.options, this.metadata, this.framework);
			},
			initFn: function() { }
		}
	};
	
	$.plugin = function( name, object, extend ) {
	
		object.name = name;
		
		if (extend && _objects[extend]) { 
			_Object = _objects[extend];
			object.super = function() { return _Object; };
		}

		_objects[name] = $.extend(true, { }, _Object, object);
		
		var _init = function( options ) {
			return this.each(function() {
				if ( undefined === $(this).data(name) ){
					var data = Object.create(_objects[name]).init(this, options);
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