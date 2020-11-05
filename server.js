//Options
const commandLineArgs = require('command-line-args')
const optionDefinitions = [
  { name: 'port', type: Number, defaultValue: 3000 },
  { name: 'dirServer', type: String },
  { name: 'dirDash', type: String},
  { name: 'spawnNode', type: String}
]
const options = commandLineArgs(optionDefinitions)
//Setting logging option & pretty
const bunyan = require('bunyan');
var PrettyStream = require('bunyan-pretty-colors');
var prettyStdOut = new PrettyStream();
prettyStdOut.pipe(process.stdout);
const bunyanOpts = { //Logging Options
    name: 'dash_uav_panel',
    streams: [
      {
        level: 'debug',
        path: __dirname+'/logs/logs.json'  // log INFO and above to a file
      },
      {
        level: 'debug',
        type: 'raw',
        stream: prettyStdOut
      }
    ]
};
var logger = bunyan.createLogger(bunyanOpts);
//Requiring modules
const http = require('http');
const express = require('express');
const path = require('path');
const fs = require('fs');
const presets = require('./presets.js')
var { spawn } = require('child_process');
//Global vars
var spawnedTranscoder = null
var transcoderStatus = {
  mode : "stopped",
  logs : [],
  output : ""
}
//Program start
logger.info("program starting")

const uavPanel = express();
uavPanel.use(express.json());
uavPanel.use(express.static("express"));

try{
  var resolveHome = function (filepath) {
    if (filepath[0] === '~') {
        return path.join(process.env.HOME, filepath.slice(1));
      }else if(filepath[0] === '.'){
        return path.join(__dirname, filepath.slice(1));
      }
    return filepath;
  }
  var panelFolder = resolveHome(options.dirServer); // webserver folder
  var dashFolder = resolveHome(options.dirDash); // webserver folder
  var spawnNode = resolveHome(options.spawnNode); // spawnNode folder
  var baseFolder = dashFolder.substring(0, dashFolder.lastIndexOf("/"))
  baseFolder = baseFolder + "/"
  logger.info(`will serve from folder => ${panelFolder}`)
  logger.info(`will serve dash folder => ${baseFolder}`)
  logger.info(`will spawn => ${spawnNode}`)
}catch(err){
  logger.error(`could not resolve path name => ${options.dirServe}, ${err}`)
}

// default URL for our panel
uavPanel.use(express.static(panelFolder)); //Serves resources from panel folder
uavPanel.use('/http_dash/', express.static(baseFolder)); //Serves resources from panel folder

uavPanel.use('/test', function(req,res){
    res.send("ok");
    //__dirname : It will resolve to your project folder.
  });
//Child Spawner
var startTranscoder = function(presetConfiguration){
  if(spawnedTranscoder==null){
    //Prepare
    presetConfiguration.unshift(options.spawnNode)
    presetConfiguration.push("--mpdOutput")
    presetConfiguration.push(`"${dashFolder}"`)

    logger.info(`will spawn with => ${presetConfiguration}`)
    //Spawn
    spawnedTranscoder = spawn('/usr/bin/node', presetConfiguration, { shell: true, detached: true });
    transcoderStatus["mode"] = "starting"
    spawnedTranscoder.stdout.setEncoding('utf8');
    spawnedTranscoder.stdout.on('data', function(data) {
      transcoderStatus["logs"].push(data)
      logger.info(`transcoder output => ${data}`)
      if(data.includes('ffmpeg spawned')){
        logger.info(`outputting => ${options.dirDash}`)
        transcoderStatus["mode"] = "running"
        transcoderStatus["output"] = options.dirDash
      }else if(data.includes("ERROR")){
        //Here is where the error output goes
        spawnedTranscoder.kill();
        spawnedTranscoder = null;
        transcoderStatus = {
          mode : "stopped",
          logs : [],
          output : ""
        }
        logger.error(`transcoder output => ${data}`)
      }
    });

    spawnedTranscoder.stderr.setEncoding('utf8');
    spawnedTranscoder.stderr.on('data', function(data) {
      //Here is where the error output goes
      spawnedTranscoder.kill();
      spawnedTranscoder = null;
      transcoderStatus = {
        mode : "stopped",
        logs : [],
        output : ""
      }
      logger.error(`transcoder output => ${data}`)
    });
  }
}

//Create server itnerfaces
const webServer = http.createServer(uavPanel);
const io = require('socket.io')(webServer);

webServer.listen(options.port, () => {
  logger.info(`server running on port ${options.port}`)
  logger.info(`serving static => ${panelFolder}`)
});

io.on('connection', (socket) => {
  var socketIP = socket.request.connection.remoteAddress
  logger.info(`user connected => ${socketIP}`)
  //Creating a new stream
  socket.on('stream::new', function(options, callback){
    logger.info(`[${socketIP}] stream::new`)
    try{
      presets[options.preset](options.config, (err,presetInstructions) =>{
        if(err!=null){

        }else{
          logger.info(`generated spawning instructions for stream => ${presetInstructions}`)
          startTranscoder(presetInstructions)
          callback({ err : null });
        }
      });
    }catch(err){
      logger.error(`error starting transcoding or parsing config => ${err}`)
      callback({ err : err });
    }
  });
  socket.on('transcoder::get', function(callback){
    callback(transcoderStatus)
  });
  socket.on('transcoder::stop', (callback) => {
    //Here is where the error output goes
    logger.info('transcoder::stop')
    try{
      spawnedTranscoder.kill('SIGINT');
      process.kill(-spawnedTranscoder.pid)
      spawnedTranscoder = null;
      transcoderStatus = {
        mode : "stopped",
        logs : [],
        output : ""
      }
      callback({err : null})
    } catch(err){
      callback({err : err})
      logger.error(`could not stop transcoder ${err}`)
    }
  });
  socket.on('presets::get', function(callback){
    try{
      logger.info(`[${socketIP}] presets::get`)
      presets.export((presetData) =>{
          callback({ err : null, payload : presetData });
      });
    }catch(err){
        callback({ err : err, payload : null });
    }
  });
});
