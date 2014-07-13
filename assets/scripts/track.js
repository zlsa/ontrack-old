
var Track=function(options) {
  this.url="";
  this.name="";
  this.data=null;
  this.skydome=null;

  if(options) {
    if("url" in options) this.url=options.url;
  }

  this.get=function() {
    this.content=new Content({
      url: this.url+"track.json",
      type: "json",
      that: this,
      callback: this.getCallback
    });
  };

  this.parseData=function() {
    this.name=this.data.about.name;
    this.skydome=new Content({
      url: this.url+this.data.environment.skydome,
      type: "image",
    })
    console.log(this.skydome);
  };

  this.getCallback=function(status, data) {
    if(status == "ok") {
      this.data=data;
      this.parseData();
    }
  };

  this.get();

};

function track_init_pre() {

  prop.track={};
  prop.track.tracks=[];
  prop.track.current=null;

}

function track_init() {
  track_get("devtrack");
  prop.track.current=prop.track.tracks[0];
}

function track_get(name) {
  var url="assets/tracks/"+name+"/";
  var track=new Track({
    url: url
  })
  prop.track.tracks.push(track);
}
