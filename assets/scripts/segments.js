
var Segment=Fiber.extend(function() {
  return {
    init: function(options) {
      if(!options) options={};
      this.type      = options.type || "straight";
      this.length    = options.length || 0;
      this.arc       = radians(options.arc) || 0;
      // set radius negative to turn left
      this.radius    = [0,0];
      this.cant      = [0,0];
      // elevation == percent gain over distance
      this.rise      = options.rise || 0;

      this.setRadius(options.radius);
      this.setCant(options.cant);

      this.cached_length=null;

      if(this.type == "curve" && options.length) {
        this.arc=options.length/Math.abs(this.radius[0]);
      }
      // length=Math.abs(this.arc)*((this.radius[0]+this.radius[1])/2);
      
      if(["straight","curve"].indexOf(this.type) < 0) return false;

      if(this.type == "straight" && !window.straight) {
        window.straight=this;
      }
      if(this.type == "curve" && !window.curve) {
        window.curve=this;
      }
      return true;
    },
    setRadius: function(radius) {
      if(!radius) return;
      if(typeof radius == typeof []) this.radius=radius;
      if(typeof radius == typeof 0 && arguments.length == 2) this.radius=[radius,arguments[1]];
      if(typeof radius == typeof 0) this.radius=[radius,radius];
    },
    setCant: function(cant) {
      if(!cant) return;
      if(typeof cant == typeof []) this.cant=[radians(cant[0]),radians(cant[1])];
      if(typeof cant == typeof 0 && arguments.length == 2) this.setCant(arguments);
      if(typeof cant == typeof 0) this.setCant([cant,cant]);
    },
    getElevationDifference: function() {
      return this.getElevation(this.getLength())-this.getElevation(0);
    },
    // returns the position for a given distance along the segment
    getPosition: function(distance) {
      if(this.type == "straight") return [0,distance];
      if(this.type == "curve") {
        var arc=crange(0,distance,this.getLength(),0,this.arc);
        var radius=Math.abs(this.radius[0]);
        var position=[-(cos(arc)*radius)+radius,sin(arc)*radius];
        if(this.radius[0] < 0) {
          position[0]*=-1;
        }
        return position;
      }
    },
    // returns the rotation for a given distance from zero
    getRotation: function(distance) {
      if(this.type == "straight") return 0;
      if(this.type == "curve") {
        if(this.radius[0] > 0) return  mod(Math.PI*2-trange(0,distance,this.getLength(),0,-this.arc),Math.PI*2);
        else                   return -mod((Math.PI*2-trange(0,distance,this.getLength(),0,-this.arc)),Math.PI*2);
      }
    },
    getCant: function(distance) {
      return srange(0,distance,this.getLength(),this.cant[0],this.cant[1]);
    },
    getElevation: function(distance) {
      return crange(0,distance,this.getLength(),0,this.rise*this.getLength()*0.01);
    },
    // returns the end position for the segment relative to the start;
    // does not include the previous segments' rotation
    getPositionDifference: function() {
      return this.getPosition(this.getLength());
    },
    // the difference in angle between the start and end of this segment
    getAngleDifference: function() {
      if(this.type == "curve") {
        if(this.radius[0] < 0) return -this.arc;
        return this.arc;
      }
      else return 0;
    },
    getLength: function(cache) {
      if(this.cached_length == null || cache) {
        if(this.type == "straight") this.cached_length=this.length;
        if(this.type == "curve") this.cached_length=this.arc*Math.abs(this.radius[0]);
      }
      return this.cached_length;
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
      this.start     = options.start || 0;
      this.end       = options.end || 0;
      this.segments  = [];

      if(this.type == "master" || this.type == "track") {
        this.gauge   = options.gauge || 1.435;
      }

      if(options.segments) {
        this.parseSegments(options.segments);
      }

      this.segment_cache=[];

      this.buildSegmentCache();

      for(var i=0;i<this.getLength();i+=50) {
        var segment=this.getSegment(i);
        var position=this.getPosition(i);
        var rotation=this.getRotation(i);
        var cant=this.getCant(i);
        var pitch=this.getPitch(i)-radians(0.05);
        var elevation=this.getElevation(i);
        if(!position) continue;

        var geometry=new THREE.BoxGeometry(this.gauge*1.3,0.1,0.2);
        var color=0xff0000;
        if(segment[1].type == "straight") color=0x0000ff;
        color=0x665544;
        var material=new THREE.MeshPhongMaterial( { color: color } );
        var mesh=new THREE.Mesh(geometry, material);
        mesh.castShadow=true;
        mesh.position.x=-position[0];
        mesh.position.y=elevation;
        mesh.position.z=position[1];
        mesh.rotation.order="YXZ";
        mesh.rotation.x=pitch;
        mesh.rotation.y=rotation;
        mesh.rotation.z=cant;
        prop.draw.scene.add(mesh);
      }

      var g=this.getGauge();
      var profile=[
        [[-g/2-7,    -5 ], null],
        [[-g/2-3,     0 ], null],

        [[ g/2+3,     0 ], null],
        [[ g/2+7,    -5 ], null],
      ];

      this.geometry=this.buildProfileMesh(profile,5);
      this.mesh=new THREE.Mesh(this.geometry,shader_get_material("gravel"));
      prop.draw.scene.add(this.mesh);

      var rw=0.07;
      var rh=0.1;
      var b=0.01;
      h=g+rw*2;
      profile=[
        [[-g/2-rw  , 0   ], null],
        [[-g/2-rw  , b   ], null],
        [[-g/2-rw  , rh-b], null],
        [[-g/2-rw  , rh  ], null],
        [[-g/2-rw+b, rh  ], null],
        [[-g/2-b   , rh  ], null],
        [[-g/2     , rh  ], null],
        [[-g/2     , rh-b], null],
        [[-g/2     , b   ], null],
        [[-g/2     ,-1   ], null],

        [[h/2-rw   , 0   ], null],
        [[h/2-rw   , b   ], null],
        [[h/2-rw   , rh-b], null],
        [[h/2-rw   , rh  ], null],
        [[h/2-rw+b , rh  ], null],
        [[h/2-b    , rh  ], null],
        [[h/2      , rh  ], null],
        [[h/2      , rh-b], null],
        [[h/2      , b   ], null],
        [[h/2      ,-1   ], null],

      ];

      geometry=this.buildProfileMesh(profile,2);
      mesh=new THREE.Mesh(geometry,shader_get_material("rails"));
      prop.draw.scene.add(mesh);

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
    getGauge: function() {
      return this.gauge;
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
      distance=clamp(0.01,distance,this.getLength()-0.01);
      var segment=this.getSegment(distance);
      var position=clone(segment[0][2]); // start position of the segment
      var rotation=clone(segment[0][4]); // start rotation of the segment
      var pos=segment[1].getPosition(distance-segment[0][0]);
      position[0]+=(cos(rotation)*pos[0])+(sin(rotation)*pos[1]);
      position[1]+=(cos(rotation)*pos[1])+(-sin(rotation)*pos[0]);
      return position;
    },
    getRotation: function(distance) {
      distance=clamp(0.01,distance,this.getLength()-0.01);
      var segment=this.getSegment(distance);
      return Math.PI*2-(segment[0][4]+segment[1].getRotation(distance-segment[0][0]));
    },
    getRotationDifference: function(distance,difference) {
      distance=clamp(0.01,distance,this.getLength()-0.01);
      if(!difference) difference=10;
      difference=Math.max(0.01,difference);
      var start=Math.max(0,distance-0.5);
      var end=start+difference;
      start=this.getRotation(start);
      end=this.getRotation(end);
      return Math.abs(start-end);
    },
    getCant: function(distance) {
      distance=clamp(0.01,distance,this.getLength()-0.01);
      var segment=this.getSegment(distance);
      return segment[1].getCant(distance-segment[0][0]);
    },
    getElevation: function(distance) {
      distance=clamp(0.01,distance,this.getLength()-0.01);
      var segment=this.getSegment(distance);
      return segment[0][3]+segment[1].getElevation(distance-segment[0][0]);
    },
    getPitch: function(distance, difference) {
      distance=clamp(0.01,distance,this.getLength()-0.01);
      if(!difference) difference=0.1;
      difference=Math.max(0.01,difference);
      var start=Math.max(0,distance-0.5);
      var end=start+difference;
      return Math.atan2(this.getElevation(start)-this.getElevation(end),difference);
    },
    parseSegment: function(segment) {
      var s=new Segment(segment);
      if(!s) return;
      this.segments.push(s);
    },
    parseSegments: function(segments) {
      for(var i=0;i<segments.length;i++) {
        this.parseSegment(segments[i]);
      }
    },
    buildProfileMesh: function(profile,accuracy) {
      if(!accuracy) accuracy=5;
      var left_extent=Infinity;
      var right_extent=-Infinity;
      for(var i=0;i<profile.length;i++) {
        if(profile[i][0][0] < left_extent) left_extent=profile[i][0][0];
        if(profile[i][0][0] > right_extent) right_extent=profile[i][0][0];
      }
      var uv_profile=[];
      var uv_width=0;
      for(var i=0;i<profile.length;i++) {
        if(i >= 1) {
          uv_profile.push(uv_width+distance2d(profile[i-1][0],profile[i][0]));
          uv_width+=distance2d(profile[i-1][0],profile[i][0]);
        } else {
          uv_profile.push(0);
        }
      }
      uv_width=1/uv_width;
      for(var i=0;i<uv_profile.length;i++) {
        uv_profile[i]*=uv_width*0.5;
//        uv_profile[i]+=0.25;
      }
      var extent=left_extent-right_extent;
      var geometry=new THREE.Geometry();
      geometry.faceVertexUvs[0]=[];
      var step=0;
      var vertices=0;
      for(var i=0;i<this.getLength();i+=accuracy,step++) {
        var position=this.getPosition(i);
        position[0]*=-1;
        var rotation=this.getRotation(i);
        var cant=this.getCant(i);
        var elevation=this.getElevation(i);

        function transform(profile_position) {
          var tx=-profile_position[0];
          var ty=profile_position[1];
          var z=0;

          var x=cos(cant)*tx+sin(cant)*ty;
          var y=cos(cant)*ty+sin(cant)*tx;

          z=sin(-rotation)*x;
          x=cos(rotation)*x;

          y+=elevation;
          
          x+=position[0];
          z+=position[1];

          var temp=z;
          z=sin(this.rotation)*x+cos(this.rotation)*z;
          x=sin(this.rotation)*temp+cos(this.rotation)*x;

          x+=this.position[0];
          z+=this.position[1];
          y+=this.elevation;

          return [x,y,z];
        }

        for(var j=0;j<profile.length;j++) {
          var profile_index=profile[j];
          var profile_position=profile_index[0];
          var vp=transform.call(this,profile_position);
          var v=new THREE.Vector3(vp[0],vp[1],vp[2]);
          geometry.vertices.push(v);
          vertices+=1;
        }
//        if(step%2 == 1 && step > 2) {
        if(step > 1) {
          for(var j=0;j<profile.length;j++) {
            var previous_profile_offset=vertices-profile.length*2+j;
            var profile_offset=vertices-profile.length+j;
            if(profile_offset+1 >= geometry.vertices.length) continue;
            var left_offset=profile[j][0][0];
            var right_offset=profile[j+1][0][0];
            var s=1.0;
            var ds=0.02;
            var f1=new THREE.Face3(previous_profile_offset+0,
                                   previous_profile_offset+1,
                                            profile_offset+1);
            geometry.faceVertexUvs[0].push([
              new THREE.Vector2(s*uv_profile[j],  s*ds*(i-accuracy)),
              new THREE.Vector2(s*uv_profile[j+1],s*ds*(i-accuracy)),
              new THREE.Vector2(s*uv_profile[j+1],s*ds*(i)),
            ]);
            geometry.faces.push(f1);
            var f2=new THREE.Face3(         profile_offset+0,
                                   previous_profile_offset+0,
                                            profile_offset+1);
            geometry.faceVertexUvs[0].push([
              new THREE.Vector2(s*uv_profile[j],  s*ds*(i)),
              new THREE.Vector2(s*uv_profile[j],  s*ds*(i-accuracy)),
              new THREE.Vector2(s*uv_profile[j+1],s*ds*(i)),
            ]);
            geometry.faces.push(f2);
          }
        }
      }

      // var material=new THREE.MeshPhongMaterial({
      //   color: 0x444444,
      //   wireframe: true,
      //   transparent:true,
      //   side:THREE.DoubleSide
      // });
      geometry.computeBoundingSphere();
      geometry.verticesNeedUpdate=true;
      geometry.normalsNeedUpdate=true;
      geometry.buffersNeedUpdate=true;
      geometry.computeFaceNormals();
      geometry.computeVertexNormals();
      geometry.computeTangents();
      return geometry;
    }
  };
});

function segments_init() {
  
}
