Users = new Mongo.Collection("users");
Roles = new Mongo.Collection("roles");

if (Meteor.isClient) {

  Template.body.helpers({
    example: [
      { text: "green"},
      { text: "blue"},
      { text: "purple"}
    ],

    users: function () {
      return Users.find({});
    },

    roles: function () {
      return Roles.find({});
    },

    hideCompleted: function () {
      return Session.get("hideCompleted");
    },

    userCount: function () {
      return Users.find({checked: {$ne: true}}).count();
    },  

    roleCount: function () {
      return Roles.find({checked: {$ne: true}}).count();
    }
  });

  Template.body.events({
    "submit .new-user": function (event) { //on submit
      
      var text = event.target.text.value;
      Users.insert({
        user: text,
        choices: [{"text":"choice", "index":1, "user":text}, {"text":"choice", "index":2, "user":text}, {"text":"choice", "index":3, "user":text}],
        createdAt: new Date() //current time
      });

      event.target.text.value = ""; //clear form

      return false; //prevent default form submit
    },

    "submit .new-role": function (event) { //on submit
      
      var text = event.target.text.value;
      Roles.insert({
        role: text,
        createdAt: new Date() //current time
      });

      event.target.text.value = ""; //clear form

      return false; //prevent default form submit
    },

    "change .hide-completed input": function (event) {
      Session.set("hideCompleted", event.target.checked);
    }

  });

  Template.user.events({
    "click .toggle-checked": function() {
      // set the checked property to the opposite of its current value
      Users.update(this._id, {$set: {checked: ! this.checked}});
    },
    "click .delete": function () {
      Users.remove(this._id);
    }
  });
  Template.role.events({
    "click .toggle-checked": function() {
      // set the checked property to the opposite of its current value
      Roles.update(this._id, {$set: {checked: ! this.checked}});
    },
    "click .delete": function () {
      Roles.remove(this._id);
    }
  });

  Template.dropdownCol.helpers({
    roles: function () {
      return Roles.find({}, {sort: {createdAt: -1}});
    },
  });

  Template.dropdownCol.events({
    'click': function(event){
        var usr = Users.findOne({"user":this.user});
        Session.set({"user": usr});
        Session.set({"choice": this});
    }
  });

  Template.dropdownItem.events({
    'click': function(event){
        var usr = Session.get("user");
        var choice = Session.get("choice");
        choice.text = this.role; //set the role
        usr.choices[choice.index - 1] = choice;
        Users.update(usr._id, {$set: {choices: usr.choices}});
    }
  });

  Template.solutions.helpers({
    results: function() {
      var users = Users.find().fetch();
      var roles = Roles.find().fetch();
      var solutions = [];
      //assign everyone their first pick. 
      //Randomly pick one to assign to second pick until it fits

      for (var i = 0; i < users.length; i++){
        solutions.push({"user" : users[i] , "role" : users[i].choices[0].text , "choice" : 1});
      }

      var depth = 0;

      console.log(lodash.uniq(lodash.pluck(solutions, "role")).length);
      console.log(roles.length);

      //until all roles have been assigned or all users have been moved
      while (lodash.uniq(lodash.pluck(solutions, "role")).length < roles.length && depth < 20){
        depth++;


        //find a user who shares a role with another user 

        var index = 2;

        findMatchBlock: {
          for (var i = 0; i < solutions.length; i++){
            for (var j = i+1; j < solutions.length; j++){
              // console.log(solutions[i].role , solutions[j].role);
              if (solutions[i].role == solutions[j].role){
                //TODO: if choice is more than 3, raise an error
                if (solutions[i].choice > solutions[j].choice){
                  index = i;
                } else {
                  index = j;
                }
                break findMatchBlock; 
              }
            }
          }
        }

        // console.log(index);
        //move them to their next choice
        console.log("MOVING ", solutions[index].user.user, " FROM ", 
          solutions[index].user.choices[solutions[index].choice-1].text, " TO ", 
          solutions[index].user.choices[solutions[index].choice].text );
        var newChoice = solutions[index].user.choices[solutions[index].choice];
        solutions[index].role = newChoice.text;
        solutions[index].choice++;
        console.log(solutions);

      }

      return solutions;

    }
  });

  Template.dropdownCol.rendered = function(){
    $('.menu').dropdown(); //gets called N times
  }; 
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
