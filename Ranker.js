Users = new Mongo.Collection("users");
Roles = new Mongo.Collection("roles");

if (Meteor.isClient) {

  var DEPTH = 3;
  var bestScore = 10000;
  var bestSolution = [];
  
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

      for (var i = 0; i < users.length; i++){
        solutions.push({"user" : users[i] , "role" : users[i].choices[0].text , "choice" : 1});
      }

      bestScore = 1000;
      bestSolution = [];
      recursiveResults(solutions, roles, 0);
      console.log("SOLUTION",bestSolution);
      return bestSolution;
    },
  });

  recursiveResults = function (solutions, roles, depth) {
    
    if (depth > DEPTH || scoring(solutions) > bestScore){
      return;
    }
    
    if (lodash.uniq(lodash.pluck(solutions, "role")).length == roles.length){
      bestScore = scoring(solutions);
      bestSolution = solutions;
      return;
    } 

    for (var index = 0; index < solutions.length; index++){
      if (solutions[index].choice < 3){
      var solutionsCopy = $.extend(true, [], solutions); //clone
      moveRank(solutionsCopy, index);
      recursiveResults(solutionsCopy, roles, depth+1);
      } 
    }
  }

  moveRank = function (solutions, index){
    var newChoice = solutions[index].user.choices[solutions[index].choice];
    solutions[index].role = newChoice.text;
    solutions[index].choice++;
    return solutions;
  };

  scoring = function (solutions){
    if (!solutions){
      return bestScore + 1;
    }

    var score = 0;
    for (var i = 0; i < solutions.length; i++){ 
      score += Math.pow((solutions[i].choice - 1),2);
    }
    return score;
  }

  Template.dropdownCol.rendered = function(){
    $('.menu').dropdown(); //gets called N times
  }; 
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
