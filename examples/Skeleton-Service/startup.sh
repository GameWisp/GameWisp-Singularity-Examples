#!/bin/bash

# a startup script for the skeleton-service. Meant to be used inside a docker container, but will probably work regardless.

# you could also just start the app from the command line and install the below packages using the app's package.json and/or install them
# globally once. Whatever. It's your life, man.
# This is here because symbolic links through node just get weird in Docker, and I'm lazy, so I do it this way. 

# set the path to the skeleton-service directory on your computer here.
#cd /path/to/Skeleton-Service

# install the package.json
npm install --no-bin-links

#we have to custom install a couple of libraries for some weird reason.
npm install socket.io-redis --no-bin-links

npm install crypto-js --no-bin-links

npm install simple-oauth2 --no-bin-links

npm install uglify-js --no-bin-links

#convenience for nicer printing of json in the terminal.
npm install prettyjson --no-bin-links


# start node
/usr/local/bin/node /home/GameWisp-NodeJS/skeleton-service/app.js 
#done!