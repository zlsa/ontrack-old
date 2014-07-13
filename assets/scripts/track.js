
var Track=function(options) {
  this.url=""
  this.name=""

  if(options) {
    if("url" in options) this.url=options.url;
  }

};
