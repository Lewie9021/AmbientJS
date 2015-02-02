(function() {
    
    function Base(props) {
        this.id = Ambient.getID();
        
        $.extend(this, props || {});
    }

    Base.extend = function(methods) {
        if (typeof methods === "function") {
            methods = methods();
        }
        
        methods = (methods || {});
        
        var self = this;
        var Controller = function() {
            self.apply(this, arguments);
        };
        
        Controller.prototype = Object.create(self.prototype);
        Controller.prototype.constructor = Controller;        
       
        for (var key in methods) {
            Controller.prototype[key] = methods[key];
        }      
        
        Controller.extend = Base.extend.bind(Controller);
        
        return Controller;
    };

    window.Ambient.Controller = Base;
    
})();
