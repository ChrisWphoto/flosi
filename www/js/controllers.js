angular.module('flosi.controllers',
  [
    "firebase",
    "flosi.services",
    "ngCordova"
  ])


  .controller('loginCtrl', function ($rootScope, $scope, auth, $state) {



    $scope.submitLogin = function (form) {
      $rootScope.show();
      $scope.badLogin;
      auth.signInUser(form).then(function (authData) {
        if (authData) {
          auth.profileFromFb(authData.uid)
            .then(function (updated) {
              if (updated)
                $state.go('tab.dash');
              else {
                $rootScope.hide();
              }
            })
        } else {
          $scope.badLogin = 'User was not found';
          $rootScope.hide();
        }
      });
    };

    $scope.registerUser = function (form) {
      $rootScope.show();
      auth.registerUser(form).then(function (success) {
        if (success) $scope.submitLogin(form);

        else {
          $scope.badLogin = 'There was a problem sorry!'
          $rootScope.hide();
        }
      })
    };

    $scope.goSignUp = function () {
      $state.go('signup');
    };

  })

  .controller('DashCtrl', function ($rootScope, $scope, auth, $cordovaCamera, $ionicModal, $state, authData) {

    //todo resolve profile obj BEFORE I get here

    $scope.$on('$ionicView.enter', function (e) {
      $rootScope.hide();
      console.log('resolve auth data', authData);
      $scope.user = auth.profile;
      console.log($scope.user)

      auth.fbRef.child('users/' + $scope.user.uid + '/challenges').once('value', function(snap){
        $scope.chalArray = snap.val();
        //git rid of dummy first element in challenges array
        auth.profile.challenges = $scope.chalArray;
        //$scope.chalArray.splice(0,1);
      });
    });


    $ionicModal.fromTemplateUrl('templates/modal-invite.html', {
      scope: $scope
    }).then(function (modal) {
      $scope.modal = modal;
    });
    // Triggered in the login modal to close it
    $scope.showModal = function () {
      console.log('show modal');
      $scope.modal.show();
    };
    $scope.hideModal = function () {
      $scope.modal.hide();
    };


    //$scope.searchedForUser = false;

    $scope.search = function (name) {
      $scope.searchErr = false;
      $rootScope.show();
      auth.findUserByName(name, function (err, user) {
        if (err) {
          $scope.searchErr = "User Not Found";
          $rootScope.hide();
        }
        else {
          $scope.$apply(function () {
            $rootScope.hide();
            $scope.searchedForUser = user;
            $scope.searchedForUser.challenges.push(Date.now());
            console.log('searchedForUser', $scope.searchedForUser);
          });
        }
      });
    };

    $scope.selectChallengeFriend = function (friend) {
      auth.saveChallenge(friend);
      $scope.hideModal();
      $state.go('tab.dash-challenge');
    };


    $scope.upload = function () {
      console.log('inside upload function');
      var options = {
        quality: 70,
        destinationType: Camera.DestinationType.DATA_URL,
        sourceType: Camera.PictureSourceType.CAMERA,
        allowEdit: true,
        encodingType: Camera.EncodingType.JPEG,
        popoverOptions: CameraPopoverOptions,
        targetWidth: 500,
        targetHeight: 500,
        saveToPhotoAlbum: false
      };

      try {
        $cordovaCamera.getPicture(options).then(function (imageData) {
          $scope.user.img = "data:image/jpeg;base64," + imageData;
          auth.updateProfileImg(); //persist to fb
        }, function (error) {
          console.error(error);
        });
      } catch (err) {
        throw " fatal error camera crashed unavailable";
      }
    }

    $scope.goChallenge = function (chalId) {
      console.log('going to challenge', chalId);
      $state.go('tab.stream', { challengeId: chalId} );
    }

  })




  .controller('InviteCtrl', function ($scope, auth, $state) {
    $scope.$on('$ionicView.enter', function (e) {
      $scope.friend = auth.challengeInvite;
      $scope.user = auth.profile;

      console.log('friend/user', $scope.friend, $scope.user);
    });


    $scope.createChallenge = function (form) {
      var currentChallengeId = $scope.friend.challenges.length - 1;
      var challengeObj = {
        challengeId: $scope.friend.challenges[currentChallengeId],
        name1: $scope.user.name,
        uid1: $scope.user.uid,
        name2: $scope.friend.name,
        uid2: $scope.friend.uid,
        title: form.title,
        days: form.days,
        numPhotos: form.numPhotos,
        bet: form.bet,
        winner: false,
        status: {
          open: true,
          rejected: false,
          accepted: false,
          closed: false
        }
      };
      console.log(challengeObj);
      auth.pushChallengeObj(challengeObj, $scope.friend, function (success) {
        $state.go('tab.dash');
        //if (success) //pass along challengeId too
        //  $state.go('tab.stream', { challengeId: challengeObj.challengeId} );
      });
    };



  })


  .controller('StreamCtrl', function ($scope, auth, $state, $stateParams, $cordovaCamera, $firebaseArray, Challenge) {
    $scope.$on('$ionicView.enter', function (e) {
      $scope.challenge = Challenge;
      $scope.user = auth.profile;
      $scope.images;

    });

    console.log($scope.challenge);




    var chalRef = auth.fbRef.child('challenges/' + String(Challenge.challengeId));
    var syncArray = $firebaseArray(chalRef.child("images"));
    $scope.images = syncArray;
    $scope.images.$watch(function (event) {
      console.log(event)
    });
    console.log($scope.images);
    $scope.images.$add({image : '/9j/4AAQSkZJRgABAQAASABIAAD/4QBMRXh'});

    $scope.upload = function () {
      var options = {
        quality: 75,
        destinationType: Camera.DestinationType.DATA_URL,
        sourceType: Camera.PictureSourceType.CAMERA,
        allowEdit: true,
        encodingType: Camera.EncodingType.JPEG,
        popoverOptions: CameraPopoverOptions,
        targetWidth: 500,
        targetHeight: 500,
        saveToPhotoAlbum: false
      };

      try {
        $cordovaCamera.getPicture(options).then(function (imageData) {
          syncArray.$add({image: imageData}).then(function () {
            alert("Image has been uploaded");
          });
        }, function (error) {
          console.error(error);
        });
      } catch (err) {
        throw " fatal error camera crashed unavailable";
      }
    }

  })


  .controller('AccountCtrl', function ($rootScope, $scope, fbAuth, $state, auth) {
    $scope.logout = function () {
      $rootScope.show();
      fbAuth.$unauth();

      //reset local data to defualts
      auth.profile = {
        name: false,
        email: false,
        img: "../img/empty-profile.png",
        uid: false,
        challenges: [1] //default value so that fb will store it as an array
      };
      auth.tokExpires = false;
      setTimeout(function () {
        $rootScope.hide();
        $state.go('login');

      }, 500)

    }
  })

  .controller('ChatsCtrl', function ($scope, Chats) {
    // With the new view caching in Ionic, Controllers are only called
    // when they are recreated or on app start, instead of every page change.
    // To listen for when this page is active (for example, to refresh data),
    // listen for the $ionicView.enter event:
    //

    //$scope.$on('$ionicView.enter', function(e) {
    //
    //});

    $scope.chats = Chats.all();
    $scope.remove = function (chat) {
      Chats.remove(chat);
    };
  })
  .controller('ChatDetailCtrl', function ($scope, $stateParams, Chats) {
    $scope.chat = Chats.get($stateParams.chatId);
  })
