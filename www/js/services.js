/*
* Models for Data in Firebase
*
* USER Model
*
* */

angular.module('flosi.services', ["firebase" ])

.factory('auth', function($q) {

    var o = {

      name: false,
      email: false,
      img: "../img/empty-profile.png",
      uid: false,
      expires: false,
      challengeInvite: false,
      challenges : false
    };
    //console.log(o);
    var ref = new Firebase("https://flosi.firebaseio.com");

    o.registerUser = function(user){
      var defer = $q.defer();
      ref.createUser(user, function(error, userData) {
        if (error) {
          console.log("Error creating user:", error);
          defer.resolve(false);
        } else {
          console.log("Successfully created user account with uid:", userData.uid);
          defer.resolve(true);

          //save user data to fb
          ref.child('users/' + userData.uid).set({
            name: user.name,
            email: user.email,
            img: o.img,
            uid: userData.uid
          });
          //save locally
          o.name = user.name;
          o.email = user.email;
          o.uid =  userData.uid;
        }
      });
      return defer.promise;
    };

    o.signInUser = function(user){
      var defer = $q.defer();

      ref.authWithPassword(user, function(error, authData) {
        if (error) {
          console.log("Login Failed!", error);
          defer.resolve(false);
        } else {
          console.log("Authenticated successfully with payload:", authData);
          //save new token & expiration
          o.tokExpires = authData.expires;
          o.uid = authData.uid;
          defer.resolve(true);


        }
      });
      return defer.promise;
    };

    o.updateLocalProfile = function (cb) {
      //update local data with user data from fb
      ref.child('users/'+ o.uid).once("value", function(data) {

        var uData = data.val();
        console.log(uData);
        o.name = uData.name;
        o.email = uData.email;
        o.img = uData.img;
        o.uid = uData.uid;
        console.log('user object ', o);
        cb(true);
      });
    };

    o.saveChallenge = function(invite){
      o.challengeInvite = invite;
    };


    o.updateProfileImg = function(){
      ref.child('users/' + o.uid).update({
        img: o.img
      });
    };

    //returns all user and looks for match
    //then calls cb with user or with error
    o.findUserByName = function (name, cb) {
      console.log('name: '+name);
      var err = true;
      ref.child('users')
        .once('value', function (snap) {
          snap.forEach(function(data){
            var user = data.val();
            if (user.name == name){
              cb(false, user);
              err = false;
              return;
            }
          });
          if (err) {
            console.log('Error Finding User Calling Callback');
            cb('User Not Found', user);
          }
        });
    };

    o.pushChallengeObj = function (challenge, cb) {
      ref.child('challenges/' + challenge.challengeId).set(challenge);
      ref.child('users/' + challenge.uid1 + '/challenges').set(challenge.challengeId);
      ref.child('users/' + challenge.uid2 + '/challenges').set(challenge.challengeId);

      //locally add challengeId
      o.challenges = challenge.challengeId;
      o.currentChallenge = challenge;
      cb(true);
    };

    o.getChallengeObjById = function () {
      ref.child('challenges/' + o.challengeId).once('value', function(snap){
        return snap.val();
      });
    };


    return o;
  })

.factory('Chats', function() {
  // Might use a resource here that returns a JSON array

  // Some fake testing data
  var chats = [{
    id: 0,
    name: 'Ben Sparrow',
    lastText: 'You on your way?',
    face: 'img/ben.png'
  }, {
    id: 1,
    name: 'Max Lynx',
    lastText: 'Hey, it\'s me',
    face: 'img/max.png'
  }, {
    id: 2,
    name: 'Adam Bradleyson',
    lastText: 'I should buy a boat',
    face: 'img/adam.jpg'
  }, {
    id: 3,
    name: 'Perry Governor',
    lastText: 'Look at my mukluks!',
    face: 'img/perry.png'
  }, {
    id: 4,
    name: 'Mike Harrington',
    lastText: 'This is wicked good ice cream.',
    face: 'img/mike.png'
  }];

  return {
    all: function() {
      return chats;
    },
    remove: function(chat) {
      chats.splice(chats.indexOf(chat), 1);
    },
    get: function(chatId) {
      for (var i = 0; i < chats.length; i++) {
        if (chats[i].id === parseInt(chatId)) {
          return chats[i];
        }
      }
      return null;
    }
  };
});
