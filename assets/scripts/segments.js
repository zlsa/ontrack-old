
var Segment=Fiber.extend(function() {
  return {
    init: function(options) {
      if(!options) options={};
      this.type      = options.type || "straight";
      this.length    = options.length || 0;
      // set arc negative to turn left
      this.arc       = radians(options.arc) || 0;
      this.radius    = [0,0];
      this.cant      = [0,0];
      // vertical offset reached at end of segment
      this.elevation = options.elevation || 0;

      if(this.type == "curve") {
        console.log(this);
        if(!window.curve)
          window.curve=this;
      } else {
        window.straight=this;
      }

      this.setRadius(options.radius);
      this.setCant(options.cant);
    },
    setRadius: function(radius) {
      if(!radius) return;
      if(typeof radius == typeof []) this.radius=radius;
      if(typeof radius == typeof 0 && arguments.length == 2) this.radius=[radius,arguments[1]];
      if(typeof radius == typeof 0) this.radius=[radius,radius];
    },
    setCant: function(cant) {
      if(!cant) return;
      if(typeof cant == typeof []) this.cant=cant;
      if(typeof cant == typeof 0 && arguments.length == 2) this.cant=[cant,arguments[1]];
      if(typeof cant == typeof 0) this.cant=[cant,cant];
    },
    getElevationDifference: function() {
      return this.elevation;
    },
    // returns the position for a given distance along the segment
    getPosition: function(distance) {
      if(this.type == "straight") return [0,distance];
      if(this.type == "curve") {
        var arc=trange(0,distance,this.getLength(),0,Math.abs(this.arc));
        var radius=this.radius[0];
        var position=[-(cos(arc)*radius)+radius,sin(arc)*radius];
        if(this.arc < 0) {
          position[0]*=-1;
        }
        return position;
      }
    },
    // returns the rotation for a given distance from zero
    getRotation: function(distance) {
      if(this.type == "straight") return 0;
      if(this.type == "curve") {
        return trange(0,distance,this.getLength(),0,-this.arc)+Math.PI*0.25;
      }
    },
    // returns the end position for the segment relative to the start;
    // does not include the previous segments' rotation
    getPositionDifference: function() {
      return this.getPosition(this.getLength());
    },
    // the difference in angle between the start and end of this segment
    getAngleDifference: function() {
      if(this.type == "curve") return this.arc;
      else return 0;
    },
    getLength: function() {
      if(this.type == "straight") return this.length;
      if(this.type == "curve") return Math.abs(this.arc)*this.radius[0];
    }
  };
});

var Segments=Fiber.extend(function() {
  return {
    init: function(options) {
      if(!options) options={};
      this.type      = options.type || "master";
      this.position  = options.position || [0,0];
      this.elevation = options.elevation || 0;
      this.rotation  = options.rotation || 0;
      this.segments  = [];

      if(this.type == "master" || this.type == "track") {
        this.gauge   = options.gauge || 1.435;
      }

      if(options.segments) {
        this.parseSegments(options.segments);
      }

      this.segment_cache=[];

      this.buildSegmentCache();

      for(var i=0;i<this.getLength();i+=1) {
        var segment=this.getSegment(i);
        var position=this.getPosition(i);
        var rotation=this.getRotation(i);
        console.log(rotation);
        if(!position) continue;

//        if(i == 0)
//          var geometry=new THREE.BoxGeometry(10,0.2,0.2);
//        else
//          var geometry=new THREE.BoxGeometry(0.2,0.2,1.0);
        var geometry=new THREE.BoxGeometry(0.2,0.2,0.2);
        var color=0xff0000;
        if(segment[1].type == "straight") color=0x000000;
        var material=new THREE.MeshBasicMaterial( { color: color } );
        var mesh=new THREE.Mesh(geometry, material);
        mesh.position.x=-position[0];
        mesh.position.z=position[1];
//        mesh.rotation.y=rotation;
        prop.draw.scene.add(mesh);
      }

    },
    buildSegmentCache: function() {
      // segment_cache saves the [distance, length, position, elevation, rotation] of each segment
      // where position, elevation, and rotation are GLOBAL and refer to the START of the segment
      this.segment_cache=[];
      var distance=0;
      var position=clone(this.position);
      var elevation=clone(this.elevation);
      var rotation=clone(this.rotation);
      for(var i=0;i<this.segments.length;i++) {
        var segment=this.segments[i];
        var length=segment.getLength();
        this.segment_cache.push([distance, length, clone(position), elevation, rotation]);
        distance+=length;
        var pos=segment.getPositionDifference();
        position[0]+=(cos(rotation)*pos[0])+(sin(rotation)*pos[1]);
        position[1]+=(cos(rotation)*pos[1])+(-sin(rotation)*pos[0]);
//        position[0]+=sin(rotation)*position_offset[0];
//        position[1]+=cos(rotation)*position_offset[1];
        elevation+=segment.getElevationDifference();
        rotation+=segment.getAngleDifference();
      }
    },
    getLength: function() {
      var last_segment=this.segment_cache[this.segment_cache.length-1];
      return last_segment[0]+last_segment[1];
    },
    getSegment: function(distance) {
      if(distance > this.getLength()) return null;
      if(distance < 0) return null;
      for(var i=0;i<this.segment_cache.length;i++) {
        var segment=this.segment_cache[i];
        if(segment[0] <= distance && segment[0]+segment[1] >= distance) {
          return [segment,this.segments[i],i];
        }
      }
    },
    getPosition: function(distance) {
      var segment=this.getSegment(distance);
      if(!segment) {
        console.log("no segment!");
        return null;
      }
      var position=clone(segment[0][2]); // start position of the segment
      var rotation=clone(segment[0][4]); // start rotation of the segment
      var pos=segment[1].getPosition(distance-segment[0][0]);
//      position[0]+=pos[0];
//      position[1]+=pos[1];
      position[0]+=(cos(rotation)*pos[0])+(sin(rotation)*pos[1]);
      position[1]+=(cos(rotation)*pos[1])+(-sin(rotation)*pos[0]);
//      console.log(position);
      return position;
    },
    getRotation: function(distance) {
      var segment=this.getSegment(distance);
      if(!segment) {
        console.log("no segment!");
        return null;
      }
      return mod(segment[0][4]+segment[1].getRotation(distance),Math.PI*2);
      return segment[0][4]+segment[1].getRotation(distance);
    },
    parseSegment: function(segment) {
      var s=new Segment(segment);
      this.segments.push(s);
    },
    parseSegments: function(segments) {
      for(var i=0;i<segments.length;i++) {
        this.parseSegment(segments[i]);
      }
    }
  };
});

function segments_init() {
  
}
