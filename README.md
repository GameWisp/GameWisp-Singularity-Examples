

# The Singularity API
The Singularity API is real-time API that is meant to be interacted with using WebSockets. Clients connect to the API and listen to specific events of interest and receive data from the API in real-time. Unlike a conventional REST API, **there is no need to repeatedly poll or request on specific endpoints**. So don't do it. This API is ideal for bots and other services that require immediate and on-going access to GameWisp data; however, request functionality (see: [On-Demand Events](#the-singularity-api-on-demand-events) ) is also included such that data can be provided to clients on-demand when necessary. 

Currently, the **Singularity API is read only**. Connected clients can receive data in real-time, but can perform no operation which alters the state of any data stored by GameWisp.

**This API is fully documented here: https://gamewisp.readme.io/docs/getting-started**

Fully functional [examples](https://github.com/GameWisp/GameWisp-Singularity-Examples/tree/master/examples) of using the API can be found here:

* [Skeleton-Service](https://github.com/GameWisp/GameWisp-Singularity-Examples/tree/master/examples/Skeleton-Service) - A NodeJS server that demonstrates how to work with Singularity.
* [TwitchBot](https://github.com/GameWisp/GameWisp-Singularity-Examples/tree/master/examples/Twitch-bot) - A NodeJS server application that passes data from Singularity into a Twitch channel's chat.


## Questions, Comments, Etc.

This API is an actively developed work in progress, and is considered beta software. If you have any recommendations, suggestions, or issues, feel free to file a GitHub issue on this repository, or email us at help [at] gamewisp [dot] com.

If you would like to include a working example of your own to this project, please submit a pull request. We're particularly interested in simple examples that leverage different programming languages and libraries than JavaScript and Socket.IO. 