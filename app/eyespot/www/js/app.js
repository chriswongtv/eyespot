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

.controller('AppCtrl', function($scope, $interval, $http, $ionicPlatform, $cordovaDeviceMotion, $ionicModal) {
  $scope.liveImg = '';
  $scope.beginBtn = true;
  var accOption = { frequency: 500 };
  var x = 0;
  var y = 0;
  var z = 0;
  var target = '';

  $ionicModal.fromTemplateUrl('welcome.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
  });
  $scope.openModal = function() {
    $scope.modal.show();
  };
  $scope.closeModal = function() {
    $scope.modal.hide();
  };
  $scope.$on('$destroy', function() {
    $scope.modal.remove();
  });

  ionic.Platform.ready(function() {
    $scope.openModal();
  });

  $scope.launchCamera = function() {
    $scope.modal.hide();
    $scope.status = '';
    $scope.beginBtn = false;
    $scope.cameraPlus = cordova.plugins.CameraPlus;
    $scope.cameraPlus.startCamera(function() {
      var watch = $cordovaDeviceMotion.watchAcceleration(accOption);
      watch.then(
        null,
        function(error) {
          console.log(error);
        },
        function(result) {
          $scope.status = '';
          var dx = Math.abs(result.x - x);
          var dy = Math.abs(result.y - y);
          var dz = Math.abs(result.z - z);
          x = result.x;
          y = result.y;
          z = result.z;
          if (dx < 0.2 && dy < 0.2 && dz < 0.3) {
            $interval(function() {
              $scope.cameraPlus.getJpegImage(function(imgData) {
                var imgurOptions = {
                  "method": "POST",
                  "url": "https://api.imgur.com/3/image",
                  "headers": {
                    "Authorization": "Bearer ac1920b5b8ebbe3dfbc45afc1a8fc9e949dd0c3a"
                  },
                  "data": { "image": imgData, "album": "OvQIN", "type": "base64" }
                };

                $http(imgurOptions).then(function(res) {
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

                      var ocrConfig = {
                        "method": "POST",
                        "url": "https://api.projectoxford.ai/vision/v1.0/ocr",
                        "headers": {
                          "ocp-apim-subscription-key": "81cf1aad8ad340c3b90a48dee5c81ab3",
                          "content-type": "application/json"
                        },
                        "data": { "url": imgLink }
                      }

                      $http(ocrConfig).then(function(res) {
                        var text = '';
                        res.data.regions.forEach(function(val) {
                          val.lines.forEach(function(val2) {
                            val2.words.forEach(function(val3) {
                              text += (val3.text + ' ');
                              console.log(val3);
                              console.log(val3.text);
                              console.log(target);
                              if (val3.text.toLowerCase() === 'hacks' && target === 'venue') {
                                TTS.speak('We are currently at LA Hacks!', function() {
                                  console.log('speech success');
                                  $scope.status = 'Venue detected!';
                                }, function(err) {
                                  console.log(err);
                                })
                                target = '';
                              } else if (val3.text.toLowerCase() === 'locker' && target === 'venue') {
                                TTS.speak('We are currently at Locker Room 2!', function() {
                                  console.log('speech success');
                                  $scope.status = 'Venue detected!';
                                }, function(err) {
                                  console.log(err);
                                })
                                target = '';
                              } else if (val3.text.toLowerCase() === 'recyclables' && target === 'garbage') {
                                TTS.speak('There is a garbage can in front of you!', function() {
                                  console.log('speech success');
                                  $scope.status = 'Venue detected!';
                                }, function(err) {
                                  console.log(err);
                                })
                                target = '';
                              } else if (val3.text.toLowerCase() === 'compostables' && target === 'garbage') {
                                TTS.speak('There is a garbage can in front of you!', function() {
                                  console.log('speech success');
                                  $scope.status = 'Venue detected!';
                                }, function(err) {
                                  console.log(err);
                                })
                                target = '';
                              }
                            })
                          })
                        })
                      }, function(err) {
                        console.log(err);
                      });
                    } else {
                      console.log(res);
                    }
                  }, function(err) {
                    var ocrConfig = {
                        "method": "POST",
                        "url": "https://api.projectoxford.ai/vision/v1.0/ocr",
                        "headers": {
                          "ocp-apim-subscription-key": "81cf1aad8ad340c3b90a48dee5c81ab3",
                          "content-type": "application/json"
                        },
                        "data": { "url": imgLink }
                      }

                      $http(ocrConfig).then(function(res) {
                        var text = '';
                        res.data.regions.forEach(function(val) {
                          val.lines.forEach(function(val2) {
                            val2.words.forEach(function(val3) {
                              text += (val3.text + ' ');
                              console.log(val3);
                              console.log(val3.text);
                              console.log(target);
                              if (val3.text.toLowerCase() === 'hacks' && target === 'venue') {
                                TTS.speak('We are currently at LA Hacks!', function() {
                                  console.log('speech success');
                                  $scope.status = 'Venue detected!';
                                }, function(err) {
                                  console.log(err);
                                })
                                target = '';
                              } else if (val3.text.toLowerCase() === 'locker' && target === 'venue') {
                                TTS.speak('We are currently at Locker Room 2!', function() {
                                  console.log('speech success');
                                  $scope.status = 'Venue detected!';
                                }, function(err) {
                                  console.log(err);
                                })
                                target = '';
                              } else if (val3.text.toLowerCase() === 'recyclables' && target === 'garbage') {
                                TTS.speak('There is a garbage can in front of you!', function() {
                                  console.log('speech success');
                                  $scope.status = 'Venue detected!';
                                }, function(err) {
                                  console.log(err);
                                })
                                target = '';
                              } else if (val3.text.toLowerCase() === 'compostables' && target === 'garbage') {
                                TTS.speak('There is a garbage can in front of you!', function() {
                                  console.log('speech success');
                                  $scope.status = 'Venue detected!';
                                }, function(err) {
                                  console.log(err);
                                })
                                target = '';
                              }
                            })
                          })
                        })
                      }, function(err) {
                        console.log(err);
                      });
                    console.log(err);
                  })
                }, function(err) {
                  console.log(err);
                });
              }, function() {
                console.log("error");
              });
            }, 1000)
          }
        });
      });

      $interval(function() {
        $scope.cameraPlus.getJpegImage(function(imgData) {
          $scope.liveImg = 'data:image/jpeg;base64, ' + imgData;
        }, function() {
          console.log("error");
        });
      }, 500);
  }
      
  $scope.record = function() {
    $scope.recognizedText = "";
    var recognition = new SpeechRecognition();
    
    recognition.onresult = function(event) {
        if (event.results.length > 0) {
            $scope.recognizedText = event.results[0][0].transcript;
            console.log($scope.recognizedText);
            var input = $scope.recognizedText.toLowerCase();
            if (input.indexOf('bathroom') !== -1 || input.indexOf('restroom') !== -1) {
              target = 'restroom';
              TTS.speak('I will look for a restroom.', function() {
                console.log('speech success');
              }, function(err) {
                console.log(err);
              })
            }
            else if (input.indexOf('rubbish') !== -1 || input.indexOf('trash') !== -1 || input.indexOf('garbage') !== -1 || input.indexOf('can') !== -1) {
              target = 'garbage';
              TTS.speak('I will look for a garbage can.', function() {
                console.log('speech success');
              }, function(err) {
                console.log(err);
              })
            }
            else if (input.indexOf('where am i') !== -1) {
              target = 'venue';
              TTS.speak('I will try to find out where we are.', function() {
                console.log('speech success');
              }, function(err) {
                console.log(err);
              })
            }
            else {
              TTS.speak('Sorry, I don\'t understand.', function() {
                console.log('speech success');
              }, function(err) {
                console.log(err);
              })
            }

            $scope.$apply();
        }
    };
    
    recognition.start();
  };
});