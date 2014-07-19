
var Railway=function(options) {
  this.url="";
  this.name="";
  this.root={};
  this.skydome=null;

  if(options) {
    if("url" in options) this.url=options.url;
  }

  this.get=function() {
    this.content=new Content({
      url: this.url+"railway.json",
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

function railway_init_pre() {

  prop.railway={};
  prop.railway.railways=[];
  prop.railway.current=null;

}

function railway_init() {
  railway_get("devtrack");
  prop.railway.current=prop.railway.railways[0];
}

function railway_get(name) {
  var url="assets/railways/"+name+"/";
  var railway=new Railway({
    url: url
  })
  prop.railway.railways.push(railway);
}
