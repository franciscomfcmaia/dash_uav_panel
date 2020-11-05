# UAV Dash Streaming Web Panel

This node project is a wrapper to my other project. This makes it easy and convinient to run multiple streaming tests using all the same presets.

## Screenshots

This is a screenshot of the preset selection page.

![Main Page With A Preset](https://i.imgur.com/yaBeu8x.png)

This is a screenshot of statistics than can be viewed. ***You can selected multiple statistics.***

![Statistics](https://i.imgur.com/0jmmYyY.png)

***Play back options for the stream.***

![Playback Options](https://i.imgur.com/lB3HF6e.png)
## Requirements

For development, you will only need Node.js and a node global package, Yarn, installed in your environement.

### Dash Streaming For Node.JS
- You can install and follow the instructions here: [Dash For Node Github](https://github.com/franciscomfcmaia/uav_dash_streaming_node)
## Install

    $ git clone https://github.com/franciscomfcmaia/dash_uav_panel
    $ cd dash_uav_panel
    $ npm install

## Running the project

This project must be ran with some flags. 

###  Port Option Flag
This option will specify a port that will be use. The port will be used to serve a static folder with the outputted stream.

An example:

```
$ node server.js --port 3000
```

###  dirServer Configuration Flag
This option will specify the directory where the webserver files are located. 

***Note : I do not recommend you change this around.***

```
$ node server.js --dirServer ./http/
```

###  Dash Directory Configuration Flag
This option will specify the directory where the mpd files from the transcoder should be placed and served.

***Note : I do not recommend you change this around. This option will change a lot in the behaviour of the software.***

```
$ node server.js --dirDash ./http_dash/stream.mpd
```

###  Spawn Node Configuration Flag
This option will specify the directory for whre the dash for node.js wrapper is installed. I recommend that you do not place them in the same directory. In my setup I had them both in the home directory.

***Note : I do not recommend you change this around. This option will change a lot in the behaviour of the software.***

```
$ node server.js --spawnNode ~/uav_dash_streaming_node/server.js
```

###  Putting it all together

 A fully loaded command line will look like this.
```
$ node node server.js --dirServer ./http/ --port 5000 \
--dirDash ./http_dash/stream.mpd \
--spawnNode ~/uav_dash_streaming_node/server.js
```
