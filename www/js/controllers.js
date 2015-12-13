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
        } else{
          $scope.badLogin = 'User was not found';
          $rootScope.hide();
        }
      });
    };

    $scope.registerUser = function(form) {
      $rootScope.show();
      auth.registerUser(form).then(function(success){
        if (success) $scope.submitLogin(form);

        else {
          $scope.badLogin = 'There was a problem sorry!'
          $rootScope.hide();
        }
      })
    };

    $scope.goSignUp = function() {
      $state.go('signup');
    };

  })

.controller('DashCtrl', function($rootScope, $scope, auth, $cordovaCamera, $ionicModal, $state, authData) {
    $scope.$on('$ionicView.enter', function(e) {
      $rootScope.show();
      console.log('checking if local profile exists', auth.profile.name)
     if (!auth.profile.name){
       auth.profileFromFb(authData.uid).then(function(success){
         if (success) {
           $scope.user = auth.profile;
           console.log('$scope.user', $scope.user);
         }
         else console.log('profileNotPopulated', $scope.user )
       })
     } else {
       $scope.user = auth.profile;
     }
      $rootScope.hide();
    });

    $scope.searchedForUser = false;

    $ionicModal.fromTemplateUrl('templates/modal-invite.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.modal = modal;

    });

    // Triggered in the login modal to close it
    $scope.showModal = function() {
      console.log('show modal');
      $scope.modal.show();
    };

    $scope.hideModal = function () {
      $scope.modal.hide();
    };

    $scope.search = function (name) {
      auth.findUserByName(name, function (err,user) {
        if (err) $scope.searchedForUser = err;
        else {
          $scope.$apply(function () {
            $scope.searchedForUser = user;
            $scope.searchedForUser.challengeId = Date.now();
          });
        }
      });
    };

    $scope.selectChallengeFriend = function (friend) {
      auth.saveChallenge(friend);
      console.log($scope.user);
      $scope.hideModal();
      $state.go('tab.dash-challenge');
    };

    $scope.createChallenge = function (form) {
      var challengeObj = {
        challengeId : $scope.searchedForUser.challengeId,
        name1 : $scope.user.name,
        uid1 : $scope.user.uid,
        name2 : $scope.searchedForUser.name,
        uid2 : $scope.searchedForUser.uid,
        title : form.title,
        days : form.days,
        numPhotos : form.numPhotos,
        bet : form.bet,
        winner : false,
        status: {
          open : true,
          rejected : false,
          accepted : false,
          closed : false
        }
      };

      auth.pushChallengeObj(challengeObj, function(success){
        if (success) $state.go('tab.stream');
      });
    };


    $scope.upload = function() {
      console.log('inside upload function');
      var options = {
        quality : 70,
        destinationType : Camera.DestinationType.DATA_URL,
        sourceType : Camera.PictureSourceType.CAMERA,
        allowEdit : true,
        encodingType: Camera.EncodingType.JPEG,
        popoverOptions: CameraPopoverOptions,
        targetWidth: 500,
        targetHeight: 500,
        saveToPhotoAlbum: false
      };

      try {
        $cordovaCamera.getPicture(options).then(function (imageData) {
          $scope.user.img = "data:image/jpeg;base64,"+imageData;
          auth.updateProfileImg(); //persist to fb
        }, function (error) {
          console.error(error);
        });
      } catch (err){
        throw " fatal error camera crashed unavailable";
      }
    }
  })


  .controller('StreamCtrl', function($scope, auth, $state, $cordovaCamera, $firebaseArray) {
    $scope.$on('$ionicView.enter', function(e) {
      $scope.streamInfo = auth.currentChallenge;
      $scope.userInfo = auth;
      $scope.images = [];
    });

    console.log(auth);
    console.log($scope.streamInfo);
    var fb = new Firebase("https://flosi.firebaseio.com/challenges");
    var userReference = fb.child(String(auth.challenges));
    var syncArray = $firebaseArray(userReference.child("images"));
    $scope.images = syncArray;

    $scope.upload = function() {
      var options = {
        quality : 75,
        destinationType : Camera.DestinationType.DATA_URL,
        sourceType : Camera.PictureSourceType.CAMERA,
        allowEdit : true,
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
      } catch (err){
        throw " fatal error camera crashed unavailable";
      }
    }

  })

.controller('ChatsCtrl', function($scope, Chats) {
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //

  //$scope.$on('$ionicView.enter', function(e) {
  //
  //});

  $scope.chats = Chats.all();
  $scope.remove = function(chat) {
    Chats.remove(chat);
  };
})

.controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
  $scope.chat = Chats.get($stateParams.chatId);
})

.controller('AccountCtrl', function($rootScope, $scope, fbAuth, $state, auth) {
  $scope.logout = function (){
    $rootScope.show();
    fbAuth.$unauth();
    auth.profile = {};
    auth.tokExpires = false;
    setTimeout(function(){
      $rootScope.hide()
      $state.go('login');

    }, 1000)

  }
});
