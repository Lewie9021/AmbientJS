(function() {
    
    // TODO: Make use of the event class to allow logging.
    
    function Ambient() {
        var id = 1;
        
        this.getID = function() {
            return id++;
        };
    }

    window.Ambient = new Ambient();
    
})();
