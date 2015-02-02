(function() {

    function Base(props) {
        $.extend(this, props);
        
        var controller = (props.controller || this.controller);

        this._observers = {};
        this.$ = function(selector) {
            return this.$target.find(selector);
        }.bind(this);
        this.id = Ambient.getID();
        
        if (controller) {
            this.controller = new controller({
                model: this.model,
                view: this
            });
        } else {
            if (this.handlers && Object.keys(this.handlers).length) {
                throw new Error("Handlers require a Controller.");
            }
        }

        this.setTarget(this.target, true);
    }
    
    Base.prototype.on = function() {
        this.model.events.on.apply(this.model.events, arguments);
    };

    Base.prototype.off = function() {
        this.model.events.off.apply(this.model.events, arguments);
    };

    // Remove from the DOM.
    Base.prototype.destroy = function() {
        this.unobserve();
        this.$target.remove();
    };

    Base.prototype.bindings = ["keydown", "keyup", "keypress", "change", "paste"];
    
    // Attach data model bindings to elements within the DOM that have a data-bind attribute.
    Base.prototype.bind = function() {
        var self = this;
        this.bindings.forEach(function(event) {
            this.$target.on(event, "[data-bind$='," + event + "']", function(e) {
                var bind = e.target.dataset.bind;
                var attribute = bind.substring(0, bind.lastIndexOf(","));
                var modelValue = self.model.get(attribute);
                var value = e.target.value;

                if (modelValue != value) {
                    self.model.set(attribute, value);
                }
            });
        }, this);
    };

    // Remove bindings with the data model.
    Base.prototype.unbind = function() {
        this.bindings.forEach(function(event) {
            this.$target.off(event, "[data-bind$='," + event + "']");
        }, this);
    };

    // Process bindings such as input and select elements
    Base.prototype.populate = function() {
        var self = this;
        
        this.$target.find("[data-bind]").each(function() {
            var bind = this.dataset.bind;
            var attribute = bind.substring(0, bind.lastIndexOf(","));
            var value = self.model.get(attribute);

            self.set(this, value);
        });
    };

    // Should probably be a private function.
    Base.prototype.set = function(element, value) {
        if (typeof value === "undefined") { return; }
        
        if (element.tagName.toLowerCase() == "select") {
            // IE appears to ignore setting the value property on select elements. This seems like the fastest
            // solution and doesn't require instantiating a jQuery element.
            for (var i = 0; i < element.options.length; i ++) {
                var option = element.options[i];
                if (option.value == value) {
                    option.selected = true;
                    break;
                }
            }
        } else {
            // This is mainly to prevent the input that caused the change recieving the same change update.
            if (element.value != value) {
                element.value = value;
            }
        }
    };

    // Listens for change events on the model.
    Base.prototype.observe = function() {
        var self = this;
        
        this.$target.find("[data-bind]").each(function(i, element) {
            var bind = this.dataset.bind;
            var attribute = bind.substring(0, bind.lastIndexOf(","));
            var value = self.model.get(attribute);
            var event = "change:" + attribute;
            var handler = function(value) {
                self.set(element, value);
            };
            
            self.model.on(event, handler);

            if (!self._observers[event]) {
                self._observers[event] = [];
            }
            
            self._observers[event].push(handler);
        });
    };

    Base.prototype.unobserve = function() {
        for (var key in this._observers) {
            var handlers = this._observers[key];
            for (var i = 0; i < handlers.length; i += 1) {
                this.off(key, handlers[i]);
            }
        }

        this._observers = {};
    };

    // Attaches handlers declared within this.handlers referenced to the controller. Can accept handlers that are
    // literal functions but I think this should be removed once the controller class is made as the view shouldn't
    // contain any logic that a controller would have.
    Base.prototype.attachHandlers = function() {
        for (var key in this.handlers) {
            var handler = this.handlers[key];
            var parts = key.split(" -> ");
            
            this.$target.on(parts[0], parts[1], (typeof handler === "function") ? handler : this.controller[handler].bind(this.controller));
        }
    };
    
    // Remove event handlers from the DOM elements (view -> controller).
    Base.prototype.detachHandlers = function() {
        for (var key in this.handlers) {
            var handler = this.handlers[key];
            var parts = key.split(" -> ");
            
            this.$target.off(parts[0], parts[1], (typeof handler === "function") ? handler : this.controller[handler].bind(this.controller));
        }
    };

    Base.prototype.setTarget = function(element, init) {
        if (!init) {
            this.unbind();
            this.unobserve();
            this.dettachHandlers();
        }
        
        var $target = $(element);

        // If the target already exists, assign a cached version to $target else create an element from scratch.
        this.$target = $target.length ? $target : $("<" + this.tag + "/>", this.attributes);

        this.bind();
        this.attachHandlers();
    };
    
    // This function allows extending of a view schema
    Base.extend = function(opts) {
        if (typeof opts === "function") {
            opts = opts();
        }
        
        opts = (opts || {});
        
        var self = this;
        var defaults = {
            init: $.noop,
            tag: "div",
            target: "body",
            handlers: {},
            attributes: {}
        };
        var init = (opts.init || defaults.init);
        var View = function() {
            self.apply(this, arguments);
            init();
        };
        
        View.prototype = Object.create(self.prototype);
        View.prototype.constructor = View;        

        for (var key in defaults) {
            View.prototype[key] = View.prototype[key] || defaults[key];
        }
        
        for (var k in opts) {
            var property = View.prototype[k];
            var value = opts[k];
            
            if (typeof value === "object") {
                View.prototype[k] = property ? $.extend({}, property, value) : value;
            } else {
                View.prototype[k] = (value || property);
            }
        }      
        
        View.extend = Base.extend.bind(View);
        
        return View;
    };

    window.Ambient.View = Base;
    
})();
