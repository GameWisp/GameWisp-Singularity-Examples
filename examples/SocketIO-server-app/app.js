// app.js 
/*
 * Description: A server side test application for communicating with GameWisp's singularity API.
 * 
 */

//initialization
var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var socketClient = require('socket.io-client')('https://singularity.gamewisp.com');
var crypto = require('crypto-js');
var prettyJson = require('prettyjson');

var oAuthInfo = {
  site: 'https://gamewisp.com',
  clientID: 'your client id',
  clientSecret: 'your client secret',
  tokenPath: '/api/v1/oauth/token',
  authorizationPath: '/api/v1/oauth/authorize',
}; 

var oauth2 = require('simple-oauth2')(oAuthInfo);

var authorization_uri = oauth2.authCode.authorizeURL({
  redirect_uri: 'your-redirect-uri',
  scope: 'read_only',
  state: 'your encoded state'
});

server.listen(8000);

// basic http endpoint if needed.
app.get('/', function(req, res){
  res.send('<h1>You made it to the example service</h1>');
});

//redirects to the gamewisp authorization page.
app.get('/auth', function(req, res){
  res.redirect(authorization_uri);
});

app.get('your-redirect-uri', function(req,res){
  var code = req.query.code;

  var token = oauth2.authCode.getToken({
    code: code,
    redirect_uri: 'your-redirect-uri'
  }).then(function saveToken(result){
    console.log(prettyJson.render(result));
    if(result.error == undefined){
      token = oauth2.accessToken.create(result);

      //token structure is as follows:
     /* token:
      { 
        result: { status: 1, message: 'Token issued' },
        data:
        { 
          access_token: 'the-access-token',
          token_type: 'Bearer',
          expires_in: 3600,
          refresh_token: 'the-refresh-token' 
        },
        expires_at: token-expiry-time (UTC) 
      },*/

      // initialize and connect the socket client here, after you have a token. we're just doing it this way in the example becuase we're 
      // not storing the token permanently, yet still using the authorization code grant. It's a little funky, but oh well.
      accessToken = token.token.data.access_token;

      //use the token to connect to this channel's singularity stream.
      //to connect you only need to send the access token in a JSON object.

      //connect the channel.
      socketClient.emit('channel-connect', {
        access_token: accessToken
      });

    }
    else{
      res.send('<h1> There was an error: ' + result.error_description + '</h1>');
    }

  }).catch( function logError(error){
    console.log('access token error', error.message);
  });
});

var doSomething = function(eventName, data){
  //do something with our event and the data we got back from singularity.
  //here we just use a node library to pretty print it to the console.
  console.log('event: ' + eventName);
  console.log(prettyJson.render(data));
};

socketClient.on('connect', function(){  
  // authenticate your application
  socketClient.emit('authentication', 
      {
          key: oAuthInfo.clientID, 
          secret: oAuthInfo.clientSecret,
      }
  );
});

socketClient.on('authenticated', function(data) {
  console.log('authenticated client');
  console.log(prettyJson.render(data));
});


// On-Demand Methods
socketClient.on('app-channel-connected', function(data, callback){
    doSomething('app-channel-connected', JSON.parse(data));                            
});

// Real Time Events
socketClient.on('subscriber-new', function(data, callback){
    doSomething('subscriber-new', JSON.parse(data));
});

socketClient.on('subscriber-renewed', function(data, callback){
    doSomething('subscriber-renewed', JSON.parse(data));
});

socketClient.on('subscriber-status-change', function(data, callback){
    doSomething('subscriber-status-change', JSON.parse(data));
});

socketClient.on('subscriber-benefits-change', function(data, callback){
    doSomething('subscriber-benefits-change', JSON.parse(data));
});

socketClient.on('benefit-fulfilled', function(data, callback){
    doSomething('benefit-fulfilled', JSON.parse(data));
});

socketClient.on('benefit-dismissed-user', function(data, callback){
    doSomething('benefit-dismissed-user', JSON.parse(data));
});

socketClient.on('benefit-dismissed-channel', function(data, callback){
    doSomething('benefit-dismissed-channel', JSON.parse(data));
});

socketClient.on('tier-published', function(data, callback){
    doSomething('tier-published', JSON.parse(data));
});

socketClient.on('tier-unpublished', function(data, callback){
    doSomething('tier-unpublished', JSON.parse(data));
});

socketClient.on('tier-modified', function(data, callback){
    doSomething('tier-modified', JSON.parse(data));
});

socketClient.on('tier-benefit-added', function(data, callback){
    doSomething('tier-benefit-added', JSON.parse(data));
});

socketClient.on('tier-benefit-removed', function(data, callback){
    doSomething('tier-benefit-removed', JSON.parse(data));
});

console.log('Up and running!');

