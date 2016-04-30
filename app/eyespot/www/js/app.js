angular.module('eyespot', ['ionic', 'ngCordova'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

      // Don't remove this line unless you know what you are doing. It stops the viewport
      // from snapping when text inputs are focused. Ionic handles this internally for
      // a much nicer keyboard experience.
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})

.controller('AppCtrl', function($scope, $interval, $http, $ionicPopup, $ionicPlatform) {
  $scope.liveImg = '';
  $scope.beginBtn = true;

  $scope.launchCamera = function() {
    $scope.beginBtn = false;
    $scope.cameraPlus = cordova.plugins.CameraPlus;
    $scope.cameraPlus.startCamera(function() {
      $interval(function() {
        $scope.cameraPlus.getJpegImage(function(imgData) {
          $scope.liveImg = 'data:image/jpeg;base64, ' + imgData;
        }, function() {
          console.log("error");
        });
      }, 500);

      $interval(function() {
        $scope.cameraPlus.getJpegImage(function(imgData) {
          var options = {
            "method": "POST",
            "url": "https://api.imgur.com/3/image",
            "headers": {
              "Authorization": "Bearer ac1920b5b8ebbe3dfbc45afc1a8fc9e949dd0c3a"
            },
            "data": { "image": imgData, "album": "OvQIN", "type": "base64" }
          };

          $http(options).then(function(res) {
            var imgLink = res.data.data.link;
            console.log(imgLink);

            var detectConfig = {
              "method": "POST",
              "url": "https://api.projectoxford.ai/face/v1.0/detect",
              "headers": {
                "Ocp-Apim-Subscription-Key": "90d05fedd28846839d4f6d66c28e091d",
                "Content-Type": "application/json"
              },
              "data": { "url": imgLink }
            };

            $http(detectConfig).then(function(res) {
              if (res.data !== []) {
                res.data.forEach(function(val) {
                  var faceId = val.faceId;

                  var identifyConfig = {
                    "method": "POST",
                    "url": "https://api.projectoxford.ai/face/v1.0/identify",
                    "headers": {
                      "content-type": "application/json",
                      "ocp-apim-subscription-key": "90d05fedd28846839d4f6d66c28e091d"
                    },
                    "data": { 
                      "personGroupId": "eyespot",
                      "faceIds":[ faceId ],
                      "maxNumOfCandidatesReturned": 1
                    }
                  };

                  $http(identifyConfig).then(function(res) {
                    console.log(res);

                    if (res.data[0].candidates !== []) {
                      var personId = res.data[0].candidates[0].personId;

                      var personConfig = {
                        "method": "GET",
                        "url": "https://api.projectoxford.ai/face/v1.0/persongroups/eyespot/persons/" + personId,
                        "headers": {
                          "ocp-apim-subscription-key": "90d05fedd28846839d4f6d66c28e091d"
                        }
                      };

                      $http(personConfig).then(function(res) {
                        var name = res.data.name;

                        TTS.speak(name + ' is in front of you!', function() {
                          console.log('speech success');
                        }, function(err) {
                          console.log(err);
                        })
                      }, function(err) {
                        console.log(err);
                      });
                    }
                  }, function(err) {
                    console.log(err);
                  });
                });
              } else {
                console.log(res);
              }
            }, function(err) {
              console.log(err);
            })
          }, function(err) {
            console.log(err);
          });
        }, function() {
          console.log("error");
        });
      }, 3000);
    }, function() {
      console.log("error");
    });
  }

  $scope.record = function() {
    navigator.device.capture.captureAudio(function(e) {
      var soundPath = e[0].fullPath;
    }, function(err) {
      console.log(err);
    }, { duration: 4 });
  }
});