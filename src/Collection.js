(function() {

    // TODO: Allow sorting of models.

    function Base(models) {
        models = (models || []);

        this._handlers = {};
        this.models = [];
        this.events = new Ambient.Events();
        this.id = Ambient.getID();
        
        models.forEach(this.add.bind(this));
    }

    Base.prototype.emit = function() {
        this.events.emit.apply(this.events, arguments);
    };

    Base.prototype.on = function() {
        this.events.on.apply(this.events, arguments);
    };

    Base.prototype.off = function() {
        this.events.off.apply(this.events, arguments);
    };

    // Adding a second parameter allows inserting rather than pushing on the end.
    Base.prototype.add = function(model, index) {
        model = (model instanceof this.model) ? model : new this.model(model);

        var self = this;
        var handlers = this._handlers;

        if (index) {
            this.models.splice(index, 0, model);
        } else {
            this.models.push(model);
        }

        if (!this._handlers[model.id]) {
            this._handlers[model.id] = {};
        }

        // Track the attached handlers for if the model is removed from the collection.
        function attachHandler(event, handler) {
            handlers[model.id][event] = handler;
            model.on(event, handler);
        }

        attachHandler("change", this.emit.bind(this, "change", model));
        attachHandler("destroy", function() {
            self.emit.call(self, "destroy", model);
            
            var index = -1;
            for (var i = 0; i < self.models.length; i ++) {
                if (self.models[i].id == model.id) {
                    index = i;
                    break;
                }
            }
            
            if (index != -1) {
                // Calling this should emit the remove event.
                self.remove.call(self, index);
            }
        });
        
        this.emit("add", model);
    };

    // Not passing any parameters will essentially make this a pop method.
    Base.prototype.remove = function(index) {
        index = (typeof index === "undefined") ? (this.models.length - 1) : index; 
        var model = this.models[index];

        if (model) {
            this.models.splice(index, 1);
            var events = (this._handlers[model.id] || {});
            
            for (var event in events) {
                var handler = events[event];
                model.off(event, handler);
            }
            
            this.emit("remove", model);
        }

        return model;
    };

    // Add functionality default with arrays.
    ["map", "forEach", "filter", "some", "every"].forEach(function(method) {
        Base.prototype[method] = function() {
            return Array.prototype[method].apply(this.models, arguments);
        };
    });
    
    Base.extend = function(opts) {
        if (typeof opts === "function") {
            opts = opts();
        }
        
        opts = (opts || {});

        var self = this;
        var init = (opts.init || $.noop);
        var Collection = function() {
            self.apply(this, arguments);
            init();
        };
        
        Collection.prototype = Object.create(self.prototype);
        Collection.prototype.constructor = Collection;        
        
        for (var k in opts) {
            var property = Collection.prototype[k];
            var value = opts[k];
            
            if (typeof value === "object") {
                Collection.prototype[k] = property ? $.extend({}, property, value) : value;
            } else {
                Collection.prototype[k] = (value || property);
            }
        }      
        
        Collection.extend = Base.extend.bind(Collection);
        
        return Collection;
    };
    
    window.Ambient.Collection = Base;
    
})();
