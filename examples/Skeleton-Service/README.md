Skeleton-Service
================

This is a barebones service for working with Singularity. Use it to get an idea of how singularity works. Or use it with your client credentials and an access token to attempt to reproduce errors you may be having. If you're encountering a singularity issue in your own app, try to reproduce it using the skeleton-service before contacting help. 

Need singularity documentation? Here it is: https://gamewisp.readme.io/docs/introduction

Installation
-------------

Clone this repo to the location of your choosing. You must have Node and npm installed.

```startup.sh``` is useful if you're running from a docker container. If not, you can disregard it and just install the node packages referenced in the file if you don't have them already.

Usage
-----

To use this file you'll need to update the references to client credentials and the redirect url to reflect your actual information. The best approach is to generate some new client credentials with the redirect url pointing to ```/your-endpoint``` (see below). Then run this application and attempt to test the authorization flow for GameWisp Channels and/or Subscribers.

The application exposes four endpoints, they are:

* ``` / ``` - root path. Has some instructions

* ``` /auth ``` - use this to testing Auth'ing a gamewisp channel

* ``` /auth-subscriber ``` - use this to test Auth'ing a subscriber

* ``` /your-endpoint ``` - Name this whatever you want and use it as the redirect url for this app.


Help and Contact
----------------
If you encounter problems running this application, or are able to generate a reproducable but with Singularity using this application, please let us know by emailing help [at] gamewisp [dot] com. Or joining us in our Discord server: https://discord.gg/0ccZuyGqtaUxln5q