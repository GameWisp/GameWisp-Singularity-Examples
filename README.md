# GameWisp-Singularity-Examples
A public repository of code examples that leverage the GameWisp Singularity API. Singularity Documentation is also included.

## Quick Start

*NOTE: The API currently leverages AES encryption for the passing of channel credentials. This functionality may be replaced with a more conventional OAuth-style authorization process before this API enters public release.*

Singularity can be accessed by both client and server side applications. A minimal working client example is as follows:

    <!doctype html>
	<html>
	    <head>
	        <!-- for basic websocket communication -->
	        <script src="https://cdn.socket.io/socket.io-1.2.0.js"></script>
        
	        <!-- CryptoJS libraries for credential passing -->
	        <script src="http://crypto-js.googlecode.com/svn/tags/3.1.2/build/components/core-min.js"></script>
	        <script src="http://crypto-js.googlecode.com/svn/tags/3.1.2/build/rollups/aes.js"></script>
	        
	        <script>
	            
	            // this is your dev key. It identifies the app. It can be exposed
	            // without issue.
	            // Don't expose your secret! 
	            var devCredentials = {
	                key: "<developer key issued to you by GameWisp>",
	                secret: "<developer secret issued to you by GameWisp>"
	            }
	            
	            var socket = io('http://singularity.gamewisp.com:8000');
	            
	            socket.on('connect', function(){
	                // Emit the authenticate event authenticate your developer credentials.
	                socket.emit('authentication', 
	                    {
	                        key: key, 
	                        secret: secret,
	                    }
	                );
	            
	                // Singularity will emit an 'authenticated' event if your developer credentials are accepted.
	                socket.on('authenticated', function(data) {
	                    /* A list of channel ids and keys that we want to get information for. The
	                    *  keys and IDs will be supplied by users of your application. 
	                    *  The submitted payload must always be an array of channelIDs and keys, even if you're only 
	                    *  passing in one pair. 
	                    */
	                    var channels = [
	                        {   
	                            identifier: '<channel identifier supplied by a GameWisp channel to your application>',
	                            key: '<channel key supplied by a GameWisp channel to your application>'
	                        }
	                    ];
	                    // Encrypt the channel credentials with AES encryption using your developer secret and key.
	                    var encrypted = CryptoJS.AES.encrypt(JSON.stringify(channels), CryptoJS.enc.Hex.parse(devCredentials.secret), { iv: CryptoJS.enc.Hex.parse(devCredentials.key) });  
	                    
	                    // Base64 encode the data for transmission.
	                    var data_base64 = encrypted.ciphertext.toString(CryptoJS.enc.Base64);
	                    // Emit 'channels-listen' event to authorize access to channels.
	                    socket.emit('channels-listen', {
	                        key: devCredentials.key,
	                        data: data_base64,
	                    });
    
	                    // API will emit 'app-channels-listened' event as a result of sending 'channels-listen'. Response contains authorization information for each channel
	                    // sent on the 'channels-listen' event.
	                    socket.on('app-channels-listened', function(response){
	                        // Determine authorization status of channels, take appropriate action.                          
	                    });
    
	                    // Listen on any event of interested to get data pertaining to any channel that you have correctly authorized.
	                    socket.on('event-of-interest', function(response){
	                        // Do work with the response object.
	                    });
	                });
	            });
	        </script>
	    </head>
	    <body>
	        <!-- Print responses here, etc. -->
	    </body>
	</html>

This minimal example was taken from the **SocketIO-client-app** example. If you prefer a more fully fleshed out example, check out that example in this repository found in the ```examples``` folder.

## The API

The Singularity API is real-time API that is meant to be interacted with using WebSockets. Clients connect to the API and listen to specific events of interest and receive data from the API in real-time. Unlike a conventional REST API, **there is no need to repeatedly poll or request on specific endpoints**. So don't do it. This API is ideal for bots and other services that require immediate and on-going access to GameWisp data; however, request functionality is also included such that data can be provided to clients on-demand when necessary. 

Currently, the **Singularity API is read only**. Connected clients can receive data in real-time, but can perform no operation which alters the state of any data stored by GameWisp.

### Developer Authentication

Developers are currently authenticated using a key and secret. While Singularity is in beta, these credentials will be generated upon request by GameWisp. If you're interested in using the API, please send an email to help [at] gamewisp [dot] com and we will provide you with a credential pair.

Developer authentication is handled programmatically as follows:

    socket.emit('authentication', 
        {
            key: "your developer key", 
            secret: "your developer secret",
        }
    );

The API will respond with the ```authenticated``` event if your credentials are properly authenticated:

    socket.on('authenticated', function(response) {
    	//your logic here
    });


The contents of the ```response``` object on a successful authentication is a JSON object of the following form:

    {
	    result: {
	      status: 1,
	      message: "Developer Application Authenticated."
	    },
    }

### Channel Authorization

*NOTE: The API currently leverages AES encryption for the passing of channel credentials. This functionality may be replaced with a more conventional OAuth-style authorization process before this API enters public release.*

In order to access data for any GameWisp channel, your application must be authorized by that channel. Authorization is accomplished by Channel Authorization also currently uses channel identifiers and keys. If you're an application developer, these credentials will be supplied to you by your users. Store and use these credentials with the same care that you would store and use passwords or other sensitive information from your users.

Channel credentials are used to validate any event your application may emit to the Singularity API. To ensure secure transmission of channel credentials, they are currently required to be submitted using AES-256 bit encryption. In practice, performing encryption and passing the required information is fairly straight forward. Using CryptoJS, for example, on a server application using NodeJS, would perform channel authorization as follows:

    var socketClient = require("socket.io-client")('http://singularity.gamewisp.com:8000');
    var crypto = require('crypto-js');
    
    
    socketClient.on('connect', function(){
    
    	socketClient.on('authenticated', function(data) {
		    
    		var channels = [
	                        {   
	                            identifier: '<channel identifier supplied by a GameWisp channel to your application>',
	                            key: '<channel key supplied by a GameWisp channel to your application>'
	                        }
	                    ];
		    
		    //encrypt using AES style encryption for secure transmission.
		    var encrypted = crypto.AES.encrypt(JSON.stringify(channels), crypto.enc.Hex.parse("your developer secret"), { iv: crypto.enc.Hex.parse("your developer key") });  
		    
		    //base64 encode the data
		    var data_base64 = encrypted.ciphertext.toString(crypto.enc.Base64); 
		    
		    socketClient.emit('channels-listen', {
		        key: "your developer key",
		        data: data_base64,
		    });
		});
	});

Upon verifying the channels' authorization credentials, singualrity will emit the ```app-channels-listened``` event to your application, which you can listen for as follows:

     socketClient.on('app-channels-listened', function(response){
          console.log('app-channels-listened: ' + response);                            
      });

The response is a JSON object of the form:

    {
	   result: {
	      status: 1,
	      message: "Channels authenticated."
	   },
	   data: [
	      {
	         id: "channel identifier 1",
	         status: "authenticated",
	         listening: true
	      },
	      {
	         id: "channel identifier 2",
	         status: "invalid",
	         listening: false
	      },
	      //...
	   ],
	   dev_key: "9c22873cc11b24a3d447ad135ef89ade"
	}

```result``` contains the overall status of the call. A status of 1 indicates success, 0 indicates failure.  ```data``` contains an array of objects, one per channel identifier-key pair in ```channels-listen```. The contents of this object are as follows:

* **key**: string. The channel's identifing key.
* **status**: string. The status of the authorization attempt. "authenticated" for a successfull authorization, "invalid" if there is a problem with the key-identifier pair you passed in for that channel in ```channels-listen```.
* **listening**: boolean. Indicates that you will receive real time data for the channel as it occurs. 

If you receive a ```listening: true``` for a channel, you will receive data for that channel from singularity. 

### Real-Time Events

Once a channel is authenticated, your application can receive data pertaining to that channel by listening for any or all of 12 different events. Pick and choose the events that pertain to your particular use case. Data from real-time events is JSON formatted, and will have the following basic structure:

    {
		event: "event-name",
		id: "channel identifier",
		data: {
			//data for the particular event.
		}
	}

The ```data``` object contains information pertaining to the event. This object is unique for every event type, but contains some common elements that are described as follows:

The IDs of the user. If the user has a twitch account linked to GameWisp, their Twitch ID is also provided. If not, it is null.
    
    ids: {
	         gamewisp: "1111",
	         twitch: "22222222"
	      },

The user names of the user. If the user's twitch account is linked to GameWisp, the twitch username is also provided. If not, it is null. 

	username: {
	         gamewisp: "user_name",
	         twitch: "user_name_on_twitch"
	      },

There are currently 12 events an application can choose to listen to for each authorized channel. They are as follows:

#### subscriber-new

Fires whenever a channel gains a new subscriber. Has the following JSON structure:

     {
	   event: "subscriber-new",
	   id: "channel identifier ",
	   data: {
	      ids: {
	         gamewisp: "26356",
	         twitch: "46984772"
	      },
	      username: {
	         gamewisp: "thefr0zenheart",
	         twitch: "thefr0zenheart"
	      },
	      status: "active",
	      amount: "3.99",
	      subscribed_at: "2015-12-30 00:00:00",
	      end_of_access: "2016-01-30 23:59:00",
	      tier: {
	         id: "6969",
	         title: "Bronze Support",
	         level: "1",
	         cost: "3.99",
	         description: "Want to support the stream monthly This is Bronze tier",
	         published: true
	      }
	   }
    }


* **status**: string. The subscriber's current status. Can be any of the following: 

### On-Demand Events

## Coming Soon
* Actual documentation.
* Examples.
* Hooray!
