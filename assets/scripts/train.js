
var Bogie=Fiber.extend(function() {
  return {
    init: function(options) {
      this.car            = options.car || null;

      this.offset         = options.offset || 0; // the offset from the center of the car
      this.wheel_distance = options.wheel_distance || 0; // set by the car (distance from front to back axles)
      this.distance       = 0;
      this.gap            = options.gap || 0.05; // the gap from the rail to the flange on one side (doubled for total wobble room)
      this.articulated    = options.articulated || false;
      this.angle          = 0;
      this.track_angle    = 0;

      this.friction_factors = {
        rolling: 0,
        flange: 0,
        brake: 0,
      };

      this.brake={
        force:10000
      };
      
      this.audio={
        flange: audio_load("flange"),
        rails: audio_load("rails")
      };

    },
    calculateFriction: function() {
      this.flange_offset_angle=Math.max(0,Math.abs(this.track_angle)-Math.atan2(this.gap,this.wheel_distance));
      if(this.articulated) this.flange_offset_angle*=0.03;
      this.friction_factors.flange=crange(0,this.flange_offset_angle,radians(2),0,500*this.car.getSpeed());
      this.friction_factors.rolling=200*this.car.getSpeed();
      this.friction_factors.brake=trange(0,this.car.train.brake.value,this.car.train.brake.max,0,this.brake.force);
      var friction=0;
      for(var i in this.friction_factors) {
        friction+=Math.abs(this.friction_factors[i]);
      }
      return friction;
    },
    updateAudio: function() {
      this.audio.rails.setVolume(scrange(0,Math.abs(this.car.getSpeed()),1,0,0.02));
      this.audio.rails.setRate(crange(0,Math.abs(this.car.getSpeed()),100,0.2,2.0));

      if(this.car.train.brake.value <= 0)
        this.audio.flange.setVolume(0);
      else
        this.audio.flange.setVolume(crange(1,this.car.train.brake.value,this.car.train.brake.max,0.2,0.3)*crange(0,Math.abs(this.car.getSpeed()),100,0,0.1));
    },
    updateModel: function() {
      var position=this.car.track.getPosition(  this.distance);
      var rotation=this.car.track.getRotation(  this.distance);
      var elevation=this.car.track.getElevation(this.distance);
      var cant=this.car.track.getCant(          this.distance);
      var pitch=this.car.track.getPitch(        this.distance);
      
      var tilt=scrange(Math.PI/10,Math.abs(this.car.tilt),Math.PI/2,0,1)*this.car.tilt;

      this.model.position.set(-position[0],elevation+0.4+(sin(Math.abs(tilt))*2.0),position[1]);

      this.model.rotation.order="YXZ";

      this.model.rotation.set(pitch,rotation,cant+tilt);
    },
    createModel: function() {
      var geometry=prop.train.geometry["bogie"][0]
      var material=new THREE.MeshFaceMaterial(prop.train.geometry["bogie"][1]);
      this.model=new THREE.Mesh(geometry, material);

      this.model.castShadow=true;
      this.model.receiveShadow=true;

      prop.draw.scene.add(this.model);
    }
  };
});

var Car=Fiber.extend(function() {
  return {
    init: function(options) {
      if(!options) options={};
      this.distance     = 0; // set by the train
      this.velocity     = 0; // set by the train
      this.type         = options.type || null;
      this.train        = options.train || null;
      this.track        = options.track || null;
      this.length       = options.length || 0;
      this.weight       = options.weight || 0;

      this.front_surface= options.front_surface || 0;
      this.number       = options.number || 0;

      this.bogies       = [
        new Bogie({
          car: this,
          articulated: true,
          offset: this.length/2-2.25,
          wheel_distance: 1,
        }),
        new Bogie({
          car: this,
          articulated: true,
          offset: -this.length/2+2.25,
          wheel_distance: 1,
        })
      ];

      this.tilt_factors = {
        cant: 0,
        wind: 0,
        wobble: 0,
        passengers: 0,
        derail: 0
      };
      this.tilt         = 0;

      this.acceleration_factors = {
        engine: 0,
        gravity: 0
      };
      this.acceleration = 0;

      this.friction_factors = {
        aero: 0,
        tilt: 0
      };
      this.friction=0;

      this.power={
        speed: 0, // speed of the motor
        force: 9000
      };

      this.audio={
        motor: audio_load("motor"),
        geartrain: audio_load("geartrain"),
        flange: audio_load("flange")
      };

      this.flange_lowpass=0.0;

    },
    setTrain: function(train) {
      this.train=train;
      this.track=train.track;
    },
    getSpeed: function() {
      return Math.abs(this.velocity*30);
    },
    calculateFriction: function() {
      if(!this.train) return;
      if(!this.track) return;

      var time_seed=game_time()+this.distance*0.1;
      this.tilt_factors.cant=this.track.getCant(this.distance);
      this.tilt_factors.wobble= sin(time_seed*0.5)*trange(0,this.getSpeed(),100,radians(0),radians(0.5));
      this.tilt_factors.wobble+=sin(time_seed*2  )*trange(0,this.getSpeed(),100,radians(0),radians(0.3));
      this.tilt_factors.wobble+=sin(time_seed*5  )*trange(0,this.getSpeed(),100,radians(0),radians(0.1));
      this.tilt_factors.wobble*=2;

      if(Math.abs(this.tilt_factors.derail) > Math.PI/10) {
        this.tilt_factors.derail=clamp(-Math.PI/2,this.tilt_factors.derail*(1+game_delta()),Math.PI/2);
      } else {
        var difference=this.track.getRotationDifference(this.distance)
        this.tilt_factors.derail=trange(0,difference*Math.abs(this.velocity),20,0,Math.PI/2);
        this.tilt_factors.derail=clamp(-Math.PI/2,this.tilt_factors.derail,Math.PI/2);
      }

      this.tilt_factors.wind=sin(time_seed*0.3)*radians(0.2)*sin(time_seed*1.3)*radians(0.1);

      this.tilt=0;
      for(var i in this.tilt_factors) this.tilt+=this.tilt_factors[i];

      if(this.number == 0) {
        this.friction_factors.aero=trange(0,this.getSpeed(),100,0,this.weight*0.5*this.front_surface);
      } else {
        this.friction_factors.aero=trange(0,this.getSpeed(),100,0,this.weight*0.05*this.front_surface);
      }

      this.friction_factors.tilt=crange(10,this.getSpeed()*Math.abs(this.tilt_factors.derail),100,0,200*this.weight);

      this.friction=0;
      for(var i in this.friction_factors) {
        this.friction+=Math.abs(this.friction_factors[i]);
      }

      for(var i=0;i<this.bogies.length;i++) {
        this.bogies[i].distance=this.distance+this.bogies[i].offset;
        this.bogies[i].track_angle=this.track.getRotationDifference(this.distance+this.bogies[i].offset);
        this.friction+=Math.abs(this.bogies[i].calculateFriction());
      }

      var pitch=this.track.getPitch(this.distance);

      this.acceleration_factors.gravity=-prop.environment.gravity*trange(0,pitch,Math.PI,0,5*this.weight);
      this.acceleration_factors.power=trange(-this.train.power.max,this.train.power.value,this.train.power.max,-this.power.force,this.power.force);
      this.acceleration=0;

      for(var i in this.acceleration_factors) {
        var factor=this.acceleration_factors[i];
        this.acceleration+=factor;
      }

      this.updateAudio();

      this.friction/=3;
      return this.friction;

    },
    updateAudio: function() {
      var motor_speed=crange(0,this.getSpeed(),90,0.2,4.0);
      var mix=0.9;
      motor_speed*=1.5;
      if(this.train.power.value == 0) motor_speed=0;
      this.power.speed=(motor_speed*(1-mix))+this.power.speed*mix;

      this.audio.motor.setVolume(scrange(0,this.getSpeed(),3,0.2,0.2)*crange(0,Math.abs(this.train.power.value),this.train.power.max,0.5,1.0));
      this.audio.motor.setRate(this.power.speed);
//      this.audio.motor.setDelay((this.distance*this.velocity)%5);

      for(var i=0;i<this.bogies.length;i++) {
        this.bogies[i].updateAudio();
      }

      var flange_offset_angle=average(this.bogies[0].flange_offset_angle,this.bogies[1].flange_offset_angle);
      var mix=0.4;
      this.flange_lowpass=(flange_offset_angle*(1-mix))+this.flange_lowpass*mix;
      this.audio.flange.setVolume(scrange(0,this.getSpeed()*this.flange_lowpass,0.1,0,0.3));

      this.audio.geartrain.setVolume(crange(0,this.getSpeed(),10,0.2,0.5));
      this.audio.geartrain.setRate(crange(0,this.getSpeed(),100,0.1,5.0));

    },
    updateModel: function() {
      var position= average2d(this.track.getPosition( this.bogies[0].distance),
                              this.track.getPosition( this.bogies[1].distance));
      var rotation= average(  this.track.getRotation( this.bogies[0].distance),
                              this.track.getRotation( this.bogies[1].distance));
      var elevation_front=this.track.getElevation(    this.bogies[0].distance);
      var elevation_rear=this.track.getElevation(     this.bogies[1].distance);
      var elevation=average(elevation_front,elevation_rear);
      var pitch=-Math.atan2(elevation_front-elevation_rear,this.bogies[0].distance-this.bogies[1].distance);
      var cant=this.tilt;
      
      this.model.position.set(-position[0],elevation+(sin(Math.abs(this.tilt))*1.5),position[1]);

      this.model.rotation.order="YXZ";

      this.model.rotation.set(pitch,rotation,this.tilt);

      for(var i=0;i<this.bogies.length;i++) {
        this.bogies[i].updateModel();
      }

    },
    createModel: function() {
//      var geometry=new THREE.BoxGeometry(3,2.5,this.length-0.3);
//      var color=0xdddddd;
//      var material=new THREE.MeshPhongMaterial( { color: color } );
      var geometry=prop.train.geometry[this.type][0]
      var material=new THREE.MeshFaceMaterial(prop.train.geometry[this.type][1]);
      this.model=new THREE.Mesh(geometry, material);
      this.model.castShadow=true;
      this.model.receiveShadow=true;

      prop.draw.scene.add(this.model);

      for(var i=0;i<this.bogies.length;i++) {
        this.bogies[i].createModel();
      }

    },
  };
});

var Train=Fiber.extend(function() {
  return {
    init: function(options) {
      if(!options) options={};

      this.track        = options.track || null;
      this.cars         = options.cars || [];

      this.distance     = options.distance || 30;
      this.velocity     = options.velocity || 0;
      
      this.brake = {
        value: 0,
        max: 5,
        force: 1
      };

      this.power = {
        value: 0,
        min: -5,
        max: 5,
        force: 20000
      };

    },
    push: function(car) {
      this.cars.push(car);
      car.setTrain(this);
      car.number=this.cars.length-1;
    },
    getLength: function() {
      var length=0;
      for(var i=0;i<this.cars.length;i++) {
        length+=this.cars[i].length;
      }
      return length;
    },
    getSpeed: function() {
      return Math.abs(this.velocity*30);
    },
    update: function() {
      if(!this.track) return;
      if(this.distance-this.getLength() < 0) {
        this.distance=this.getLength();
        this.velocity=0;
      } else if(this.distance >= this.track.getLength()) {
        this.distance=this.track.getLength();
        this.velocity=0;
      }

      this.brake.value=clamp(0,this.brake.value,this.brake.max);
      this.power.value=clamp(this.power.min,this.power.value,this.power.max);

      var distance=this.distance+0;
      for(var i=0;i<this.cars.length;i++) {
        this.cars[i].distance=distance-this.cars[i].length/2;
        this.cars[i].velocity=this.velocity;
        distance-=this.cars[i].length;
      }

      var weight=0;

      for(var i=0;i<this.cars.length;i++) {
        weight+=this.cars[i].weight;
      }

      var v=this.velocity+0;
      for(var i=0;i<this.cars.length;i++) {
        var velocity_sign=scrange(-1,this.velocity,1,-1,1);
        var friction=Math.abs(this.cars[i].calculateFriction());
        var acceleration=this.cars[i].acceleration/weight;
        this.velocity+=acceleration*game_delta()*0.1;
//        this.velocity*=trange(0,friction*game_delta()*scrange(0,Math.abs(this.velocity),10,5,1),1,1.0,crange(0,Math.abs(this.velocity),10,0.93,0.98));
        this.velocity-=crange(0,(friction*game_delta())/weight,1,0,velocity_sign)*0.1;
//        this.velocity*=scrange(0,friction*game_delta(),1,1,scrange(0.1,Math.abs(v),2,0,1))
      }

//      this.distance+=this.velocity*game_delta();
      this.distance+=this.velocity;

      $("#speed").text((this.getSpeed()*3.6).toFixed(2)+" kph")

      distance=this.distance+0;
      for(var i=0;i<this.cars.length;i++) {
        this.cars[i].distance=distance-this.cars[i].length/2;
        this.cars[i].velocity=this.velocity;
        distance-=this.cars[i].length;
        this.cars[i].updateModel();
      }
    },
    ready: function() {
      this.track=prop.railway.current.getRoot("master");
      this.distance=this.track.start+this.getLength();
      for(var i=0;i<this.cars.length;i++) {
        this.cars[i].track=this.track;
        this.cars[i].createModel();
      }
    }
  };
});

function train_init_pre() {
  prop.train={};

  prop.train.trains=[];

  prop.train.current=null;

  prop.train.geometry={};
}

function train_init_post() {
  var train=new Train({
    velocity:0,
  });
  train.push(new Car({
    length: 20.5,
    weight: 30000,
    front_surface: 5,
    type: "cab",
  }));
  train.push(new Car({
    length: 20.5,
    weight: 30000,
    front_surface: 10,
    type: "passenger"
  }));
  train.push(new Car({
    length: 20.5,
    weight: 30000,
    front_surface: 10,
    type: "passenger"
  }));
  train.push(new Car({
    length: 20.5,
    weight: 30000,
    front_surface: 10,
    type: "passenger"
  }));
  // train.push(new Car({
  //   length: 20.5,
  //   weight: 30000,
  //   front_surface: 10,
  //   type: "passenger"
  // }));
  // train.push(new Car({
  //   length: 20.5,
  //   weight: 30000,
  //   front_surface: 10,
  //   type: "passenger"
  // }));
  // train.push(new Car({
  //   length: 20.5,
  //   weight: 30000,
  //   type: "passenger"
  // }));
  // train.push(new Car({
  //   length: 20.5,
  //   weight: 30000,
  //   front_surface: 10,
  //   type: "passenger"
  // }));
  // train.push(new Car({
  //   length: 20.5,
  //   weight: 30000,
  //   front_surface: 10,
  //   type: "passenger"
  // }));
  // train.push(new Car({
  //   length: 20.5,
  //   weight: 30000,
  //   front_surface: 10,
  //   type: "passenger"
  // }));
  train_set_current(train_add(train));

  train_load_model("cab","assets/trains/intercity/cab/cab.js");
  train_load_model("passenger","assets/trains/intercity/passenger/passenger.js");
  train_load_model("bogie","assets/trains/intercity/bogie/bogie.js");
}

function train_ready() {
  prop.train.current.track=prop.railway.current.getRoot("master");
  for(var i=0;i<prop.train.trains.length;i++) {
    prop.train.trains[i].ready();
  }
}

function train_load(name, url) {
  if(!url) url="assets/trains/"+name+"/";

}

function train_load_model(name, url) {
  if(!url) url=prop.train.url_root+name+".js";
  new Content({
    type: "three",
    url: url,
    payload: name,
    callback: function(status, data, payload) {
      prop.train.geometry[payload]=data;
    }
  });
}

function train_add(train) {
  prop.train.trains.push(train);
  return train;
}

function train_set_current(train) {
  prop.train.current=train;
}

function train_update_pre() {
  prop.train.current.power.value=prop.controls.power*prop.controls.direction;
  prop.train.current.brake.value=prop.controls.brake;

  if((prop.train.current.velocity < -0.2 && prop.controls.direction > 0) ||
     (prop.train.current.velocity > 0.2 && prop.controls.direction < 0)) {
    prop.train.current.power.value=0;
    prop.train.current.brake.value=prop.train.current.brake.max;
  }

  prop.train.current.update();
}
