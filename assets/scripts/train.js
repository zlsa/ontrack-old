
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
        rolling: 0,
        brake: 0,
        aero: 0
      };
      this.friction=0;

      this.brake={
        force:0.5
      };
      
      this.power={
        force: 3500
      };

    },
    setTrain: function(train) {
      this.train=train;
      this.track=train.track;
      this.createModel();
    },
    update: function() {
      if(!this.train) return;
      if(!this.track) return;

      var time_seed=game_time()+this.distance;
      this.tilt_factors.cant=this.track.getCant(this.distance);
      this.tilt_factors.wobble= sin(time_seed*0.5)*trange(0,Math.abs(this.velocity),100,radians(0),radians(0.5));
      this.tilt_factors.wobble+=sin(time_seed*2  )*trange(0,Math.abs(this.velocity),100,radians(0),radians(0.3));
      this.tilt_factors.wobble+=sin(time_seed*5  )*trange(0,Math.abs(this.velocity),100,radians(0),radians(0.1));
      this.tilt_factors.wobble+=sin(time_seed*10 )*trange(0,Math.abs(this.velocity),100,radians(0),radians(0.2));
      this.tilt_factors.wobble*=3;

      this.tilt_factors.wind=sin(time_seed*0.3)*radians(0.5);

      this.tilt=0;
      for(var i in this.tilt_factors) this.tilt+=this.tilt_factors[i];

      this.friction_factors.rolling=0.001*this.velocity;
      this.friction_factors.aero=trange(0,Math.abs(this.velocity),100,0,0.7);
      this.friction_factors.brake=trange(0,this.train.brake.value,this.train.brake.max,0,this.brake.force);

      this.friction=0;
      for(var i in this.friction_factors) {
        this.friction+=Math.abs(this.friction_factors[i]);
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

      this.acceleration/=this.weight;

    },
    updateModel: function() {
      var position= this.track.getPosition( this.distance);
      var rotation= this.track.getRotation( this.distance);
      var cant=     this.track.getCant(     this.distance);
      var pitch=    this.track.getPitch(    this.distance);
      var elevation=this.track.getElevation(this.distance);
      
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

      this.distance     = options.distance || this.track.start;
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

      for(var i=0;i<this.cars.length;i++) {
        var friction=Math.abs(this.cars[i].friction);
        var acceleration=this.cars[i].acceleration;
        this.velocity+=acceleration*game_delta();
        this.velocity*=trange(0,friction*game_delta()*scrange(0,Math.abs(this.velocity),5,5,1),1,1.0,crange(0,Math.abs(this.velocity),10,0.93,0.98));
      }

      this.distance+=this.velocity*game_delta();

      $("#speed").text((this.velocity*3.6).toFixed(2)+" kph")

      distance=this.distance+0;
      for(var i=0;i<this.cars.length;i++) {
        this.cars[i].distance=distance;
        this.cars[i].velocity=this.velocity;
        distance-=this.cars[i].length;
        this.cars[i].updateModel();
      }
    }
  };
});

function train_init_pre() {
  prop.train={};

  prop.train.trains=[];

  prop.train.current=null;
}

function train_ready_post() {
  var train=new Train({
    track: prop.railway.current.getRoot("master"),
    velocity:10,
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
  train_set_current(train_add(train));
}

function train_add(train) {
  prop.train.trains=train;
  return train;
}

function train_set_current(train) {
  prop.train.current=train;
}

function train_update() {
  prop.train.current.power.value=prop.controls.power*prop.controls.direction;
  prop.train.current.brake.value=prop.controls.brake;

  prop.train.current.update();
}
