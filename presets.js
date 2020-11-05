module.exports = {
  export : function(callback){
    callback(
      {
         "presets":[
            {
               "name":"multi-bitrate",
               "options":[
                 {
                   "identifier" : "bitrate",
                   "name" : "Streams Bitrate",
                   "placeholder" : "1000,500",
                   "multipleOptions":true
                 },
                 {
                   "identifier" : "filter",
                   "name" : "Streams Filters",
                   "multipleOptions":true,
                   "placeholder" : "\"scale=-2:720\",\"scale=-2:720\""
                 },
                 {
                   "identifier" : "profile",
                   "name" : "Adaptation Sets Profiles",
                   "placeholder" : "baseline, main",
                   "multipleOptions":true
                 },
                 {
                   "identifier" : "device",
                   "name" : "Capture Device",
                   "placeholder" : "/dev/video0",
                   "multipleOptions":false
                 }
               ]
            }
         ]
      }
    );
  },
  "multi-bitrate" : function(configs, callback){
    var pre_presetInstructions = ["--preset ~/uav_dash_streaming_node/presets/multi-bitrate.js"]
    pre_presetInstructions.push(`--device ${configs["device"]}`)
    pre_presetInstructions.push(`--presetConfig`)
    var presetInstructions = []
    for(var bitratesI in configs["bitrate"]){
      var config = configs["bitrate"][bitratesI]
      presetInstructions.push(`-b:${bitratesI} ${config}`)
      if(config==""){
        throw new Error('Missing values for one of the options.')
      }
    }
    for(var filterI in configs["filter"]){
      var config = configs["filter"][filterI]
      presetInstructions.push(`-f:${filterI}`)
      presetInstructions.push(config)
      if(config==""){
        throw new Error('Missing values for one of the options.')
      }
    }
    for(var profileI in configs["profile"]){
      var config = configs["profile"][profileI]
      presetInstructions.push(`-p:${profileI} ${config}`)
      if(config==""){
        throw new Error('Missing values for one of the options.')
      }
    }
    pre_presetInstructions.push(presetInstructions.join(" "))
    callback(null, pre_presetInstructions)
  }
}
