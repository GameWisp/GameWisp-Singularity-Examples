# GameWisp-Singularity-Examples
A public repository of code examples that leverage the GameWisp Singularity API. Singularity Documentation is also included.

## Quick Start

*NOTE: The API currently leverages AES encryption for the passing of channel credentials. This functionality may be replaced with a more conventional OAuth-style authorization process before this API enters public release.*

Singularity can be accessed by both client and server side applications. A minimal working client example is as follows:

    <!doctype html>
	<html>
	    <head>
	        <script src="https://cdn.socket.io/socket.io-1.2.0.js"></script>
        
	        <script src="http://crypto-js.googlecode.com/svn/tags/3.1.2/build/components/core-min.js"></script>
	        <script src="http://crypto-js.googlecode.com/svn/tags/3.1.2/build/rollups/aes.js"></script>
	        
	        <script>
	            
	            // Don't expose your secret! 
	            var devCredentials = {
	                key: "<developer key issued to you by GameWisp>",
	                secret: "<developer secret issued to you by GameWisp>"
	            }
	            
	            var socket = io('http://singularity.gamewisp.com:8000');
	            
	            socket.on('connect', function(){
    
	                socket.emit('authentication', 
	                    {
	                        key: key, 
	                        secret: secret,
	                    }
	                );
	            
	                socket.on('authenticated', function(data) {
	                    var channels = [
	                        {   
	                            identifier: '<channel identifier supplied by a GameWisp channel to your application>',
	                            key: '<channel key supplied by a GameWisp channel to your application>'
	                        }
	                    ];
	               
	                    var encrypted = CryptoJS.AES.encrypt(JSON.stringify(channels), CryptoJS.enc.Hex.parse(devCredentials.secret), { iv: CryptoJS.enc.Hex.parse(devCredentials.key) });
	                    var data_base64 = encrypted.ciphertext.toString(crypto.enc.Base64);   
	                    
	                    // Emit 'channels-listen' event to authorize access to channels.
	                    socket.emit('channels-listen', {
	                        key: devCredentials.key,
	                        data: data_base64,
	                    });
    
	                    socket.on('app-channels-listened', function(response){
	                        //...                    
	                    });
    
	                    socket.on('event-of-interest', function(response){
	                        //...
	                    });
	                });
	            });
	        </script>
	    </head>
	    <body>
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

Channel credentials are used to validate any event your application may emit to the Singularity API. To ensure secure transmission of channel credentials, they are currently required to be submitted using AES-256 bit encryption. In practice, performing encryption and passing the required information is fairly straightforward. Using CryptoJS, for example, on a server application using NodeJS, would perform channel authorization as follows:

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

Upon verifying the channels' authorization credentials, Singularity will emit the ```app-channels-listened``` event to your application, which you can listen for as follows:

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

* **id**: string. The channel's identifying key.
* **status**: string. The status of the authorization attempt. "authenticated" for a successful authorization, "invalid" if there is a problem with the key-identifier pair you passed in for that channel in ```channels-listen```.
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

Using Socket.IO, this event can be listened to as follows:

    socket.on('subscriber-new', function(data){
        //Do something
    });

This event fires whenever a channel gains a new subscriber. Has the following JSON structure:

     {
	   event: "subscriber-new",
	   id: "channel identifier ",
	   data: {
	      ids: {
	         gamewisp: "26356",
	         twitch: "46984772"
	      },
	      username: {
	         gamewisp: "user_name",
	         twitch: "user_name_gamewisp"
	      },
	      status: "active",
	      amount: "3.99",
	      subscribed_at: "2015-12-30 00:00:00",
	      end_of_access: "2016-01-30 23:59:00",
	      tier: {
	         id: "111111",
	         title: "Tier Title",
	         level: "1",
	         cost: "3.99",
	         description: "Tier description",
	         published: true
	      }
	   }
    }



* **status**: The subscriber's current status. Can be any of the following: ```active``` - a currently active subscriber, ```trial``` - a subscriber on a trial code, ```grace_period``` - a canceled subscriber that is still received benefits, ```billing_grace_period``` - a canceled subscriber still receiving benefits that was canceled due to a payment processing error, ```inactive``` - a subscriber that is canceled and receiving no benefits, ```twitch``` - a subscriber that is receiving free benefits from a partnered Twitch streamer.

* **amount**: The amount currently paid by the subscriber. Does not currently include additional money paid by the subscriber over the cost of their subscription tier.

* **subscribed_at**: The date and time at which the subscriber subscribed to the channel.

* **end_of_access**: The approximate date and time at which the subscriber's subscription is to be renewed. 

* **tier**: Basic information about the tier to which the subscriber has subscribed. Does not contain individual benefits.


This event fires as soon as a subscriber has newly subscribed to a channel. It is always immediately followed by the ```subscriber-benefits-change``` event.

#### subscriber-benefits-change

This is arguably the most important event for an application attempting to provide benefit fulfillment of some sort for GameWisp subscribers. As such, the event and its response are described in detail here. It is well worth familiarizing yourself with this section of the documentation in particular if you're looking to write an application that leverages singularity for benefit fulfillment (e.g., managing giveaways, channel currency, access to servers, Discord, etc.) 

This event fires whenever a subscriber's benefits change. A benefit change can be triggered by a user subscribing to a new channel, upgrading their subscription to a channel, or downgrading their subscription to a channel. Has the following JSON structure:

    {
	   event: "subscriber-benefits-change",
	   id: "channel identifier",
	   data: {
	      benefits: [
	         {
	            benefit: {
	               id: "3",
	               delivery: "delivery-messaging",
	               title: "Subscriber Messaging",
	               description: "Receive Subscriber-only messages from me.",
	               channel_data: null,
	               type: "unknown-type",
	               month_delay: null,
	               recurring: false,
	               recurring_input: false,
	               receieve_immediately: false,
	               removed_at: null,
	               subscriber_limit: null,
	               tier_bonus: false
	            },
	            fulfillment: {
	               id: "54350",
	               benefit_id: "3",
	               tier_id: "8781",
	               channel_fulfillment_response: null,
	               fulfilled_at: "2015-12-30 21:29:07",
	               previously_fulfilled_at: null,
	               disabled_at: null,
	               user_input_provided_at: null,
	               recurring: true,
	               granted_at: {
	                  date: "2015-12-30 21:29:07.000000",
	                  timezone_type: 3,
	                  timezone: "UTC"
	               },
	               channel_cancelled_at: null,
	               status: "active"
	            }
	         },
	         //...
	      ],
	      ids: {
	         gamewisp: "23029",
	         twitch: "107539096"
	      },
	      username: {
	         gamewisp: "grietje1",
	         twitch: "grietje1"
	      },
	      status: "active",
	      amount: "3.99",
	      subscribed_at: "2015-12-30 00:00:00",
	      end_of_access: "2016-01-30 23:59:00",
	      tier: {
	         id: "11112",
	         title: "Tier Title",
	         level: "1",
	         cost: "3.99",
	         description: "Tier description",
	         published: true
	      }
	   }
	}
 
 The ```benefits``` array contains an array of benefit-fulfillment pairs. The benefit object in the pair describes a single benefit for the subscriber. The fulfillment obejct in the pair provides information about whether or not the benefit has been fulfilled.

 The benefit object:

 * **id**: The unique identifier for the benefit.
 * **delivery**: The delivery type of the benefit. This describes how the benefit is delivered by GameWisp.

 The delivery types are: 
 - ```delivery-messaging``` - Unique to the Subscriber Messaging benefit, indicates that the benefit allows the subscriber to access messaging features for the channel. 
 - ```delivery-video``` - Unique to the Early Access and Premium Video benefits. Indicates that the user can view early access and/or premium videos for the channel on GameWisp.
 - ```delivery-automatic``` - Indicates that the benefit's data is automatically sent to the subscriber upon subscription.
 - ```delivery-personal``` - Indicates that the channel must do something specific to this subscriber in order to fulfill the benefit. For example, providing channel currency. This is likely the benefit delivery type of most importance for bots and other applications that generally want to automate some action for a specific user.
 - ```delivery-personal-input``` - Indicates that the channel must do something specific to this subscriber, but some input is required by the subscriber. This input is collected on GameWisp, typically after this event has been sent.
 - ```delivery-none``` - Nothing is required to be sent to a subscriber, but something is required to be performed by the channel. Examples include giveaways and playing games with subscribers.
 - ```delivery-unknown``` - Error condition. The delivery type isn't recognized by Singularity.

* **title**: The title of the benefit.
* **description**: The description of the benefit.
* **type**: The type of the benefit. 

 Benefit types are as follows:
 - ```currency-more``` - More channel currency to the subscriber.
 - ```currency-multiplier``` - Multiplier for the amount of currency earned.
 - ```access-server``` - Server credentials for games, etc.
 - ```access-teamspeak``` - Credentials to access a teamspeak server.
 - ```access-discord``` - Access information for a Discord server.
 - ```giveaways``` - Access to giveaways performed by the channel.
 - ```play-games``` - Access to game playing sessions. 
 - ```subscriber-art``` - Access to art delivered by the channel. 
 - ```subscriber-music``` - Access to music delivered by the channel.
 - ```giftcards``` - Giftcards for Steam, Origin, etc.
 - ```custom``` - A benefit created custom by the channel. 
 - ```unknown-type``` - Error condition. The benefit type isn't recognized by Singularity.

 * **month_delay**: The number of months that a benefit should be delayed before it is awarded to the subscriber. This number is always an integer between 1 and 12. It is null if no delay has been specified.
 * **recurring**: boolean. Specifies whether or not a benefit recurs. If this is true and a ```month_delay``` is specified, the benefit should recur every X months as specified by ```month_delay```.
 * **recurring_input**: boolean. Specifies whether or not new input is required from the user each time the benefit recurs. This is only true if the ```delivery_type``` is also  ```delivery-personal-input```, but can also be false in this case.
 * **receieve_immediately**: boolean. Indicates that the user should receive the benefit immediately. This value will only ever be true if ```month_delay``` is **not** ```null```, and can still be false in this case. Otherwise, there is no delay on benefit delivery and the benefit will be delivered immediately regardless of the value for ```receieve_immediately```.
 * **removed_at**: datetime. Indicates that this benefit has been removed from a tier. Subscribers may still have this benefit if they subscribed while the benefit was part of a tier.
 * **subscriber_limit**: integer. If not null, indicates the maximum number of subscribers that can have this benefit at any one time.  
 * **tier_bonus**: boolean. Indicates that this benefit is a tier bonus. As such it does not stack with higher tiers. The ```currency-more``` and ```currency-multiplier``` benefits are typically tier bonuses.


The fulfillment object represents how the benefit is fulfilled by the channel. It is described as follows:


 // Fires whenever a channel to which you're listening gains a new subscriber.
                        socket.on('subscriber-new', function(data, callback){
                            prettyPrint($('#messages'), 'subscriber-new', data);
                        });

                        //Fires when a subscriber is successfully renewed for another month.
                        socket.on('subscriber-renewed', function(data, callback){
                            prettyPrint($('#messages'), 'subscriber-renewed', data);
                        });

                        // Fires whenever a subscriber to channel to which you're listening changes status. Active to inactive, etc.
                        // This will not fire on new subscribers, only changes to existing subscribers. See above.
                        socket.on('subscriber-status-change', function(data, callback){
                            prettyPrint($('#messages'), 'subscriber-status-change', data);
                        });

                        // Fires whenever the benefits for a subscriber to a channel on which you're listening changes.
                        // This is typically the result of a subscriber upgrading or downgrading their subscription, or
                        // the channel altering the benefits to a tier with subscribers in it as this causes the benefits assigned
                        // to subscribers to change.
                        socket.on('subscriber-benefits-change', function(data, callback){
                            prettyPrint($('#messages'), 'subscriber-benefits-change', data);
                        });

                        // Fires whenever the channel fulfills a benefit for a subscriber.
                        socket.on('benefit-fulfilled', function(data, callback){
                            prettyPrint($('#messages'), 'benefit-fulfilled', data);
                        });

                        // Fires when a user dismisses a benefit they do not want.
                        socket.on('benefit-dismissed-user', function(data, callback){
                            prettyPrint($('#messages'), 'benefit-dismissed-user', data);
                        });

                        // Fires when a channel dismisses a benefit for a user.
                        socket.on('benefit-dismissed-channel', function(data, callback){
                            prettyPrint($('#messages'), 'benefit-dismissed-channel', data);
                        });
                        
                        // Fires when a channel publishes a tier. This may not necessarily be a new tier, it may be a tier that was
                        // previously published, unpublished, and then published again by the channel.
                        socket.on('tier-published', function(data, callback){
                            prettyPrint($('#messages'), 'tier-published', data);
                        });
                        
                        // Same as tier-published except occurs when a channel unpublishes a tier.
                        socket.on('tier-unpublished', function(data, callback){
                            prettyPrint($('#messages'), 'tier-unpublished', data);
                        });
                        

                        // Fires whenever a channel modifies a tier's title, description, or cost.
                        socket.on('tier-modified', function(data, callback){
                            prettyPrint($('#messages'), 'tier-modified', data);
                        });
                        
                        // fires when a channel adds a benefit to a tier, can fire in multiple succession if a 
                        // channel adds multiple benefits to a tier before saving that tier.
                        socket.on('tier-benefit-added', function(data, callback){
                            prettyPrint($('#messages'), 'tier-benefit-added', data);
                        });
                        
                        // same as tier-benefit-removed except for benefit removal.
                        socket.on('tier-benefit-removed', function(data, callback){
                            prettyPrint($('#messages'), 'tier-benefit-removed', data);
                        });




### On-Demand Events
