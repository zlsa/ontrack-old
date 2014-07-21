
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

  this.verifyRoot=function(root) {
    if(!root) root=this.root.master;
    var valid=
      root &&
      root.position &&
      typeof root.position == typeof [] &&
      root.position.length == 2 &&
      root.elevation != null &&
      root.elevation != undefined &&
      root.segments;
    return valid;
  };

  this.getRoot=function(type, number) {
    if(number != undefined) return this.root[type][number];
    return this.root[type];
  }

  this.verifyData=function() {
    var valid=
      this.data &&
      this.data.about &&
      this.data.about.name &&
      this.data.about.description &&
      this.data.environment &&
      this.data.environment.skydome &&
      this.data.root &&
      this.data.root.master &&
      this.verifyRoot(this.data.root.master);
    return valid;
  };

  this.parseData=function() {
    this.name=this.data.about.name;
    this.skydome=new Content({
      url: this.url+this.data.environment.skydome,
      type: "image",
    })
    this.root.master=new Segments({
      type: "master",
      position: this.data.root.master.position,
      elevation: this.data.root.master.elevation,
      gauge: this.data.root.master.gauge,
      segments:this.data.root.master.segments
    });
  };

  this.getCallback=function(status, data) {
    if(status == "ok") {
      this.data=data;
      this.verifyData();
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
  railway_set_current(railway_get("devtrack"));
//  railway_set_current(railway_get("train-test"));
}

function railway_get(name) {
  var url="assets/railways/"+name+"/";
  var railway=new Railway({
    url: url
  })
  prop.railway.railways.push(railway);
  return railway;
}

function railway_set_current(railway) {
  prop.railway.current=railway;
}
