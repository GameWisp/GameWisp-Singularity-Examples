var irc = require("tmi.js");
var io = require('socket.io-client');
var CryptoJS = require("crypto-js");

// this is your dev key. It identifies the app. It can be exposed
// without issue.
var key = "YOUR-CLIENT-KEY";

// This is your dev secret for this application. You shouldn't expose this.
var secret = "YOUR-CLIENT-SECRET";


var options = {
    options: {
        debug: true
    },
    connection: {
        random: "chat",
        reconnect: true
    },
    identity: {
        username: "YOUR-TWITCH-USERNAME",
        password: "YOUR-TWITCH-OAUTH-KEY" // Get this here: http://twitchapps.com/tmi/
    },
    channels: ["#TWITCH-CHANNEL-TO-CONNECT-TO", "#TWITCH-CHANNEL-TO-CONNECT-TO-2"] // can be a comma separate list and each channel must be a string and have a hashtag (#) in front of it
};

var client = new irc.client(options);

var socket = io.connect('https://singularity.gamewisp.com');


socket.on('connect', function() {

    socket.on('authenticated', function(data) {
        
        //connect a channel you have oauth credentials for.
        var channel = [
            {   
                access_token: 'CHANNEL-OAUTH-TOKEN'
            }
        ];
 
        sendSingularityData(channel, 'channel-connect');

    });

    
    //Method to authenticate a developer application.
    socket.emit('authentication', 
        {
            key: key, 
            secret: secret,
        }
    );

});



//TMI.js Connection

// Connect the client to the twitch channels indicated in options.
client.connect();

client.on("join", function (channel, username) {
    console.log(channel);
    // Do your stuff.
    //client.say(channel, "Welcome "+username+" to the channel!");
});



// Passive Singularity methods. These functions are called everytime data changes on the server. Pick and choose the
// ones you want to listen to. 

// Fires whenever a channel to which you're listening gains a new subscriber.
socket.on('subscriber-new', function(data, callback){
    
    console.log(data);

    var obj = JSON.parse(data);

    if (obj.usernames.gamewisp != undefined) {
      console.log(obj.usernames.gamewisp);
      client.say("#"+obj.channel.names.twitch, obj.usernames.gamewisp + " subscribed to my GameWisp! Thanks.");  
    }

});


// Fires whenever a channel modifies a tier's title, description, or cost.
socket.on('tier-modified', function(data, callback){

    var obj = JSON.parse(data);

    if (obj.channel.names.twitch != undefined) {
      console.log(obj.channel.names.twitch);
      client.say("#"+objobj.channel.names.twitch, "My tiers changed.");  
    }

});


//Fires when a subscriber is successfully renewed for another month.
socket.on('subscriber-renewed', function(data, callback){
    console.log(data);
});

// Fires whenever a subscriber to channel to which you're listening changes status. Active to inactive, etc.
// This will not fire on new subscribers, only changes to existing subscribers. See above.
socket.on('subscriber-status-change', function(data, callback){
    console.log(data);
});

// Fires whenever the benefits for a subscriber to a channel on which you're listening changes.
// This is typically the result of a subscriber upgrading or downgrading their subscription, or
// the channel altering the benefits to a tier with subscribers in it as this causes the benefits assigned
// to subscribers to change.
socket.on('subscriber-benefits-change', function(data, callback){
    console.log(data);
});

// Fires whenever the channel fulfills a benefit for a subscriber.
socket.on('benefit-fulfilled', function(data, callback){
    console.log(data);
});

// Fires when a user dismisses a benefit they do not want.
socket.on('benefit-dismissed-user', function(data, callback){
    console.log(data);
});

// Fires when a channel dismisses a benefit for a user.
socket.on('benefit-dismissed-channel', function(data, callback){
    console.log(data);
});

// Fires when a channel publishes a tier. This may not necessarily be a new tier, it may be a tier that was
// previously published, unpublished, and then published again by the channel.
socket.on('tier-published', function(data, callback){
    console.log(data);
});

// Same as tier-published except occurs when a channel unpublishes a tier.
socket.on('tier-unpublished', function(data, callback){
    console.log(data);
});

// fires when a channel adds a benefit to a tier, can fire in multiple succession if a 
// channel adds multiple benefits to a tier before saving that tier.
socket.on('tier-benefit-added', function(data, callback){
    console.log(data);
});

// same as tier-benefit-removed except for benefit removal.
socket.on('tier-benefit-removed', function(data, callback){
    console.log(data);
});



// API ON-DEMAND RESPONSES -- All methods designated 'app-*' send data only to your app upon socket.emit requests.
socket.on('app-channel-connected', function(data, callback){
    console.log(data);
});

//channels that you no longer want to listen to.
socket.on('app-channel-disconnected',function(data, callback){
    console.log(data);
});

//subscriber data for requested channels.
socket.on('app-channel-subscribers', function(data, callback){
    console.log(data);
});

//tier data for requested channels
socket.on('app-channel-tiers', function(data, callback){
    console.log(data);
});


//HELPERS

//helper method to handle connecting and disconnecting. the channels-listen and channels-unlisten calls work identically.
var sendSingularityData = function(channelJson, call){
    
    socket.emit(call, channelJson);
};







