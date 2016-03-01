// server.js

// Import all our dependencies
var express  = require('express');
var mongoose = require('mongoose');
var app      = express();
var server   = require('http').Server(app);
var io       = require('socket.io')(server);
var morgan   = require('morgan');

app.use(express.static(__dirname + '/public'));

var router = express.Router();



mongoose.connect("mongodb://localhost:27017/scotch-chat");

// create a schema for chat
var ChatSchema = mongoose.Schema({
  created: Date,
  content: String,
  username: String,
  room: String
});

// create a model from the chat schema
var Chat = mongoose.model('Chat', ChatSchema);

// allow CORS
app.all('*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token,X-Key');
  if (req.method == 'OPTIONS') {
    res.status(200).end();
  } else {
    next();
  }
});


app.use(express.static(__dirname+'/public'));


router.get('/hello', function(req, res){
   res.json({"message":"Hello"});
});

//This route is simply run only on first launch just to generate some chat history
/*router.post('/setup', function(req, res) {
  
  var chatData = [{
    created: new Date(),
    content: 'Hi',
    username: 'Chris',
    room: 'php'
  }, {
    created: new Date(),
    content: 'Hello',
    username: 'Obinna',
    room: 'laravel'
  }, {
    created: new Date(),
    content: 'Ait',
    username: 'Bill',
    room: 'angular'
  }, {
    created: new Date(),
    content: 'Amazing room',
    username: 'Patience',
    room: 'socet.io'
  }];

  
  for (var c = 0; c < chatData.length; c++) {
  
    var newChat = new Chat(chatData[c]);
  
    newChat.save(function(err, savedChat) {
      console.log(savedChat);
    });
  }
  
  res.send('created');
});*/

//This route produces a list of chat as filterd by 'room' query
router.get('/msg', function(req, res) {
  //Find
  Chat.find({
    'room': req.query.room.toLowerCase()
  }).exec(function(err, msgs) {
    //Send
    res.json(msgs);
  });
});

app.use('/api', router);

/*||||||||||||||||||END ROUTES|||||||||||||||||||||*/

/*||||||||||||||||SOCKET|||||||||||||||||||||||*/
//Listen for connection
io.on('connection', function(socket) {
  //Globals
  var defaultRoom = 'general';
  var rooms = ["General", "angular", "socket.io", "express", "node", "mongo", "PHP", "laravel"];

  //Emit the rooms array
  socket.emit('setup', {
    rooms: rooms
  });

  //Listens for new user
  socket.on('new user', function(data) {
    data.room = defaultRoom;
    //New user joins the default room
    socket.join(defaultRoom);
    //Tell all those in the room that a new user joined
    io.in(defaultRoom).emit('user joined', data);
  });

  //Listens for switch room
  socket.on('switch room', function(data) {
    //Handles joining and leaving rooms
    //console.log(data);
    socket.leave(data.oldRoom);
    socket.join(data.newRoom);
    io.in(data.oldRoom).emit('user left', data);
    io.in(data.newRoom).emit('user joined', data);

  });

  //Listens for a new chat message
  socket.on('new message', function(data) {
    //Create message
    var newMsg = new Chat({
      username: data.username,
      content: data.message,
      room: data.room.toLowerCase(),
      created: new Date()
    });
    //Save it to database
    newMsg.save(function(err, msg){
      //Send message to those connected in the room
      io.in(msg.room).emit('message created', msg);
    });
  });
});
/*||||||||||||||||||||END SOCKETS||||||||||||||||||*/

server.listen(2015);
