(function() {

    var Person = Ambient.Model.extend({
        defaults: {
            forename: "John",
            surname: "Smith",
            age: 20
        }
    });

    var PersonController = Ambient.Controller.extend({
        onClick: function() {
            alert(JSON.stringify(this.model.get()));
        }
    });
    
    var PersonView = Ambient.View.extend({
        target: "#test-content",
        controller: PersonController,
        template: (function() {
            return $("#test-template").html();
        })(),
        handlers: {
            "click -> button": "onClick"
        },
        init: function() {
            console.log("Init function!");
        },
        render: function() {
            this.$target.html(this.template);
            this.populate();
            this.observe();
        }
    });

    // --------------------------------------------------------------- \\

    var person = new Person({
        forename: "Lewis",
        surname: "Barnes"
    });

    var personView = new PersonView({
        model: person
    });

    person.on("change", function(properties) {
        console.log("changed:", properties);
    });

    person.on("change:forename", function(value) {
        console.log("forename changed:", value);
    });

    personView.render();

})();
