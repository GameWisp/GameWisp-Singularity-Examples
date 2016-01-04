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


// this is your dev key. It identifies the app.
var key = "your-developer-key";

// this is your dev secret for this application. You shouldn't expose this.
var secret = "your-developer-secret";


server.listen(8000);

// basic http endpoint if needed.
app.get('/', function(req, res){
  res.send('<h1>You made it to the example service</h1>');
});

var doSomething = function(eventName, data){
  //do something with our event and the data we got back from singularity.
  console.log('event: ' + eventName + ' data: ' + JSON.stringify(data));
};

// convenience method to handle sending data to singularity.
var sendSingularityData = function(channelJson, call){
    var data_base64 = encryptData(channelJson);

    socketClient.emit(call, {
        key: key,
        data: data_base64,
    });
};

// convenience method to encrypt json data and base64 encode it for transmission to singularity. 
var encryptData = function(json){
     // base64 encode the data.
    var strings = JSON.stringify(json);

    // encrypt using AES style encryption for secure transmission.
    var encrypted = crypto.AES.encrypt(strings, crypto.enc.Hex.parse(secret), { iv: crypto.enc.Hex.parse(key) });  
    var data_base64 = encrypted.ciphertext.toString(crypto.enc.Base64); 

    return data_base64;
}

socketClient.on('connect', function(){  
  // authenticate your application
  socketClient.emit('authentication', 
      {
          key: key, 
          secret: secret
      }
  );
});

socketClient.on('authenticated', function(data) {
  console.log('developer authentication authenticated.');

  var channels = [
      {   
          identifier: 'channel-identifier',
          key: 'channel-key'
      },
  ];


  // connect the channels. 
  sendSingularityData(channels, 'channels-listen');
});


// On-Demand Methods
socketClient.on('app-channels-listened', function(data, callback){
    console.log('app-channels-listened: ' + data);                            
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

