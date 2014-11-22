var wiiController = require('wii-controller');
var HID = require('node-hid');
var Q = require('Q');
var names = ["Eli", "Oli", "Luci", "Ella"];

var jquery = require('jquery');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var name = "";
var gameStatus = "start";
var colors = ["red", "blue", "green"];
var remotes = [];

function findRemotes()
{
    var motes = HID.devices();
      motes.forEach((function(d) {
      if(typeof d === 'object' && d.product.toLowerCase().indexOf('wiimote') !== -1) {
        var mote = new wiiController(d.path);
        bindKeys(mote);
        remotes.push(mote);
      }
    }));
}

function bindKeys(wii)
{

  wii.on("CWIID_BTN_A:press", function(key) {
    apress(wii);
  });

};

function apress(wii)
{
  console.log("Press with status of " + gameStatus + " - " + wii.status);
  if(gameStatus == "identifyAdmin")
  {
    setAdminRemote(wii);
  }
  else if(gameStatus == "startRound")
  {
    if(wii.status=="admin")
    {
      acceptAnswer();
    }
    else
    {
      //possibly add time?
      console.log("Adding 3 seconds to + " + wii.status);
      wii.delay = wii.delay + 3000;
    }
  }
  else if(gameStatus == "acceptAnswer")
  {
    answer(wii);
  }
  else if(gameStatus == "answered")
  {
    if(wii.status=="admin")
    {
      gameStatus = "startRound";
    remotes.forEach(function(element, index, array){
      if(element.status != "admin")
          element.delay = 0;
    });
      updateGame();
    }
  }
}

function answer(remote)
{
  console.log(remote.status);
  if(remote.delay == 0)
  {
    io.emit("answer", remote.status);
    gameStatus = "answered";
  }
}

function acceptAnswer()
{
  remotes.forEach(function(element, index, array){
    if(element.status != "admin" && element.delay > 0)
      setTimeout(function() {
        element.delay = 0;
        console.log(element.status + " ready.");
      }, element.delay);
  })
  gameStatus="acceptAnswer";
  io.emit("acceptAnswer");
}

function setNames(nameArray)
{
  name = nameArray.pop();
  console.log("Press for " + name);
}

function startGame()
{
  //identify remotes
  identifyAdminRemote();
  //check users

  //start round
  //show final score
}

function updateGame()
{
  if(gameStatus == "startRound")
  {
    startRound();
  }
  else if(gameStatus == "wait")
  {

  }
}

function identifyAdminRemote()
{
  console.log("Identify Admin");
  io.emit("admin");
  gameStatus = "identifyAdmin";
}

function setAdminRemote(remote)
{
  console.log("Set Admin");
  remote.status="admin";
  remotes.forEach(function(element, index, array){
    if(element.status != "admin")
      element.status = colors.pop();
  })
  gameStatus = "startRound";
  updateGame();
}

function startRound()
{
  console.log("StartRound");
  io.emit("start");
}

findRemotes();
app.get('/', function(req, res){
  res.sendfile('index.html');
});

http.listen(1337, function(){
  console.log('listening on *:1337');
});

io.on('connection', function(socket){
  console.log('a user connected');
  startGame();

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});
