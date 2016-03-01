angular.module('app', ['btford.socket-io', 'ui.router', 'ngMaterial', 'ngAnimate', 'ngMdIcons'])
    .config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
        $urlRouterProvider.otherwise('/home');

        $stateProvider.state('home', {
            url: '/home',
            controller: "MainCtrl",
            templateUrl: "partials/home.html"
        })


    }])
    .constant('baseurl', "http://localhost:2015")
    .directive('ngEnter', function() {
        return function(scope, element, attrs) {
            element.bind("keydown keypress", function(event) {
                if (event.which === 13) {
                    scope.$apply(function() {
                        scope.$eval(attrs.ngEnter);
                    });

                    event.preventDefault();
                }
            });
        };
    })
    .controller('MainCtrl', ['$scope', '$mdDialog', 'socket', '$http', function($scope, $mdDialog, socket, $http) {
        $scope.messages = [];
        $scope.rooms = [];
        $scope.room = "";
        socket.on('setup', function(data) {
            var rooms = data.rooms;
            $scope.rooms = rooms;
        });

        $scope.handleRoomSubMenu = function(r) {
            $scope.room = r;
            socket.emit('switch room', {
                newRoom: $scope.room,
                username: $scope.username
            });

            $http.get('/api/msg?room=' + r).success(function(res) {
                $scope.messages = res;
            })
        };

        $scope.usernameModal = function(e) {

            $mdDialog.show({
                controller: UsernameDialogController,
                templateUrl: 'partials/username.tmpl.html',
                parent: angular.element(document.body),
                targetEvent: e,
            }).then(function(answer) {

                $scope.username = answer;
                socket.emit('new user', {
                    username: answer
                });

                $scope.room = 'GENERAL'

                $http.get('/api/msg?room=' + $scope.room).success(function(res) {
                    $scope.messages = res
                })
            }, function(res) {
                console.log(res);
            })

        };

        //Listen for new messages (Objective 3)
	    socket.on('message created', function (data) {
	        //Push to new message to our $scope.messages
	        $scope.messages.push(data);
	        //Empty the textarea
	        $scope.message = "";
	    });


	    //Send a new message (Objective 4)
	    $scope.send = function (msg) {
	        //Notify the server that there is a new message with the message as packet
	        socket.emit('new message', {
	            room: $scope.room,
	            message: msg,
	            username: $scope.username
	        });

	    };

	    $scope.usernameModal();


    }])
    .factory('socket', function(socketFactory, baseurl) {
        var myIoSocket = io.connect(baseurl);

        var socket = socketFactory({
            ioSocket: myIoSocket
        });

        return socket;
    });


function UsernameDialogController($scope, $mdDialog) {
    $scope.answer = function(answer) {
        $mdDialog.hide(answer);
    };
}
