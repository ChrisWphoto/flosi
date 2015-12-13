/*
 * Models for Data in Firebase
 *
 * USER Model
 *
 * */

angular.module('flosi.services', ["firebase"])

  .factory('fbAuth', function($firebaseAuth) {
    var ref = new Firebase("https://flosi.firebaseio.com");
    return $firebaseAuth(ref);
    })


  .factory('auth', function ($q) {

    var o = {
      //profile will be synced to firebase
      profile: {
        name: false,
        email: false,
        img: "../img/empty-profile.png",
        uid: false,
        challenges: [1] //default value so that fb will store it as an array
      },

      tokExpires: false,
      challengeInvite: false
    };
    //console.log(o);
    var ref = new Firebase("https://flosi.firebaseio.com");

    o.registerUser = function (user) {
      var defer = $q.defer();
      ref.createUser(user, function (error, userData) {
        if (error) {
          console.log("Error creating user:", error);
          defer.resolve(false);
        } else {
          console.log("created user: ", userData.uid);
          defer.resolve(true);
          //save locally
          console.log(o.profile);
          o.profile.name = user.name;
          o.profile.email = user.email;
          o.profile.uid = userData.uid;

          //save user data to fb
          ref.child('users/' + userData.uid).set(o.profile);
          console.log('saving new user to fb', o.profile);
        }
      });
      return defer.promise;
    };

    o.signInUser = function (user) {
      var defer = $q.defer();
      ref.authWithPassword(user, function (error, authData) {
        if (error) {
          console.log("Login Failed!", error);
          defer.resolve(false);
        } else {
          console.log("Authenticated:", authData);
          //save new token & expiration
          o.profile.uid = authData.uid;
          o.tokExpires = authData.expires;
          defer.resolve(authData);
        }
      });
      return defer.promise;
    };

    o.profileFromFb = function (id) {
      var defer = $q.defer();
      ref.child('users/' + id).once("value", function (data) {
        var profile = data.val();
        if (!profile) {
          console.log('profileFromFb is null');
          defer.reject('profileFromFb is null')
        } else {
          o.profile = profile;
          console.log('getProfile', o.profile);
          defer.resolve(true);
        }
      });
      return defer.promise;
    }

    o.saveChallenge = function (invite) {
      o.challengeInvite = invite;
    };


    o.updateProfileImg = function () {
      ref.child('users/' + o.profile.uid).update( {img: o.profile.img} );
    };

    //returns all user and looks for match
    //then calls cb with user or with error
    o.findUserByName = function (name, cb) {
      console.log('name: ' + name);
      var err = true;
      ref.child('users')
        .once('value', function (snap) {
          snap.forEach(function (data) {
            var user = data.val();
            if (user.name == name) {
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

    o.pushChallengeObj = function (challenge, friend, cb) {
      //local push challengeID
      o.profile.challenges.push(challenge.challengeId);
      //remote push challengeID
      console.log(o.profile.challenges);
      ref.child('users/' + challenge.uid1 + '/challenges').set(o.profile.challenges);

      o.currentChallenge = challenge;

      //remote add new challenge
      ref.child('challenges/' + challenge.challengeId).set(challenge);
      //remote add challengeId to friends profile
      ref.child('users/' + challenge.uid2 + '/challenges').set(friend.challenges);
      cb(true);
    };

    o.getChallengeObjById = function () {
      ref.child('challenges/' + o.challengeId).once('value', function (snap) {
        return snap.val();
      });
    };


    return o;
  })

  .factory('Chats', function () {
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
      all: function () {
        return chats;
      },
      remove: function (chat) {
        chats.splice(chats.indexOf(chat), 1);
      },
      get: function (chatId) {
        for (var i = 0; i < chats.length; i++) {
          if (chats[i].id === parseInt(chatId)) {
            return chats[i];
          }
        }
        return null;
      }
    };
  });
