

# The Singularity API
The Singularity API is real-time API that is meant to be interacted with using WebSockets. Clients connect to the API and listen to specific events of interest and receive data from the API in real-time. Unlike a conventional REST API, **there is no need to repeatedly poll or request on specific endpoints**. So don't do it. This API is ideal for bots and other services that require immediate and on-going access to GameWisp data; however, request functionality (see: [On-Demand Events](#the-singularity-api-on-demand-events) ) is also included such that data can be provided to clients on-demand when necessary. 

Currently, the **Singularity API is read only**. Connected clients can receive data in real-time, but can perform no operation which alters the state of any data stored by GameWisp.

**A more visually appealing form of these docs can be accessed at: https://singularity.gamewisp.com/docs**

**This documentation is very work in progress, and may be incomplete, incorrect, or victim to numerous typos. Bear with us -- this documentation is still a rough draft.**

Fully functional [examples](https://github.com/GameWisp/GameWisp-Singularity-Examples/tree/master/examples) of using the API can be found here:

* [Client](https://github.com/GameWisp/GameWisp-Singularity-Examples/tree/master/examples/SocketIO-client-app) - A single page application with minimal dependencies that interacts with Singularity directly in the browser.
* [Server](https://github.com/GameWisp/GameWisp-Singularity-Examples/tree/master/examples/SocketIO-server-app) - A NodeJS server that communicates with Singularity.
* [TwitchBot](https://github.com/GameWisp/GameWisp-Singularity-Examples/tree/master/examples/Twitch-bot) - A NodeJS server application that passes data from Singularity into a Twitch channel's chat.

## Obtaining Credentials

If you're a developer who wishes to build something with the Singularity API, email us at **help [at] gamewisp [dot] com** and we'll get you a set of developer credentials. Requesting credentials will only be necessary while the API is in closed beta. 

## Quick Start

Singularity can be accessed by both client and server side applications. This minimal example was taken from the [SocketIO-client-app](https://github.com/GameWisp/GameWisp-Singularity-Examples/tree/master/examples/SocketIO-client-app) example. 

```html    
<!doctype html>
<html>
    <head>
        <script src="https://cdn.socket.io/socket.io-1.2.0.js"></script>
   	        
        <script>
            
            // Do not expose your secret! 
            var devCredentials = {
                key: "<OAuth Client ID>",
                secret: "<OAuth Client Secret>"
            };
            
            var socket = io("https://singularity.gamewisp.com");
            
            socket.on("connect", function(){

                socket.emit("authentication", 
                    {
                        key: devCredentials.key, 
                        secret: devCredentials.secret,
                    }
                );
            
                socket.on("authenticated", function(data) {
                    
                    // Emit "channel-connect" event to authorize access to channels.
                    socket.emit("channel-connect", {
                       access_token: "<Channel OAuth Token>"
                    });

                    socket.on("app-channel-connected", function(response){
                        //...                    
                    });

                    socket.on("event-of-interest", function(response){
                        //...
                    });
                });
            });
        </script>
    </head>
    <body>
    </body>
</html>
```
Note that in order to connect to Singularity you must generate OAuth client credentials for your application. You must also have an OAuth token for the channel(s) you wish to receive data about.

## Authorization and Authentication


### Client Authentication

Clients are authenticated using an OAuth2 client ID and client secret. To generate these credentials, you must visit [https://gamewisp.com](https://gamewisp.com), create a GameWisp Channel, and visit the Integrations page found in the Configuration menu on your channel dashboard.

Once you have a generated a client ID and secret, authentication is handled programmatically as follows:

```javascript
socket.emit('authentication', 
    {
        key: "your client ID", 
        secret: "your client secret",
    }
);
```

The API will respond with the ```authenticated``` event if your credentials are properly authenticated:

```javascript
socket.on('authenticated', function(response) {
	//your logic here
});
```


The contents of the ```response``` object on a successful authentication is a JSON object of the following form:

```json
{
    result: {
      status: 1,
      message: "Client authentication successful."
    },
}
```

### Channel Authorization


In order to access data for any GameWisp channel, your application must be authorized by that channel. Channel authorization uses OAuth2, so you will need to provide some method for a GameWisp channel to authenticate using OAuth2 within your application. Currently the API only supports the OAuth2 AuthCode style grant. The authorization flow is as follows:

1. Build a url to the authorize endpoint and put it in a link on a page on your site. 
2. Once the user clicks on that link, they'll be directed to the /api/v1/oauth/authorize endpoint on Gamewisp.
3. The user will either approve access to your app or decline. In either case, they'll be redirected to the **redirect_uri** you specify with an authorization code (in the case of approval) or an error (in the case of denying access). 
4. If the user approved access, take the **code** parameter and use the /api/v1/oauth/token endpoint to receive an **access_ token** and a **refresh_token**.

An example of how to perform these operations using NodeJS with Express and the simple-oauth2 package is as follows:

```javascript

var app = require('express')();


var oAuthInfo = {
  site: 'https://gamewisp.com',
  clientID: 'your client ID',
  clientSecret: 'your client secret',
  tokenPath: '/api/v1/oauth/token',
  authorizationPath: '/api/v1/oauth/authorize',
};  

var oauth2 = require('simple-oauth2')(oAuthInfo);

// Authorization uri definition 
var authorization_uri = oauth2.authCode.authorizeURL({
  redirect_uri: 'your-redirect-uri',
  scope: 'read_only',
  state: 'base64 encoded state data, passed back to you'
});

//redirects to the gamewisp authorize page.
app.get('/auth', function(req, res){
  res.redirect(authorization_uri);
});

app.get('your-redirect-uri', function(req, res){
var token = oauth2.authCode.getToken({
    code: code,
    redirect_uri: 'your-redirect-uri'
  }).then(function saveToken(result){
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

    accessToken = token.token.data.access_token;
    //store and use the token...
    
  }).catch( function logError(error){
    //your error catching here.
});


```

Of course, you can accomplish authentication by nearly any means that sends data to the appropriate endpoint. Here's an example using Guzzle in PHP:

```php

 // assume $code is obtained via redirect from the user visiting a url of the following structure:
 // https://gamewisp.com/api/v1/oauth/authorize?client_id=CLIENT_ID_HERE&redirect_uri=REDIRECT_URI_HERE&response_type=code&scope=read_only

 //if using Guzzle 6+ change "body" to "form_params"
 $response = $guzzleClient->post('https://gamewisp/api/v1/oauth/token', [
        'form_params' => [
          'grant_type'    => 'authorization_code',
          'client_id'     => 'your client ID',
          'client_secret' => 'your client secret',
          'redirect_uri'  => 'your redirect uri',
          'code'          => $code
        ]
      ]);

      $result = json_decode($response->getBody());

```


### Access Token Expiry

Singularity uses refresh tokens to renew expired OAuth2 access tokens. If a token expires, you simply use the /api/v1/oauth/token endpoint with the **refresh_token** grant type as follows:


``` javascript

var oAuthInfo = {
  site: 'https://gamewisp.com',
  clientID: 'your client ID',
  clientSecret: 'your client secret',
  tokenPath: '/api/v1/oauth/token',
  authorizationPath: '/api/v1/oauth/authorize',
};

var oauth2 = require('simple-oauth2')(oAuthInfo);

// Sample of a JSON access token you obtained through previous steps
var token = {
  'access_token': 'access_token',
  'refresh_token': 'refresh_token',
  'expires_in': '3600'
};

var token = oauth2.accessToken.create(token);

if (token.expired()) {
  token.refresh(function(error, result) {
    token = result;
  });
}

```
Again, this is achieved in PHP using the Guzzle library as follows:

``` php

// if using Guzzle 6+ change "body" to "form_params"
$response = $guzzleClient->post('https://gamewisp.com/api/v1/oauth/token', [
    'body' => [
      'grant_type'    => 'refresh_token',
      'client_id'     => 'your client ID',
      'client_secret' => 'your client secret',
      'redirect_uri'  => 'your redirect uri',
      'refresh_token' => 'the refresh token'
    ]
  ]);

  $result = $response->json();

```

### Connecting to a GameWisp Channel with Singularity

Once you have an OAuth2 token for a GameWisp channel, you can connect to that channel through Singularity like so:

``` javascript

socket.emit('channel-connect', {
    access_token: 'channel oauth2 access token'
});


```

If the token has expired, you will receive a message indicating as such. If that's the case, you will need to refresh the token. 


### Successful Authorization
Upon verifying the channel's access token, Singularity will emit the [app-channel-connected](#the-singularity-api-authorization-and-authentication-successful-authorization) event to your application, which you can listen for as follows:

```javascript
 socketClient.on('app-channel-connected', function(response){
      //Do something with the response                           
  });
```

The response is a JSON object of the form:

```json
{
  result: {
    status: 1,
    message: "Channel authenticated."
  },
  data: {
    channel_id: "channel identifier",
    status: 'authenticated',
    listening: true
  },
  channel:{
    names:{
      gamewisp: 'gamewisp channel name',
      twitch: 'twitch channel name',
      youtube: 'youtube channel name'
    },
    ids:{
      gamewisp: 'gamewisp channel id',
      twitch: 'twitch channel id',
      youtube: 'youtube channel id'
    }
  }
}
```

```result``` contains the overall status of the call. A status of 1 indicates success, 0 indicates failure.  ```data``` contains the following:

* **id**: string. The channel's identifying key.
* **status**: string. The status of the authorization attempt. "authenticated" for a successful authorization, "invalid" if there is a problem with the key-identifier pair you passed in for that channel in [channels-listen](#the-singularity-api-on-demand-events-channels-listen).
* **listening**: boolean. Indicates that you will receive real time data for the channel as it occurs. 


If you receive a ```listening: true``` for a channel, you will receive data for that channel from singularity in real-time as it occurs.

The ```channel``` object identifies the channel's gamewisp name and id as well as twitch and youtube identifying information if available.

## Real-Time Events

Once a channel is authenticated, your application can receive data pertaining to that channel by listening for any or all of 10 different events. Pick and choose the events that pertain to your particular use case. Data from real-time events is JSON formatted, and will have the following basic structure:

```json
{
	event: "event-name",
	id: "channel identifier",
	channel: {
      names: {
         gamewisp: "GameWisp channel name",
         twitch: "twitch channel name",
         youtube: "youtube channel name"
      },
      ids: {
         gamewisp: "gamewisp-singualrity-id",
         twitch: "12312312q",
         youtube: "UCiqp4J8asdkssssssssdfae"
        }
    }
	data: {
		//data for the particular event.
	}
}
```

The ```channel``` object contains channel identifying information for GameWisp and any platform the channel may have linked to GameWisp (i.e., Twitch and/or YouTube).


The ```data``` object contains information pertaining to the event. This object is unique for every event type, but contains some common elements that are described as follows:

The IDs of the user. If the user has a twitch account linked to GameWisp, their Twitch ID is also provided. If not, it is null.

```json    
ids: {
         gamewisp: "1111",
         twitch: "22222222"
      },
```

The user names of the user. If the user's twitch account is linked to GameWisp, the twitch username is also provided. If not, it is null. 

```json
usernames: {
         gamewisp: "user_name",
         twitch: "user_name_on_twitch"
      },
```

There are currently 10 events an application can choose to listen to for each authorized channel. They are as follows:

### subscriber-new

Using Socket.IO, this event can be listened to as follows:

```javascript
socket.on('subscriber-new', function(data){
    //Do something
});
```

This event fires whenever a channel gains a new subscriber and has the following JSON structure:

```json
 {
   event: "subscriber-new",
   channel_id: "channel identifier ",
   channel: {
      names: {
         gamewisp: "GameWisp channel name",
         twitch: "twitch channel name",
         youtube: "youtube channel name"
      },
      ids: {
         gamewisp: "channel identifier",
         twitch: "12312312q",
         youtube: "UCiqp4J8asdkssssssssdfae"
      }  
   },
   data: {
      ids: {
         gamewisp: "26356",
         twitch: "46984772"
      },
      usernames: {
         gamewisp: "user_name",
         twitch: "user_name_twitch"
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
```



* **status**: The subscriber's current status. Can be any of the following: ```active``` - a currently active subscriber, ```trial``` - a subscriber on a trial code, ```grace_period``` - a canceled subscriber that is still received benefits, ```billing_grace_period``` - a canceled subscriber still receiving benefits that was canceled due to a payment processing error, ```inactive``` - a subscriber that is canceled and receiving no benefits, ```twitch``` - a subscriber that is receiving free benefits from a partnered Twitch streamer.

* **amount**: The amount currently paid by the subscriber. Does not currently include additional money paid by the subscriber over the cost of their subscription tier.

* **subscribed_at**: The date and time at which the subscriber subscribed to the channel.

* **end_of_access**: The approximate date and time at which the subscriber's subscription is to be renewed. 

* **tier**: Basic information about the tier to which the subscriber has subscribed. Does not contain individual benefits.


This event fires as soon as a subscriber has newly subscribed to a channel. It is always immediately followed by the [subscriber-benefits-change](#the-singularity-api-real-time-events-subscriber-benefits-change) event.


### subscriber-renewed

Using Socket.IO, this event can be listened to as follows:

```javascript
socket.on('subscriber-renewed', function(data){
    //Do something
});
```

This event sends identical data to the [subscriber-new](#the-singularity-api-real-time-events-subscriber-new) event but is included as its own unique event for convenience. The [subscriber-renewed](#the-singularity-api-real-time-events-subscriber-renewed) event fires whenever a subscriber is successfully billed for another month on GameWisp.

It is important to keep in mind that GameWisp processes renewals each day for all the channels that are flagged for renewal on that day at approximately 12:00PM CST. Therefore, if your application supports multiple GameWisp channels, it is not uncommon to receive multiple [subscriber-renewed](#the-singularity-api-real-time-events-subscriber-renewed) events in succession for channels as they are renewed.

### subscriber-benefits-change

This is arguably the most important event for an application attempting to provide benefit fulfillment of some sort for GameWisp subscribers. As such, the event and its response are described in detail here. 

It is well worth familiarizing yourself with this section of the documentation in particular if you're looking to write an application that leverages singularity for benefit fulfillment (e.g., managing giveaways, channel currency, access to servers, Discord, etc.) 

Using Socket.IO, this event can be listened to as follows:

```javascript
socket.on('subscriber-benefits-change', function(data){
    //Do something
});
```

This event fires whenever a subscriber's benefits change. A benefit change can be triggered by a user subscribing to a new channel, upgrading their subscription to a channel, or downgrading their subscription to a channel. This event can also fire if the channel makes changes to a tier that contains active subscribers. In this case, a [subscriber-benefits-change](#the-singularity-api-real-time-events-subscriber-benefits-change) event will fire for each subscriber currently in the modified tier. This event has the following JSON structure:

```json
{
   event: "subscriber-benefits-change",
   channel_id: "channel identifier",
   channel: {
      names: {
         gamewisp: "GameWisp channel name",
         twitch: "twitch channel name",
         youtube: "youtube channel name"
      },
      ids: {
         gamewisp: "channel identifier",
         twitch: "12312312q",
         youtube: "UCiqp4J8asdkssssssssdfae"
        }
    }
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
               tier_bonus: false,
               quantity: 1,
               multiplier: 1
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
      usernames: {
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
```
 
 The ```benefits``` array contains an array of benefit-fulfillment pairs. The benefit object in the pair describes a single benefit for the subscriber. The fulfillment object in the pair provides information about whether or not the benefit has been fulfilled.

 The benefit object:

```json
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
   tier_bonus: false,
   quantity: 1,
   multiplier: 1
},
```

 * **id**: The identifier for the benefit. Note that the "Premium Videos", "Early Access Videos", and "Subscriber Messaging" benefits will have the same identifier (1, 2, and 3 respectively) across GameWisp channels.
 * **delivery**: The delivery type of the benefit. This describes how the benefit is delivered by GameWisp.
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
* **quantity**: integer. The amount of the benefit. Default is 1. This field is only relevant for benefits of the type ```currency-more```.
* **multiplier**: integer. A multiplier on the benefit. Default is 1. This field is only relevant for benefits of the ```currency-multiplier``` type.


The fulfillment object represents how the benefit is fulfilled by the channel. It is described as follows:

```json
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
```

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

### subscriber-status-change

Using Socket.IO, this event can be listened to as follows:

```javascript
socket.on('subscriber-benefits-change', function(data){
    //Do something
});
```

This event fires whenever the status of a subscriber changes. This change can be the result of a subscriber cancelling, a subscriber's recurring payment failing, etc. The event response has the following JSON structure:\

```json
{
   event: "subscriber-status-change",
   channel_id: "channel identifier",
   channel: {
      names: {
         gamewisp: "GameWisp channel name",
         twitch: "twitch channel name",
         youtube: "youtube channel name"
      },
      ids: {
         gamewisp: "channel identifier",
         twitch: "12312312q",
         youtube: "UCiqp4J8asdkssssssssdfae"
      }  
   },
   data: {
      ids: {
         gamewisp: "123222",
         twitch: "95512221241604"
      },
      usernames: {
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
```

The response is similar to the [subscriber-new](#the-singularity-api-real-time-events-subscriber-new) event, but the ```status``` field will contain the newly updated subscriber status. This event is not necessarily followed by a [subscriber-benefits-change](#the-singularity-api-real-time-events-subscriber-benefits-change) event.

### benefit-fulfilled

Using Socket.IO this benefit can be listened to as follows:

```javascript
socket.on('benefit-fulfilled', function(data){
	//Do something.                        
});
```

This event fires when a channel fulfills a benefit. The structure of the response is similar to the [subscriber-status-change](#the-singularity-api-real-time-events-subscriber-status-change) except that the benefits array only contains the benefit-fulfillment pair of the filled benefit.

This event only fires for benefits that the channel fulfills manually through the GameWisp channel dashboard. 

### benefit-dismissed-user

***Note: This event is currently not implemented, but should be very soon.***
Using Socket.IO this benefit can be listened to as follows:

```javascript
socket.on('benefit-dismissed-user', function(data){
	//Do stuff.
});
```

This event fires whenever a user dismisses and event they do not want. The structure of the JSON response is identical to the [benefit-fulfilled](#the-singularity-api-real-time-events-benefit-fulfilled) event.

### benefit-dismissed-channel

***Note: This event is currently not implemented, but should be very soon.***
Using Socket.IO this benefit can be listened to as follows:

```javascript
socket.on('benefit-dismissed-channel', function(data){
	//Do stuff.
});
```

This event fires whenever a user dismisses and event they do not want. The structure of the JSON response is identical to the [benefit-fulfilled](#the-singularity-api-real-time-events-benefit-fulfilled) event.

### tier-published

Using Socket.IO this benefit can be listened to as follows:

```javascript
socket.on('tier-published', function(data){
	//Do stuff.
});
```

The tier published event is fired whenever a channel publishes a subscriber tier. The tier may be new, or it may a tier that was unpublished and then published again by the channel. The JSON structure of the event is as follows:

```json
{
   event: "tier-published",
   channel_id: "channel-id",
   channel: {
      names: {
         gamewisp: "GameWisp channel name",
         twitch: "twitch channel name",
         youtube: "youtube channel name"
      },
      ids: {
         gamewisp: "channel identifier",
         twitch: "12312312q",
         youtube: "UCiqp4J8asdkssssssssdfae"
      }  
   },
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
            tier_bonus: false,
            quantity: 1,
            multiplier: 1
         },
         //...
      ]
   }
}
```


The [tier-published](#the-singularity-api-real-time-events-tier-published) event contains the following ```data``` fields:

* **id**: The unique identifier of the tier.
* **title**: The title of the tier.
* **level**: The level of the tier. Minimum: 1, Maximum:6. This value is null for Twitch tiers.
* **cost**: The cost of the tier.
* **description**: The text description of the tier.
* **published**: The published state of the tier.
* **subscribers**: The count of subscribers currently in the tier.
* **benefits**: an array of benefits contained in the tier. 

Published tiers can be seen on a channel's GameWisp page. Subscribers can only be granted benefits from published tiers. However, if a subscriber is gaining benefits for a tier that a channel sets to unpublished, the subscriber still has access to those benefits since they were in a published tier at the time of subscription. Recurring benefits from an unpublished tier will not recur.

### tier-unpublished

Using Socket.IO this benefit can be listened to as follows:

```javascript
socket.on('tier-unpublished', function(data){
	//Do stuff.
});
```

The analogue of the [tier-published](#the-singularity-api-real-time-events-tier-unpublished) event. Fires when a channel unpublishes a tier. The response object is identical to [tier-published](#the-singularity-api-real-time-events-tier-unpublished).

### tier-modified

Using Socket.IO this benefit can be listened to as follows:

```javascript
socket.on('tier-modified', function(data){
	//Do stuff.
});
```


This event fires whenever a channel modifies their tiers. Due to the complexity of tier creation and editing (e.g., modifying one tier can potentially have an impact on others), the full list of tiers the channel has is returned in the [tier-modified](#the-singularity-api-real-time-events-tier-modified) response. Depending on the number of tiers and benefits a channel has available, this response can be quite large.

```json
{
   event: "tier-modified",
   channel_id: "channel identifier",
   channel: {
      names: {
         gamewisp: "GameWisp channel name",
         twitch: "twitch channel name",
         youtube: "youtube channel name"
      },
      ids: {
         gamewisp: "channel identifier",
         twitch: "12312312q",
         youtube: "UCiqp4J8asdkssssssssdfae"
      }  
   },
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
```


## On-Demand Events

On-demand events are simply event listeners on the API that respond to events fired by your application. 

On-demand events are the correct approach when you need to query the API directly for information. For example, if you need to determine whether or not a user in a Twitch chat room is a GameWisp subsciber, you would use the [channel-subscribers](#the-singularity-api-on-demand-events-channel-subscribers) on-demand event. 


All on-demand events require the following structure using Socket.IO:

```javascript
socket.emit('event-name', {
	access_token: "channel OAuth2 access token"
});
```


### channel-connect

This event is used to request channels for which your application wants data. This event is the primary means of channel authorization, and is documented in detail in [Channel Authorization](#the-singularity-api-authorization-and-authentication-channel-authorization). It is used as follows:

```javascript
socket.emit('channel-connect', {
	access_token: "channel OAuth2 access token" 
});
```


This event emits ```app-channel-connected``` back to your application. See the [Successful Authorization](#the-singularity-api-authorization-and-authentication-successful-authorization) section of this README for more discussion about channel authorization.

### channel-disconnect

This event is used to stop listening to data for a particular channel. It is used as follows:

```javascript
socket.emit('channel-disconnect', {
	access_token: "channel OAuth2 access token" 
});
```

This event emits ```app-channel-disconnected```, which has an identical structure to the ```app-channel-connected``` event.

### channel-subscribers

This event is used to return the current subscribers got a channel. It is used as follows:

```javascript
socket.emit('channel-subscribers', {
	access_token: "channel OAuth2 access token",
  params: {
      array: [<gamewisp-identifiers>],
      status: 'all', 
      sort: 'newest', 
      benefits: true, 
      tier: true, 
  }
});
```


```params```  is a JSON object of optional parameters that can be used to request particular subscriber data for the specified channel. Each element of ```params``` is described as follows:

* **array**: An array of **GameWisp user ids, twitch usernames, or GameWisp usernames or any combination thereof**. If any of the specified elements belong to a subscriber of the particular channel, that subscriber's information will be returned. Specifying a list of users in this parameter limits all other optional parameters to only the list specified users. The default parameter is an empty array, which returns all of the subscribers for the channel.
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

This event emits ```app-channel-subscribers``` back to your application upon completion. You can listen for this event using Socket.IO as follows:

```javascript
  socket.on('app-channel-subscribers', function(response){
    // Do something with response.
  });
```

The response JSON object has the following structure:

```json
{
   result: {
      status: 1,
      message: "Channel Subscribers."
   },
   channel: {
      names: {
         gamewisp: "GameWisp channel name",
         twitch: "twitch channel name",
         youtube: "youtube channel name"
      },
      ids: {
         gamewisp: "channel identifier",
         twitch: "12312312q",
         youtube: "UCiqp4J8asdkssssssssdfae"
      }  
   },
   data: 
      {
       channel_id: "channel-identifier",
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
                      tier_bonus: false,
                      quantity: 1,
                      multiplier: 1
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
             usernames: {
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
         
      }
   ],
}
```

The response object contains subscriber information (described in detail in the [subscriber-new](#the-singularity-api-real-time-events-subscriber-new) event documentation earlier in this README), benefit-fulfillment pairs for the subscriber (see [subscriber-benefits-change](#the-singularity-api-real-time-events-subscriber-benefits-change) ), and the subscriber's tier (see [subscriber-status-change](#the-singularity-api-real-time-events-subscriber-status-change) ). Note that you will only receive the full object for a subscriber if both the ```benefit``` and ```tier``` parameters of ```channel-subscribers``` are true. 

Please note, that depending on how you use this event, the resulting response object can be **very** large. It is not recommended to grab all the benefit and tier information for every subscriber simultaneously. It is generally advisable to use this event to get a full list of subscribers for a channel, and then check the benefits of individual subscribers through subsequent calls. 

### channel-tiers

This event is used to return the tiers for a channel. It is used as follows:

```javascript
socket.emit('channel-tiers', {
  access_token: "channel Oauth2 access token"
  params: {
      subscriberInfo: true, 
      subscriberCount: true, 
      sort: 'oldest'
  }
});
```

```params```  is a JSON object of optional parameters that can be used to request particular subscriber data for the specified channel(s) for each tier. Each element of ```params``` is described as follows:

* **subscriberInfo**: boolean. Default false. Returns subscriber info for each tier. 
* **subscriberCount**: boolean. Default is false. If true, returns the subscriber count for each tier.
* **sort**: string. Applies a sort to the returned results. Options include:
 - 'newest': Default. Sort from newest to subscriber to oldest.
 - 'oldest': Sort from oldest subscriber to newest. 

This event emits ```app-channel-tiers``` back to your application upon completion. If using Socket.IO, you would listen for the event as follows:

```javascript
  socket.on('app-channel-tiers', function(response){
    // Do something with response.
  });
```


The response JSON object has the following structure:

```json
{
   result: {
      status: 1,
      message: "Channel Tiers."
   },
   channel: {
      names: {
         gamewisp: "GameWisp channel name",
         twitch: "twitch channel name",
         youtube: "youtube channel name"
      },
      ids: {
         gamewisp: "channel identifier",
         twitch: "12312312q",
         youtube: "UCiqp4J8asdkssssssssdfae"
      }  
   },
   data: [
      {
         channel_id: "channel-identifier",
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
                     usernames: {
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
                     tier_bonus: false,
                     quantity: 1,
                     multiplier: 1
                  },
                  //...
               ]
            },
            //...
         ]
      }
   ],
   dev_key: "your-developer-key"
}
```

Note that if subscriberCount and subscriberInfo are false, the 'subscriber_count' and 'subscribers' fields will not be present.

## Questions, Comments, Etc.

This API is an actively developed work in progress, and is considered beta software. If you have any recommendations, suggestions, or issues, feel free to file a GitHub issue on this repository, or email us at help [at] gamewisp [dot] com.

If you would like to include a working example of your own to this project, please submit a pull request. We're particularly interested in simple examples that leverage different programming languages and libraries than JavaScript and Socket.IO. 