(function() {

    function Events() {
        this._events = {};
    }
    
    Events.prototype.emit = function(event, data) {
        var subs = this._events[event];
        
        if (subs && subs.length) {
            subs.forEach(function(handler) {
                handler(data);
            });
        }
    };

    Events.prototype.on = function(event, handler) {
        if (!this._events[event]) {
            this._events[event] = [];
        }

        this._events[event].push(handler);
    };

    Events.prototype.off = function(event, handler) {
        if (!this._events[event]) {
            return;
        }

        if (handler) {
            var events = this._events[event];
            
            for (var i = (events.length - 1); i >= 0; i--) {
                if (events[i] === handler) {
                    events.splice(i, 1);
                }
            }
        } else {
            delete this._events[event];
        }
    };

    window.Ambient.Events = Events;
    
})();
