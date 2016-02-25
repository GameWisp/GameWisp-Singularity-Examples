// app.js 
/*
 * Description: Serves up the singularity streaming API.
 * 
 */

//initialization
var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var morgan = require('morgan');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var redis = require('redis');
var socketio_redis = require('socket.io-redis');
var rest = require('restler');
var crypto = require('crypto-js');
var prettyJson = require('prettyjson');

var socketClient = require("socket.io-client")('https://singularity.gamewisp.com');



//universal defaults
app.use(bodyParser());
var nodePort = 8000;

//oauth configuration
var oAuthInfo = {
  site: 'https://api.gamewisp.com',
  clientID: 'your-client-id', 
  clientSecret: 'your-client-secret',
  tokenPath: '/pub/v1/oauth/token',
  authorizationPath: '/pub/v1/oauth/authorize'
};


var oauth2 = require('simple-oauth2')(oAuthInfo);


// Authorization Channel uri definition 
var authorization_uri = oauth2.authCode.authorizeURL({
  redirect_uri: 'your-redirect-uri',
  scope: 'read_only,user_read',
  state: 'your_state'
});

// Authorization Subscriber uri definition 
var authorization_uri2 = oauth2.authCode.authorizeURL({
  redirect_uri: 'your-redirect-uri',
  scope: 'user_read',
  state: 'more_state'
});

//------APPLICATION ROUTES-------//

//basic endpoint to auth a channel. 
app.get('/auth', function(req, res){
  res.redirect(authorization_uri);
});

//basic endpoint to auth a subscriber.
app.get('/auth-subscriber', function(req, res){
  res.redirect(authorization_uri2)
});

//basic up and running page
app.get('/', function(req, res){
  res.send('<h1>You made it to the skeleton service</h1> <p> Hit /auth if you need to authorize a channel. </p><p>Hit /auth-subscriber if you need to authorize a subscriber.</p>');
});

//use this as the redirect_uri for your client credentials.
app.get('/your-endpoint', function(req,res){
  var code = req.query.code;
  console.log('in your-endpoint with code: ' + code);

  var token = oauth2.authCode.getToken({
    code: code,
    redirect_uri: 'your-redirect-uri'
  }).then(function saveToken(result){
    console.log('Got a token!');
    console.log(prettyJson.render(result));
    if(result.error == undefined){
      token = oauth2.accessToken.create(result);
      accessToken = token.token.data.access_token;
      initSocketApiConnectionForChannel(token.token.data.access_token);

      res.send('<h1>You got a token object from GameWisp. Here is the auth token:' + token.token.data.access_token);
    }
    else{
      res.send('<h1> There was an error: ' + result.error_description + '</h1>');
    }

  }).catch( function logError(error){
    console.log('access token error', error.message);
  });
});

server.listen(nodePort);



//---- APPLICATION HELPERS------//
//connects to a chnnel using the provided access token.
var initSocketApiConnectionForChannel = function(accessToken){
  var data = {   
      access_token: accessToken,
  };

  //connect the channels. 
  console.log('attempting to connect channel with access_token: ' + accessToken);
  sendSingularityData(data, 'channel-connect');
}


//sends data to singularity.
var sendSingularityData = function(channelJson, call){
  socketClient.emit(call, channelJson);
};



//------ SINGULARITY ------//

//--- CONNECTION
socketClient.on('connect', function(){  
  console.log('attempting to connect to singularity');

  socketClient.emit('authentication', 
      {
          key: oAuthInfo.clientID, 
          secret: oAuthInfo.clientSecret,
      }
  );
});


//--- AUTHENTICATION
//Fires when your client is successfully authenticated
socketClient.on('authenticated', function(data) {
  console.log('authenticated client');
  console.log(prettyJson.render(data));
});

//Fires if there is an error with authentication. Typically bad client credentials. 
socketClient.on('unauthorized', function(err){
  console.log('Authentication error: ' + err.message);
});



//--- ON-DEMAND RESPONSES (see: https://gamewisp.readme.io/docs/on-demand-event-basics)

socketClient.on('app-channel-connected', function(data, callback){
  console.log('app-channel-connected');
  console.log(prettyJson.render(JSON.parse(data)));        
});

socketClient.on('app-channel-subscribers', function(data, callback){
  console.log('app-channel-subscribers');
  console.log(prettyJson.render(JSON.parse(data)));
});

socketClient.on('app-channel-tiers', function(data, callback){
  console.log('app-channel-tiers');
  console.log(prettyJson.render(JSON.parse(data)));
});


//--- REAL TIME EVENTS (see: https://gamewisp.readme.io/docs/real-time-events)

socketClient.on('subscriber-new', function(data, callback){
  console.log(prettyJson.render(JSON.parse(data)));
});

socketClient.on('subscriber-renewed', function(data, callback){
  console.log(prettyJson.render(JSON.parse(data)));
});

socketClient.on('subscriber-status-change', function(data, callback){
  console.log(prettyJson.render(JSON.parse(data)));
});

socketClient.on('subscriber-benefits-change', function(data, callback){
  console.log(prettyJson.render(JSON.parse(data)));
});

socketClient.on('benefit-fulfilled', function(data, callback){
  console.log(prettyJson.render(JSON.parse(data)));
});

socketClient.on('benefit-dismissed-user', function(data, callback){
  console.log(prettyJson.render(JSON.parse(data)));
});

socketClient.on('benefit-dismissed-channel', function(data, callback){
  console.log(prettyJson.render(JSON.parse(data)));
});

socketClient.on('tier-published', function(data, callback){
  console.log(prettyJson.render(JSON.parse(data)));
});

socketClient.on('tier-unpublished', function(data, callback){
  console.log(prettyJson.render(JSON.parse(data)));  
});

socketClient.on('tier-modified', function(data, callback){
  console.log(prettyJson.render(JSON.parse(data)));  
});

socketClient.on('tier-benefit-added', function(data, callback){
  console.log(prettyJson.render(JSON.parse(data)));
});

socketClient.on('tier-benefit-removed', function(data, callback){
  console.log(prettyJson.render(JSON.parse(data)));
});

console.log('Up and running! Hit the / endpoint for options.');

