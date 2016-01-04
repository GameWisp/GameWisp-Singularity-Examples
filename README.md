

# GameWisp-Singularity-Examples
A public repository of code examples that leverage the GameWisp Singularity API. Singularity Documentation is also included.

**This documentation is very work in progress, and may be incomplete, incorrect, or victim to numerous typos. Bear with us -- this documentation is still a rough draft.**

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
	            
	            var socket = io('https://singularity.gamewisp.com');
	            
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

#### Encrypting Data

Channel credentials are used to validate any event your application may emit to the Singularity API. To ensure secure transmission of channel credentials, they are currently required to be submitted using AES-256 bit encryption. In practice, performing encryption and passing the required information is fairly straightforward. Using CryptoJS, for example, on a server application using NodeJS, would perform channel authorization as follows:

    var socketClient = require('socket.io-client')('https://singularity.gamewisp.com');
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


#### Successful Authorization
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

This event fires whenever a channel gains a new subscriber and has the following JSON structure:

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


### subscriber-renewed

Using Socket.IO, this event can be listened to as follows:

    socket.on('subscriber-renewed', function(data){
        //Do something
    });

This event sends identical data to the ```subscriber-new``` event but is included as its own unique event for convenience. The ```subscriber-renewed``` event fires whenever a subscriber is successfully billed for another month on GameWisp.

It is important to keep in mind that GameWisp processes renewals each day for all the channels that are flagged for renewal on that day at approximately 12:00PM CST. Therefore, if your application supports multiple GameWisp channels, it is not uncommon to receive multiple ```subscriber-renewed``` events in succession for channels as they are renewed.

#### subscriber-benefits-change

This is arguably the most important event for an application attempting to provide benefit fulfillment of some sort for GameWisp subscribers. As such, the event and its response are described in detail here. 

It is well worth familiarizing yourself with this section of the documentation in particular if you're looking to write an application that leverages singularity for benefit fulfillment (e.g., managing giveaways, channel currency, access to servers, Discord, etc.) 

Using Socket.IO, this event can be listened to as follows:

    socket.on('subscriber-benefits-change', function(data){
        //Do something
    });

This event fires whenever a subscriber's benefits change. A benefit change can be triggered by a user subscribing to a new channel, upgrading their subscription to a channel, or downgrading their subscription to a channel. This event can also fire if the channel makes changes to a tier that contains active subscribers. In this case, a ```subscriber-benefits-change``` event will fire for each subscriber currently in the modified tier. This event has the following JSON structure:

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
	         gamewisp: "111111",
	         twitch: "121212121212"
	      },
	      username: {
	         gamewisp: "gamewisp_username",
	         twitch: "twitch_username"
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
 
 The ```benefits``` array contains an array of benefit-fulfillment pairs. The benefit object in the pair describes a single benefit for the subscriber. The fulfillment object in the pair provides information about whether or not the benefit has been fulfilled.

 The benefit object:

 * **id**: The identifier for the benefit. Note that the "Premium Videos", "Early Access Videos", and "Subscriber Messaging" benefits will have the same identifier (1, 2, and 3 respectively) across GameWisp channels.
 * **delivery**: The delivery type of the benefit. This describes how the benefit is delivered by GameWisp.

 The delivery types are: 
 - ```delivery-messaging``` - Unique to the Subscriber Messaging benefit, indicates that the benefit allows the subscriber to access messaging features for the channel. 
 - ```delivery-video``` - Unique to the Early Access and Exclusive Video benefits. Indicates that the user can view early access and/or premium videos for the channel on GameWisp.
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
 - ```videos-exclusive``` - Access to videos hosted only on GameWisp.
 - ```videos-early``` - Access to videos hosted on GameWisp in their early access period.
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
	               granted_at: "2015-12-30 21:29:07.000000",
	               channel_cancelled_at: null,
	               status: "active"
	            }


* **id**: The unique identifier for the fulfillment object.
* **benefit_id**: The benefit identifier to which the fulfillment object belongs. In other words, a fulfillment object with ```benefit_id = 5``` was used to fulfill the benefit with ```id = 5``` for that particular channel.  
* **tier_id**: The unique identifier of the tier to which the fulfilled benefit belongs.
* **channel_fulfillment_response**: string. If the channel provided a response when fulfilling the benefit, it is provided here.
* **fulfilled_at**: datetime. A timestamp indicating when the benefit was fulfilled. Null if the benefit has not yet been fulfilled.
* **previously_fulfilled_at**: datetime. The date this benefit was last fulfilled by the channel. This is only non-null if the benefit is recurring and has been fulfilled previously. 
* **recurring**: boolean. True if the fulfillment object is for a recurring benefit, false otherwise.
* **granted_at**: datetime. The time that the benefit was awarded to the subscriber.
* **channel_cancelled_at**: datetime. The time that the channel cancelled this benefit for the subscriber. Only non-null if the benefit has been cancelled.
* **status**: The status of the fulfillment for the subscriber. Statuses are as follows:
 - ```active``` - The benefit fulfillment is currently active for the subscriber.
 - ```inactive``` - The benefit fulfillment is inactive and the subscriber should no longer receive it. 
 - ```delayed``` - The subscriber has the benefit, but its fulfillment is currently delayed. This occurs most often with recurring / delayed benefits.
 - ```dismissed-channel``` - The channel has dismissed this benefit for this subscriber.
 - ```dismissed-channel-email``` - The channel has dismissed this benefit for this subscriber and notified the subscriber of doing so via email.
 - ```dismissed-subscriber``` - The subscriber dismissed the benefit. This usually occurs when the subscriber does not want a benefit being offered by the channel.
 - ```cancelled-action-required``` - The benefit has been cancelled and the channel needs to take some action manually as a result. This action usually entails removing subscribers from third party services (e.g., game server whitelists, giveaway lists, etc.).
 - ```unknown-status``` - Error condition. Used when Singualrity does not know the status of a fulfillment object.


Additionally, this event contains information pertaining to the subscriber, their payment amount, etc. that can also be found in the ```subscriber-new``` event documentation.

#### subscriber-status-change

Using Socket.IO, this event can be listened to as follows:

    socket.on('subscriber-benefits-change', function(data){
        //Do something
    });

This event fires whenever the status of a subscriber changes. This change can be the result of a subscriber cancelling, a subscriber's recurring payment failing, etc. The event response has the following JSON structure:\

    {
	   event: "subscriber-status-change",
	   id: "channel identifier",
	   data: {
	      ids: {
	         gamewisp: "123222",
	         twitch: "95512221241604"
	      },
	      username: {
	         gamewisp: "gamewisp_username",
	         twitch: "twitch_username"
	      },
	      status: "trial",
	      amount: "2.99",
	      subscribed_at: "2015-12-31 18:44:07",
	      end_of_access: "2016-01-30 18:44:07",
	      tier: {
	         id: "123",
	         title: "Tier Title",
	         level: "1",
	         cost: "2.99",
	         description: "Tier description.",
	         published: true
	      }
    	}	
    }

The response is similar to the ```subscriber-new``` event, but the ```status``` field will contain the newly updated subscriber status. This event is not necessarily followed by a ```subscriber-benefits-change``` event.

#### benefit-fulfilled

Using Socket.IO this benefit can be listened to as follows:

    socket.on('benefit-fulfilled', function(data){
    	//Do something.                        
    });

This event fires when a channel fulfills a benefit. The structure of the response is similar to the ```subscriber-status-change``` except that the benefits array only contains the benefit-fulfillment pair of the filled benefit.

This event only fires for benefits that the channel fulfills manually through the GameWisp channel dashboard. 

#### benefit-dismissed-user

***Note: This event is currently not implemented, but should be very soon.***
Using Socket.IO this benefit can be listened to as follows:

    socket.on('benefit-dismissed-user', function(data){
    	//Do stuff.
    });

This event fires whenever a user dismisses and event they do not want. The structure of the JSON response is identical to the ```benefit-fulfilled``` event.

#### benefit-dismissed-channel

***Note: This event is currently not implemented, but should be very soon.***
Using Socket.IO this benefit can be listened to as follows:

    socket.on('benefit-dismissed-channel', function(data){
    	//Do stuff.
    });

This event fires whenever a user dismisses and event they do not want. The structure of the JSON response is identical to the ```benefit-fulfilled``` event.

#### tier-published

Using Socket.IO this benefit can be listened to as follows:

    socket.on('tier-published', function(data){
    	//Do stuff.
    });

The tier published event is fired whenever a channel publishes a subscriber tier. The tier may be new, or it may a tier that was unpublished and then published again by the channel. The JSON structure of the event is as follows:

    {
	   event: "tier-published",
	   id: "channel-id",
	   data: {
	      id: "12345",
	      title: "Tier Title",
	      level: "1",
	      cost: "4.00",
	      description: "Tier description.",
	      published: true,
	      subscribers: 0,
	      benefits: [
	         {
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
	         //...
	      ]
	   }
	}


The ```tier-published``` event contains the following ```data``` fields:

* **id**: The unique identifier of the tier.
* **title**: The title of the tier.
* **level**: The level of the tier. Minimum: 1, Maximum:6. This value is null for Twitch tiers.
* **cost**: The cost of the tier.
* **description**: The text description of the tier.
* **published**: The published state of the tier.
* **subscribers**: The count of subscribers currently in the tier.
* **benefits**: an array of benefits contained in the tier. 

Published tiers can be seen on a channel's GameWisp page. Subscribers can only be granted benefits from published tiers. However, if a subscriber is gaining benefits for a tier that a channel sets to unpublished, the subscriber still has access to those benefits since they were in a published tier at the time of subscription. Recurring benefits from an unpublished tier will not recur.

#### tier-unpublished

Using Socket.IO this benefit can be listened to as follows:

    socket.on('tier-unpublished', function(data){
    	//Do stuff.
    });

The analogue of the ```tier-published``` event. Fires when a channel unpublishes a tier. The response object is identical to ```tier-published```.

#### tier-modified

Using Socket.IO this benefit can be listened to as follows:

    socket.on('tier-modified', function(data){
    	//Do stuff.
    });


This event fires whenever a channel modifies their tiers. Due to the complexity of tier creation and editing (e.g., modifying one tier can potentially have an impact on others), the full list of tiers the channel has is returned in the ```tier-modified``` response. Depending on the number of tiers and benefits a channel has available, this response can be quite large.

	{
	   event: "tier-modified",
	   id: "channel identifier",
	   data: [
	      {
	         id: "12334",
	         title: "Tier Title",
	         level: "1",
	         cost: "3.99",
	         description: "Tier description.",
	         published: true,
	         benefits: [
	         	//array of benefit objects for this tier.
	         ]
	         subscribers: 0
	      },
	      //...
	   ]
	}


### On-Demand Events

On-demand events are simply event listeners on the API that respond to events fired by your application. All on-demand events require the following structure using Socket.IO:

    socket.emit('event-name', {
    	key: 'your developer key',
    	data: <AES-256 encrypted JSON data>
    })

See the **Channel Authorization: Encrypting Data** section of this README for an example of how  ```data``` should be encrypted for proper transmission to singularity. 

Each of the currently available on-demand events are discussed below. 

#### channels-listen

This event is used to request channels for which your application wants data. This event is the primary means of channel authorization, and is documented in detail in the ```Channel Authorization``` section of this README. It is used as follows:

	socket.emit('channels-listen', {
		key: 'your developer key',
		data: <AES-256 encrypted JSON data>
	});

where ```data``` is an AES-256 encrypted JSON object of the following form:

	[
        {   
            identifier: 'channel-identifier',
            key: 'channel-unique-key'
        },
        //...
    ];

and ```identifier``` and ```key``` are provided to your application by users.

This event emits ```app-channels-listened``` back to your application. See the **Successful Authorization*** section of this README for more discussion about ```app-channels-listened``` and channel authorization in general.

#### channels-unlisten

This event is used to stop listening to data for a particular channel. It is used as follows:

	socket.emit('channels-unlisten', {
		key: 'your developer key',
		data: <AES-256 encrypted JSON data>
	});

where ```data``` is an AES-256 encrypted JSON object of the following form:

	[
        {   
            identifier: 'channel-identifier',
            key: 'channel-unique-key'
        },
        //...
    ];


#### channels-subscribers

This event is used to return the current subscribers got a channel. It is used as follows:

	socket.emit('channels-subscribers', {
		key: 'your developer key',
		data: <AES-256 encrypted JSON data>
	});

where ```data``` is an AES-256 encrypted JSON object of the following form:

     
    [
        {   
            identifier: 'channel-identifier',
            key: 'channel-unique-key'
            params: {
                array: [<gamewisp-identifiers>], //default: []. An empty array or an array of gamewisp user ids, or an array of twitch usernames, or gamewisp usernames. An empty array will return all subscribers for the channel.
                status: 'all', // default: all. options: all, active, inactive, twitch.
                //sort: 'newest', // default: newest. options: newest, oldest
                //benefits: true, //default: false, options: true, false. returns the benefit data for each subscriber.
                //tier: true, //default: false, options: true, false.returns the tier for each subscriber
    
            }
        },
        //...
    ];

```params```  is a JSON object of optional parameters that can be used to request particular subscriber data for the specified channel(s). Each element of ```params``` is described as follows:

* **array**: An array of GameWisp user ids, twitch usernames, or GameWisp usernames or any combination thereof. If any of the specified elements belong to a subscriber of the particular channel, that subscriber's information will be returned. Specifying a list of users in this parameter limits all other optional parameters to only the list specified users. The default parameter is an empty array, which returns all of the subscribers for the channel.
* **status**: string. options include: 
 - 'all': Default. Does not filter the list of subscribers by status. 
 - 'active': Only returns subscribers that are active. 
 - 'inactive': Only returns subscribers if they are inactive.
 - 'twitch': Only returns subscribers if they are subscribed on Twitch. This only works for partnered channels. 
* **sort**: string. Applies a sort to the returned results. Options include:
 - 'newest': Default. Sort from newest to subscriber to oldest.
 - 'oldest': Sort from oldest subscriber to newest. 
* **benefits**: boolean. Default is false. If true, returns the benefits for each subscriber.
* **tier**: boolean. Default is false. If true, returns tier information for the subscriber. 

This event emits ```app-channels-subscribers``` back to your application upon completion. The returned JSON object has the following structure:

    {
	   result: {
	      status: 1,
	      message: "Channels Subscribers."
	   },
	   data: [
	      {
	         id: "channel-identifier",
	         status: "authenticated",
	         subscribers: [
	            {
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
	                        id: "49917",
	                        benefit_id: "3",
	                        tier_id: "856",
	                        channel_fulfillment_response: null,
	                        fulfilled_at: "2015-12-24 03:55:17",
	                        previously_fulfilled_at: null,
	                        disabled_at: null,
	                        user_input_provided_at: null,
	                        recurring: true,
	                        granted_at: {
	                           date: "2015-12-24 03:55:17.000000",
	                           timezone_type: 3,
	                           timezone: "UTC"
	                        },
	                        channel_cancelled_at: null,
	                        status: "active",
	                        user_input: null
	                     }
	                  },
	                  //...
	               ],
	               ids: {
	                  gamewisp: "12323",
	                  twitch: "455552422"
	               },
	               username: {
	                  gamewisp: "gamewisp-user-name",
	                  twitch: "twitch-user-name"
	               },
	               status: "active",
	               amount: "4.99",
	               subscribed_at: "2015-12-24 00:00:00",
	               end_of_access: "2016-01-24 23:59:00",
	               tier: {
	                  id: "123",
	                  title: "Tier Title",
	                  level: "1",
	                  cost: "4.99",
	                  description: "Tier description",
	                  published: true
	               }
	            },
	            //...
	         ]
	      }
	   ],
	   dev_key: "your-developer-key"
	}

The response object contains subscriber information (described in detail in the **Real Time Events: subscriber-new** event documentation earlier in this README), benefit-fulfillment pairs for the subscriber (see **Real Time Events: subscriber-benefits-change**), and the subscriber's tier (see **Real Time Events: subscriber-status-change**). Note that you will only receive the full object for a subscriber if both the ```benefit``` and ```tier``` parameters of ```channels-subscribers``` are true. 

Please note, that depending on how you use this event, the resulting response object can be **very** large. It is not recommended to grab all the benefit and tier information for every subscriber simultaneously. It is generally advisable to use this event to get a full list of subscribers for a channel, and then check the benefits of individual subscribers through subsequent calls. 

#### channels-tiers

This event is used to return the tiers for a channel. It is used as follows:

    [
        {   //valid
            identifier: 'channel-identifer',
            key: 'channel-unique-key',
            params: {
                subscriberInfo: true, 
                subscriberCount: true, 
                sort: 'oldest'
    
            }
        }
    ];


```params```  is a JSON object of optional parameters that can be used to request particular subscriber data for the specified channel(s) for each tier. Each element of ```params``` is described as follows:

* **subscriberInfo**: boolean. Default false. Returns subscriber info for each tier. 
* **subscriberCount**: boolean. Default is false. If true, returns the subscriber count for each tier.
* **sort**: string. Applies a sort to the returned results. Options include:
 - 'newest': Default. Sort from newest to subscriber to oldest.
 - 'oldest': Sort from oldest subscriber to newest. 

This event emits ```app-channels-tiers``` back to your application upon completion. The returned JSON object has the following structure:

	{
	   result: {
	      status: 1,
	      message: "Channels Tiers."
	   },
	   data: [
	      {
	         id: "channel-identifier",
	         status: "authenticated",
	         tiers: [
	            {
	               id: "123",
	               title: "Tier Title",
	               level: "1",
	               cost: "4.99",
	               description: "Tier description",
	               published: true,
	               subscriber_count: "12",
	               subscribers: [
	                  {
	                     ids: {
	                        gamewisp: "12354",
	                        twitch: null
	                     },
	                     username: {
	                        gamewisp: "gamewisp-user-name",
	                        twitch: null
	                     },
	                     status: "active",
	                     amount: "4.99",
	                     subscribed_at: "2015-05-21 00:00:00",
	                     end_of_access: "2016-01-21 00:00:00",
	                     tier_id: "123"
	                  },
	                 //...
	               ],
	               benefits: [
	                  {
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
	                  //...
	               ]
	            },
	            //...
	         ]
	      }
	   ],
	   dev_key: "9c22873cc11b24a3d447ad135ef89ade"
	}

Note that if subscriberCount and subscriberInfo are false, the 'subscriber_count' and 'subscribers' fields will not be present.

## Questions, Comments, Etc.

This API is an actively developed work in progress, and is considered beta software. If you have any recommendations, suggestions, or issues, feel free to file a GitHub issue on this repository, or email us at help [at] gamewisp [dot] com.