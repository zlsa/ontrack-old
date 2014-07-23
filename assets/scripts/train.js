
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
        force:0.1
      };
      
      this.audio={
        rails: audio_load("rails")
      };

    },
    calculateFriction: function() {
      this.flange_offset_angle=Math.max(0,Math.abs(this.track_angle)-Math.atan2(this.gap,this.wheel_distance));
      if(this.articulated) this.flange_offset_angle*=0.03;
      this.friction_factors.flange=crange(0,this.flange_offset_angle,radians(2),0,0.1*this.car.velocity);
      this.friction_factors.rolling=0.001*this.car.velocity;
      this.friction_factors.brake=trange(0,this.car.train.brake.value,this.car.train.brake.max,0,this.brake.force);
      var friction=0;
      for(var i in this.friction_factors) {
        friction+=Math.abs(this.friction_factors[i]);
      }
      return friction;
    },
    updateAudio: function() {
      this.audio.rails.setVolume(scrange(0,Math.abs(this.car.velocity),1,0,0.01));
      this.audio.rails.setRate(crange(0,Math.abs(this.car.velocity),10,0.2,1.1));
//      this.audio.rails.setDelay((this.wheel_distance*this.car.velocity)%5);
    }
  };
});

var Car=Fiber.extend(function() {
  return {
    init: function(options) {
      if(!options) options={};
      this.distance     = 0; // set by the train
      this.velocity     = 0; // set by the train
      this.train        = options.train || null;
      this.track        = options.track || null;
      this.length       = options.length || 0;
      this.weight       = options.weight || 0;

      this.bogies       = [
        new Bogie({
          car: this,
          articulated: true,
          offset: this.length+2,
          wheel_distance: 1,
        }),
        new Bogie({
          car: this,
          articulated: true,
          offset: -this.length+2,
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
        aero: 0
      };
      this.friction=0;

      this.power={
        speed: 0, // speed of the motor
        force: 30000
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
    update: function() {
      if(!this.train) return;
      if(!this.track) return;

      var time_seed=game_time()+this.distance;
      this.tilt_factors.cant=this.track.getCant(this.distance);
      this.tilt_factors.wobble= sin(time_seed*0.5)*trange(0,Math.abs(this.velocity),100,radians(0),radians(0.5));
      this.tilt_factors.wobble+=sin(time_seed*2  )*trange(0,Math.abs(this.velocity),100,radians(0),radians(0.3));
      this.tilt_factors.wobble+=sin(time_seed*5  )*trange(0,Math.abs(this.velocity),100,radians(0),radians(0.1));

      this.tilt_factors.wind=sin(time_seed*0.3)*radians(0.2)*sin(time_seed*1.3)*radians(0.1);

      this.tilt=0;
      for(var i in this.tilt_factors) this.tilt+=this.tilt_factors[i];

      this.friction_factors.aero=trange(0,Math.abs(this.velocity),100,0,0.3);

      this.friction=0;
      for(var i in this.friction_factors) {
        this.friction+=Math.abs(this.friction_factors[i]);
      }

      for(var i=0;i<this.bogies.length;i++) {
        this.bogies[i].distance=this.distance+this.bogies[i].offset;
        this.bogies[i].track_angle=this.track.getRotationDifference(this.distance+this.bogies[i].offset);
        this.friction+=Math.abs(this.bogies[i].calculateFriction());
      }

      this.friction=clamp(0,this.friction,1);

      var pitch=this.track.getPitch(this.distance);

      this.acceleration_factors.gravity=-prop.environment.gravity*trange(0,pitch,Math.PI,0,3*this.weight);
      this.acceleration_factors.gravity*=trange(0,this.friction,0.5,1,0.0);
      this.acceleration_factors.power=trange(-this.train.power.max,this.train.power.value,this.train.power.max,-this.power.force,this.power.force);
      this.acceleration=0;

      for(var i in this.acceleration_factors) {
        var factor=this.acceleration_factors[i];
        this.acceleration+=factor;
      }

      this.updateAudio();

    },
    updateAudio: function() {
      var step=6;
      var motor_speed=trange(0,Math.abs(this.velocity%step),step,1.3,1.7);
      if(Math.abs(this.velocity) < step) motor_speed=1.5;
      var mix=0.8;
      motor_speed=clamp(0.7,motor_speed,1.5);
      if(this.train.power.value == 0) motor_speed=0;
      this.power.speed=(motor_speed*(1-mix))+this.power.speed*mix;

      this.audio.motor.setVolume(scrange(0,Math.abs(this.velocity),3,0.2,0.4));
      this.audio.motor.setRate(this.power.speed);

      for(var i=0;i<this.bogies.length;i++) {
        this.bogies[i].updateAudio();
      }

      var flange_offset_angle=average(this.bogies[0].flange_offset_angle,this.bogies[1].flange_offset_angle);
      var mix=0.4;
      this.flange_lowpass=(flange_offset_angle*(1-mix))+this.flange_lowpass*mix;
      this.audio.flange.setVolume(scrange(0,Math.abs(this.velocity)*this.flange_lowpass,0.1,0,0.1));

      this.audio.geartrain.setVolume(crange(0,Math.abs(this.velocity),10,0,0.8));
      this.audio.geartrain.setRate(crange(0,Math.abs(this.velocity),20,0.1,1.2));

    },
    updateModel: function() {
//      var bogey_distances=[];

//      for(var i=0;i<this.bogies.length;i++) {
//        bogey_distances.push(this.distance+this.bogies[i].);
//      }
      
      var position= average2d(this.track.getPosition( this.bogies[0].distance),
                              this.track.getPosition( this.bogies[1].distance));
      var rotation= average(  this.track.getRotation( this.bogies[0].distance),
                              this.track.getRotation( this.bogies[1].distance));
      var elevation_front=this.track.getElevation(    this.bogies[0].distance);
      var elevation_rear=this.track.getElevation(     this.bogies[1].distance);
      var elevation=average(elevation_front,elevation_rear);
      var pitch=-Math.atan2(elevation_front-elevation_rear,this.bogies[0].distance-this.bogies[1].distance);
      var cant=this.tilt;
      
      this.model.position.x=-position[0]
      this.model.position.y=elevation+1.1;
      this.model.position.z=position[1];

      this.model.rotation.order="YXZ";

      this.model.rotation.y=rotation;
      this.model.rotation.x=pitch;
      this.model.rotation.z=this.tilt;
    },
    createModel: function() {
      var gauge=this.track.getGauge();
      var geometry=new THREE.BoxGeometry(gauge*1.5,2.0,this.length-1);
      var color=0xdddddd;
      var material=new THREE.MeshPhongMaterial( { color: color } );
      this.model=new THREE.Mesh(geometry, material);

      prop.draw.scene.add(this.model);
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
    },
    update: function() {
      if(!this.track) return;
      if(this.distance < 0) {
        this.distance=0.5;
        this.velocity=Math.abs(this.velocity)*0.3;
      } else if(this.distance >= this.track.getLength()) {
        this.distance=this.track.getLength()-1;
        this.velocity=Math.abs(this.velocity)*-0.3;
      }

      this.brake.value=clamp(0,this.brake.value,this.brake.max);
      this.power.value=clamp(this.power.min,this.power.value,this.power.max);

      var distance=this.distance+0;
      for(var i=0;i<this.cars.length;i++) {
        this.cars[i].distance=distance;
        this.cars[i].velocity=this.velocity;
        distance-=this.cars[i].length;
        this.cars[i].update();
      }

      var weight=0;

      for(var i=0;i<this.cars.length;i++) {
        weight+=this.cars[i].weight;
      }

      var v=this.velocity+0;
      for(var i=0;i<this.cars.length;i++) {
        var velocity_sign=1;
        if(this.velocity < 0) velocity_sign=-1;
      
        var friction=Math.abs(this.cars[i].friction);
        var acceleration=this.cars[i].acceleration/weight;
        this.velocity+=acceleration*game_delta();
//        this.velocity*=trange(0,friction*game_delta()*scrange(0,Math.abs(this.velocity),10,5,1),1,1.0,crange(0,Math.abs(this.velocity),10,0.93,0.98));
        this.velocity-=crange(0,friction*game_delta(),1,0,velocity_sign);
//        this.velocity*=scrange(0,friction*game_delta(),1,1,scrange(0.1,Math.abs(v),2,0,1))
      }

      this.distance+=this.velocity*game_delta();

      $("#speed").text(Math.abs(this.velocity*3.6).toFixed(2)+" kph")

      distance=this.distance+0;
      for(var i=0;i<this.cars.length;i++) {
        this.cars[i].distance=distance;
        this.cars[i].velocity=this.velocity;
        distance-=this.cars[i].length;
        this.cars[i].updateModel();
      }
    },
    ready: function() {
      this.track=prop.railway.current.getRoot("master");
      this.distance=this.track.start;
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
}

function train_init_post() {
  var train=new Train({
//    track: prop.railway.current.getRoot("master"),
    velocity:0,
  });
  train.push(new Car({
    length: 20,
    weight: 30000
  }));
  train.push(new Car({
    length: 20,
    weight: 30000
  }));
  train.push(new Car({
    length: 20,
    weight: 30000
  }));
  train.push(new Car({
    length: 20,
    weight: 30000
  }));
  train_set_current(train_add(train));
}

function train_ready() {
  for(var i=0;i<prop.train.trains.length;i++) {
    prop.train.trains[i].ready();
  }
}

function train_add(train) {
  prop.train.trains.push(train);
  return train;
}

function train_set_current(train) {
  prop.train.current=train;
}

function train_update() {
  prop.train.current.power.value=prop.controls.power*prop.controls.direction;
  prop.train.current.brake.value=prop.controls.brake;

  if((prop.train.current.velocity < -0.2 && prop.controls.direction > 0) ||
     (prop.train.current.velocity > 0.2 && prop.controls.direction < 0)) {
    prop.train.current.power.value=0;
    prop.train.current.brake.value=prop.train.current.brake.max;
  }

  prop.train.current.update();
}
