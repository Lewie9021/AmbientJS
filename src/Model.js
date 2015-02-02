(function() {
    
    function Base(props) {
        this.attributes = $.extend({}, this.defaults, props);
        this.events = new Ambient.Events();
        this.id = Ambient.getID();

        var attributes = $.extend({}, this.attributes);
        var self = this;
        
        this.reset = function() {
            // This may later require the deep clone parameter.
            return this.attributes = $.extend({}, attributes);
        };
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

    Base.prototype.get = function(prop) {
        return prop ? this.attributes[prop] : this.attributes;
    };

    Base.prototype.set = function(prop, value) {
        if (typeof prop === "string") {
            this.attributes[prop] = value;
            this.events.emit("change:" + prop, value);

            var change = {};
            change[prop] = value;
            this.events.emit("change", change);
        } else {
            for (var k in prop) {
                this.attributes[k] = prop[k];
                this.events.emit("change:" + k, prop[k]);
            }
            this.events.emit("change", prop);
        }
    };

    Base.prototype.del = function(prop) {
        delete this.attributes[prop];
    };

    Base.prototype.size = function() {
        return Object.keys(this.attributes).length;
    };

    Base.prototype.forEach = function(iterator, context) {
        var i = 0;
        for (var prop in this.attributes) {
            var value = this.attributes[prop];
            iterator.call(context || this, value, prop, i);
            i++;
        }
    };

    Base.prototype.clone = function() {
        // And the ID?
        return $.extend(true, {}, this);
    };

    Base.prototype.toJson = function() {
        return $.extend(true, {}, this.attributes);
    };

    Base.prototype.empty = function() {
        return this.attributes = {};
    };

    // This function allows extending of a model schema.
    Base.extend = function(opts) {
        if (typeof opts === "function") {
            opts = opts();
        }

        opts = (opts || {});
        
        var self = this;
        var init = (opts.init || $.noop);
        var defaults = (opts.defaults || {});
        var Model = function() {
            self.apply(this, arguments);
            init();
        };

        Model.prototype = Object.create(self.prototype);
        Model.prototype.constructor = Model;

        Model.prototype.init = init;
        Model.prototype.defaults = Model.prototype.defaults ? $.extend({}, Model.prototype.defaults, defaults) : defaults;
        Model.extend = Base.extend.bind(Model);

        return Model;
    };

    window.Ambient.Model = Base;
    
})();
