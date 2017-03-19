var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mapper = {};
io.on('connection', function(socket){
  var email = null;
  
  // trigger when user sends a message to chat room
  socket.on('sendToAll', function(data){
    socket.broadcast.to('public').emit('publicMessage',data);
  });

  console.log('a user connected:'+ socket.id);
  // trigger when user disconnects
  socket.on('disconnect', function(){
    if(email)
    {
      console.log('user '+email+' is disconnected');
      socket.broadcast.to('public').emit('chatStatus',email+' left the room');
      delete mapper[email];
    }
  });
  // trigger when private mesage is sent
  socket.on('privateMessage', function(data){
      var emitTo = 'privateMessage';
      if(!data.openChat) emitTo = 'openChat';     
      mapper[data.toUser].emit(emitTo,data);
      console.log('emitTo:'+ emitTo+', from '+ data.fromUser+'to '+ data.toUser + ': '+data.msg);
  });
  // trigger when user joins the public chat room
  socket.on('initiateConnection', function (user) {
    console.log('User Joined with email:' + user.email+' and id:'+socket.id);
    mapper[user.email] = socket;
    email = user.email;
    socket.join('public',function(){
      emitToRoom(socket,'public','chatStatus',user.email+' has joined the room');
      emitToRoom(socket,'public','listUsers',Object.keys(mapper));
    });   
  });
});

function emitToRoom(socket,room,emitFunc,message)
{
  socket.broadcast.to(room).emit(emitFunc,message);
  socket.emit(emitFunc,message);
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

/*http.listen(process.env.PORT || 3000,function(){
  console.log('listening on *:3000*');
});
*/
var port = process.env.PORT || 3000;
http.listen(port, function(){
  console.log('listening on *:'+port);
});
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
