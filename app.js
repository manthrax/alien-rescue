var express = require('express'),
    sio = require('socket.io'),
	http = require('http');
var app = express();
var httpServer = http.createServer(app);
app.use(express.static(__dirname));
var port = (process.env.PORT || 3000)

httpServer.listen(port);

var io = sio.listen(httpServer);

io.set('log level',2);

var clients={};
var players={};
var rooms={};

//io.sockets.on('message', function (msg) {
	//console.log('Message Received: ', msg);
//    socket.broadcast.emit('message', msg);
//});

function sanitize(val){
    return val.replace(/[^a-z 0-9]+/gi,'');
}

function addRoom(name){
    return rooms[sanitize(name)]={
        spectators: {},
        players:    {}
    }
}

function addPlayer(name,socket){
    return {    //Add the player to the world
        name: sanitize(name),
        id:socket.id,
        nick:"anonymous",
        chat:""
    }
}


function addClient(sockId){
    return clients[sockId]={
    }
}
console.log("started!");
io.sockets.on('connection', function (socket) {
    var address = socket.handshake.address;
    console.log("New connection from " + address.address + ":" + address.port + " sid:"+socket.id);
    //console.log('Connect Received: ');
    
    var client=addClient(socket.id);

    console.log("Clients:"+JSON.stringify(clients));

  //  socket.on('join', function (data) {
    var player=addPlayer("unknown",socket);
    players[socket.id]=player;
    var i=0;
    for( var k in players)  //Renumber the players
        players[k].index=i++;
    console.log("players:"+JSON.stringify(players));

    socket.emit('welcome',socket.id); //Send the joining players id
    io.sockets.emit("players",players); //Broadcast the new player list

  //  });

    socket.on('video', function (data) {
	//console.log('Got data:'+socket.id);
        socket.broadcast.emit('video', {data:data,id:socket.id});    //Forward video packets...
    });
    
    socket.on('sim', function (msg) {
        //console.log('Message Received: ', msg);
        socket.broadcast.emit('sim', {data:msg,id:socket.id});   //Forward chat/game data
    });
    
    socket.on('chat', function (msg) {
        //console.log('Message Received: ', msg);
        socket.broadcast.emit('chat', {message:msg,id:socket.id});   //Forward chat/game data
    });
    
    socket.on('disconnect', function (data) {
        console.log("Client disconnect from " + address.address + ":" + address.port + " sid:"+socket.id);
        console.log("Discon data:" + data);
        
        delete clients[socket.id];
        delete players[socket.id];
        var i=0;
        for( var k in players) players[k].index=i++;  //Reindex the players
        console.log("players:"+JSON.stringify(clients));

        io.sockets.emit('players',players); //Broadcast the new player list
        
    });
    
});