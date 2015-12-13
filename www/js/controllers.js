angular.module('flosi.controllers',
  [
    "firebase",
    "flosi.services",
    "ngCordova"
  ])


  .controller('loginCtrl', function ($scope, auth, $state) {

    $scope.badLogin;
    $scope.submitLogin = function(form){
      auth.signInUser(form).then(function (success) {
        if(success) auth.updateLocalProfile(function(updated){
          if (updated)
            $state.go('tab.dash');
          else
            $scope.badLogin = 'User was not found';
        });
      });
    };

    $scope.registerUser = function(form) {
      auth.registerUser(form).then(function(success){
        if (success) $scope.submitLogin(form);

        else {
          $scope.badLogin = 'There was a problem sorry!'
        }
      })
    };

    $scope.goSignUp = function() {
      $state.go('signup');
    };

  })

.controller('DashCtrl', function($scope, auth, $cordovaCamera, $ionicModal, $state) {

    $scope.$on('$ionicView.enter', function(e) {
      $scope.user = auth;
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
      /*
      * create a challengeObj
      *   n1
      *   n2
      *   winner
      *   status
      *     open
      *     accepted
      *     closed
      *     rejected
      *
      * update users with their new challengeIds
      *
      * */

      var challengeObj = {
        challengeId : $scope.user.challengeInvite.challengeId,
        name1 : $scope.user.name,
        uid1 : $scope.user.uid,
        name2 : $scope.user.challengeInvite.name,
        uid2 : $scope.user.challengeInvite.uid,
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

.controller('AccountCtrl', function($scope) {
  $scope.settings = {
    enableFriends: true
  };
});
