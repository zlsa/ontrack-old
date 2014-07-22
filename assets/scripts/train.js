
var Car=Fiber.extend(function() {
  return {
    init: function(options) {
      if(!options) options={};
      this.distance     = 0; // set by the train
      this.velocity     = 0; // set by the train
      this.train        = options.train || null;
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
    },
    update: function() {
      if(!this.train) return;
      if(!this.track) return;

      this.tilt_factors.cant=this.track.getCant(this.distance);
      this.tilt_factors.wobble=sin(time()*5)*trange(0,Math.abs(this.velocity),100,radians(0),radians(0.3));
      this.tilt_factors.wobble+=sin(time()*20)*trange(0,Math.abs(this.velocity),100,radians(0),radians(0.3));
      this.tilt_factors.wobble+=sin(time()*50)*trange(0,Math.abs(this.velocity),100,radians(0),radians(0.3));
      this.tilt_factors.wobble+=sin(time()*100)*trange(0,Math.abs(this.velocity),100,radians(0),radians(0.3));
      this.tilt_factors.wind=sin(time()*0.3)*radians(0.5);
      this.tilt=0;
      for(var i in this.tilt_factors) this.tilt+=this.tilt_factors[i];

      var pitch=this.track.getPitch(this.distance);

      this.acceleration_factors.gravity=-prop.environment.gravity*trange(0,pitch,Math.PI,0,10);
      this.acceleration_factors.engine=2;
      this.acceleration=0;

      for(var i in this.acceleration_factors) {
        var factor=this.acceleration_factors[i];
        this.acceleration+=factor;
      }

      this.friction_factors.rolling=0.01*this.velocity;
      this.friction_factors.aero=srange(0,Math.abs(this.velocity),100,0,10);
      this.friction_factors.brake=1;

      this.friction=0;
      for(var i in this.friction_factors) {
        var factor=this.friction_factors[i];
        if(i == "rolling" || i == "aero" || i == "brake") {
          factor=Math.abs(factor);
        }
        this.friction+=factor;
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

      this.distance     = 10;
      this.velocity     = 10;

    },
    push: function(car) {
      this.cars.push(car);
      car.train=this;
      car.track=this.track;
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
      var distance=this.distance+0;
      for(var i=0;i<this.cars.length;i++) {
        this.cars[i].distance=distance;
        this.cars[i].velocity=this.velocity;
        distance-=this.cars[i].length;
        this.cars[i].update();
      }

      var velocity_sign=crange(-0.01,this.velocity,0.01,-1,1);
      
      for(var i=0;i<this.cars.length;i++) {
        var friction=Math.abs(this.cars[i].friction);
        var acceleration=this.cars[i].acceleration;
        this.velocity+=acceleration*delta();
        this.velocity-=friction*velocity_sign*delta();
      }

      this.distance+=this.velocity*delta();

      $("#speed").text((this.velocity*3.6).toFixed(2)+" kph")
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
    position: 10,
    velocity: 10
  });
  train.push(new Car({
    length: 20,
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
  prop.train.current.update();
}
