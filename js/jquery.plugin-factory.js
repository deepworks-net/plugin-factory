/**

	Will Document This At Some Point
	
	This lib depends on JQuery.
	
*/
;(function ( $ ) {
	'use strict'
	/* Pulls apart a url and returns all of the get parameters as an object. Added to jQuery object. */
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
	
	/* Serializes an element into a jQuery object. */
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
	/* Collection of plugin objects (by plugin name) and their defaults (after creation) */
	var _objects = {};
	/* 
		Collection of plugin defaults (by plugin name and without merging with the base _Object) passed in when creating a plugin. 
		When a plugin's defaults are updated, so is the corresponding plugin defaults.
	*/
	var _p_defs = {};
	/* Collection of plugin builder objects (by plugin name). */
	var _builder = {};
	
	/*
		Object.create support test, and fallback for browsers without it
	*/
	if ( typeof Object.create !== "function" ) {
		Object.create = function (o) {
			function F() {}
			F.prototype = o;
			return new F();
		};
	};
	
	/* Creates the initial builder object for a plugin and returns it. */
	var _setBuilder = function(object) {
		var buildIT = { metadata: [], inits: [] };
		if (object.builder) {
			if (object.builder.metadataFn) { buildIT['metadata'].push(object.builder.metadataFn); };
			if (object.builder.initFn) { buildIT['inits'].push(object.builder.initFn); };
		}
		return buildIT;
	};
	
	/* 
		Extends a builder object. The buildIT parameter is the object that is extended and returned. The extend parameter is the string name of the plugin to 
		extend a builder object from.
	*/
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

	/* 
		Used during a plugin initialization, this method calls all methods in the builder object by name.
		The buildIT parameter object is the builder object to apply to the plugin.
		The name parameter string is the name of the type of builder functions to call.
		The elem parameter object is the object to apply the functions on.
		The extend parameter boolean parameter determines if returned values (must be an object) are merged together or not.
		This function returns the merged results of the functions (if extend === true) or an empty object (if extend !== true).
	*/
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
	
	/* The Defaults for a new plugin with initialization framework. */
	var _Object = {
		/* The Plugin Name. */
		name: undefined,
		/* Defaults for the plugin, these are meant to be overridden when initializing the plugin and when creating a plugin. */
		defaults: {},
		/* The plugin's login. These functions are not meant to be overridden in plugin initialization, but can be when creating a plugin. */
		framework: {},
		/* The plugin's public methods. These are not meant to be overridden in plugin initialization, but can be when creating a plugin. */
		methods: {
			/* Returns the data object associated with the element the plugin was created on. */
			data: function() {
				return this;
			},
			/* Returns the configuration of the plugin associated with the element the plugin was created on. */
			api: function() {
				return this.config;
			}
		},
		/* The initialization function. This is not meant to be overridden when creating a plugin. Only do so if you know what you are doing! */
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
		/* The name of the plugin that this plugin was extended from. */
		extendz: undefined,
		/* 
			The builder object. The metadataFn and initFn functions will never be overridden as they are added to the builder object. The configFn function will be overridden if a definition is supplied. 
			Only override configFn if you know what you are doing!
		*/
		builder: {
			/* Function used to pull metadata into the plugin. Default returns an empty object. */
			metadataFn: function() { return {}; },
			/* Builds the plugin's configuration object based on various objects. */
			configFn: function() {
				return $.extend(true, { }, this.defaults, this.options, this.metadata, this.framework);
			},
			/* Function used to do extra initialization of a plugin. Returns itself. */
			initFn: function() { return this; }
		}
	};
	
	/* Initializes a single plugin based on the plugin parameter string passed to it. If nothing is passed or it does not exist as a plugin, nothing happens. */
	var _initPlugin = function(plugin) {
		if (plugin && _objects[plugin]) {
			$[plugin].init();
		}
	};
	
	/* Extends a set of defaults for children plugins. Basically sets new defaults for a plugin, and then updates all plugins that have extended that plugin. */
	var _extendDefaults = function( name, options ) {
		if (typeof options === 'object') {
			/* Update the plugin defaults that were passed in on plugin creation. */
			_p_defs[name] = $.extend(true, {}, _p_defs[name], options);
			/* Recursive function to update all child plugins. */
			var _extendInIt = function( parent, nameit ) {
				/* Extends the child plugin's defaults and updates the defaults in the _objects collection. */
				_objects[nameit].defaults = $.extend(true, { }, _objects[parent].defaults, _p_defs[nameit]);
				/* Look for children of the children and update those defaults too. */
				$.each(_objects, function(i, obj){
					if (obj.extendz === nameit) { _extendInIt(nameit, obj.name); }
				});
				
			};
			
			/* Extends the plugin defaults and updates them in the _objects collection. */
			_objects[name].defaults = $.extend(true, { }, _objects[name].defaults, options);
			/* Look for each child plugin and update those defaults too. */
			$.each(_objects, function(i, obj){
				if (obj.extendz === name) { _extendInIt(name, obj.name); }
			});
		}
	};
	
	/* Adds a method to a plugin object, and it's children objects, unless it already exists. */
	var _addMethod = function (name, mName, mFunc) {
		if (!_objects[name].methods[mName]) {
			/* Add function to the plugin object. */
			_objects[name].methods[mName] = mFunc;
			/* Look for each child plugin and add the method to those too. */
			$.each(_objects, function(i, obj){
				if (obj.extendz === name) { _addMethod(obj.name, mName, mFunc); }
			});
		};
	};
	
	/* 
		Creates a new Plugin from the builder. The 'name' parameter is required and must be a unique string (something that does not already exist in the jQuery namespace). Object and extend are optional.
		Object is the plugin options/defaults/methods/framework/ect. for the plugin. 
		Extend is the string name of the plugin the newley created plugin will extend. Will only extend if the parameter is a string and exists.
	*/
	$.plugin = function( name, object, extend ) {
		/* catch potential errors */ 
		if (!name) {
			console.error('A Name For This Plugin Is Required!');
		} else if (typeof name !== 'string') {
			console.error('The Name For This Plugin Must Be A String!');
		} else if (name && $[name]) {
			console.error(name + 'Already Exists in jQuery, Could Not Add Plugin!');
		} else {
			/* Check for passed object and make empty object if undefined. */
			if (!object) { object = {}; }
			var _Obj = _Object;
			object.name = name;
			
			/* Store the original defaults passed to the plugin. */
			_p_defs[name] = (object.defaults) ? object.defaults : {};
			
			/* Create the builder object with the default init methods passed in. */
			var buildIT = _setBuilder(object)
			
			/* Check to see if this plugin is extending an existing plugin. If so, get the plugin's defaults, extend the builder object and update the new plugin. */
			if (extend && typeof extend === 'string' && _objects[extend]) { 
				_Obj = _objects[extend];
				object.extendz = extend;
				buildIT = _extendBuilder(buildIT, extend)
			}
			
			/* Store a copy of the builder object for this plugin. */
			_builder[name] = buildIT;
			
			/* Extend and store a copy of the new plugin for later use. */
			_objects[name] = $.extend(true, { }, _Obj, object);
			
			/* Basic initilization function for the new plugin creating a data object, attaching it to an element, and initializing it. */
			var _init = function( options ) {
				return this.each(function() {
					if ( undefined === $(this).data(name) ){
						var data = Object.create(_objects[name]).init(this, options, name);
						data.$elem.data(name, data);
					}
				});
			};
		
			/*
				Adds the plugin in the jQuery namespace. Can be passed either a method command (as a string) or a set of options (as an object) to initialize a plugin. If a command does not exist,
				the plugin with throw an error (in the console) and not initialize the plugin. If nothing is passed, the plugin will be initialized with the default settings for the plugin.
			*/
			$.fn[name] =  function (options) {
				var data = $(this).data(name); 
				if (data && _objects[name].methods[options]) {
					return _objects[name].methods[options].apply(data, Array.prototype.slice.call(arguments, 1));
				} else if ( typeof options === 'object' || !options ) {
					return _init.apply(this, arguments);
				} else {
					if (data && typeof options === 'string') {
						console.error(name+' - Method '+options+' Does Not Exist!');
					} else {
						console.error(name+' - Access without initialization!');
					}
				}
			};
			
			/* Adds a testable function to the jQuery object. Use this to test if a plugin has been added to the jQuery Object. */
			$[name] = function() { return true; };
			/* Adds the ability to set the defaults of a plugin. Any plugin initialized after setting new defaults will use the new defaults. */
			$[name].setDefaults = function(options) {
				_extendDefaults(name, options);
			};
			/* Adds the ability to automatically initialize a plugin based on the attribute data-plugin, adding data-plugin="[Name Of Plugin]" and then calling this method will initialize it.*/
			$[name].init = function() {
				$.fn[name].apply($('[data-plugin="'+name+'"]'));
			};
			/* 
				Adds a new public method to the plugin. The mName parameter is the string name of the function, mFunc is the function definition. 
			*/
			$[name].addMethod = function(mName, mFunc) {
				if (typeof mName === 'string' && typeof mFunc === 'function') {
					_addMethod(name, mName, mFunc);
				}
			};
		};
	};
	
	/* Checks to see if a plugin exists and has been declared. Returns true if it exists, false otherwise. This only applies to plugins created with the plugin factory. */
	$.plugin.exists = function(plugin) {
		return ((typeof plugin === 'string' && _objects[plugin]) ? $[plugin]() : false);
	};
	
	/* 
		Initializes plugin(s). If nothing is passed to this function, it will initialize all plugins via the plugin's init function (with data-plugin="[Name Of Plugin]").
		If the name of a plugin is passed, that specific plugin will be initialized. Also accepts an array of plugin names to initialize. If the plugin name does not exist, nothing is initialized.
	*/
	$.plugin.init = function(plugin) {
		if (plugin) {
			if (Array.isArray(plugin)) {
				$.each(plugin, function(i, val) {
					_initPlugin(val);
				});
			} else {
				_initPlugin(plugin);
			}
		} else {
			$.each(_objects, function(i, obj) {
				$[obj.name].init();
			});
		}
	};
	
	/* Sets default optons for the plugin with the given name. The plugin parameter string is the name of the plugin, the options parameter object are the new defaults. */
	$.plugin.setDefaults = function(plugin, options) {
		(plugin && typeof plugin === 'string' && _objects[plugin]) ? _extendDefaults(plugin, options) : console.error('Could Not Set Defaults! Please check your plugin name!');
	}
	
	/* Adds a method to a plugin with the given name. The plugin parameter string is the name of the plugin, the mName parameter is the string name of the function, mFunc is the function definition. */
	$.plugin.addMethod = function(plugin, mName, mFunc) {
		(plugin && typeof plugin === 'string' && _objects[plugin] && typeof mName === 'string' && typeof mFunc === 'function') ? _addMethod(plugin, mName, mFunc) : console.error('Could Not Method! Please check your plugin name!');
	}
	
})( jQuery );