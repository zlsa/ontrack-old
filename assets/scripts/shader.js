
var Shader=Fiber.extend(function() {
  return {
    init: function(options) {
      if(!options) options={};
      
      this.name            = options.name || null;
      this.type            = options.type || "custom";

      this.json            = options.json || null;
      this.vertex          = options.vertex || "";
      this.fragment        = options.fragment || "";

      this.color           = options.color || null;
      this.metal           = options.metal || 20;
      this.shininess       = options.shininess || 20;

      this.map             = options.map || null;
      this.bumpMap         = options.bumpMap || null;
      this.bumpScale       = options.bumpScale || null;
      this.normalMap         = options.normalMap || null;

      this.uniforms        = {};

      this.textures        = {};
      
      this.material        = options.material || null;

      this.load();
    },
    loadedJSON:function() {
      if(this.json.fragment) {
        if(this.json.fragment == true) this.json.fragment=this.name+".frag";
        this.fragment_content=new Content({
          url: prop.shader.url_root+this.json.fragment,
          type: "string",
          payload: this.name,
          that: this,
          callback: function(status,data,payload) {
            this.fragment=shader_parse(data);
          }
        });
      } else {
        this.fragment=prop.shader.default_fragment;
      }
      if(this.json.vertex) {
        if(this.json.vertex == true) this.json.vertex=this.name+".vert";
        this.vertex_content=new Content({
          url: prop.shader.url_root+this.json.vertex,
          type: "string",
          payload: this.name,
          that: this,
          callback: function(status,data,payload) {
            this.vertex=shader_parse(data);
          }
        });
      } else {
        this.vertex=prop.shader.default_vertex;
      }
      if(this.json.textures) {
        for(var i=0;i<this.json.textures.length;i++) {
          var name=this.json.textures[i];
          var url=null;
          if(typeof name == typeof []) {
            url=name[1];
            name=name[0];
          }
          shader_get_texture(name,url);
        }
      }
    },
    load: function() {
      if(this.type == "custom") {
        var url=prop.shader.url_root+this.name+".json";
        this.json_content=new Content({
          url: url,
          type: "json",
          payload: this.name,
          that: this,
          callback: function(status,data,payload) {
            this.json=data;
            this.loadedJSON();
          }
        });
      }
    },
    linkUniforms: function() {
      if(this.type == "custom") {
        this.uniforms={};
        this.uniforms.time={
          type: "f",
          value: 0.0
        };
        this.uniforms.fogColor={
          type: "c",
          value: prop.environment.fog.color
        };
        this.uniforms.fogNear={
          type: "f",
          value: prop.environment.fog.near
        };
        this.uniforms.fogFar={
          type: "f",
          value: prop.environment.fog.far
        };
        if(this.json && this.json.textures) {
          for(var i=0;i<this.json.textures.length;i++) {
            var name=this.json.textures[i];
            if(typeof name == typeof []) name=name[0];

            var texture=new THREE.Texture(prop.shader.textures[name]);
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(2,2);
            texture.needsUpdate=true;

            this.uniforms[name]={
              type: "t",
              value: texture
            };
          }
        }
      } else if(this.type == "phong") {
      }
    },
    createMaterial: function() {
      if(this.type == "custom") {
        this.material=new THREE.ShaderMaterial({
          uniforms: this.uniforms,
          vertexShader: this.vertex,
          fragmentShader: this.fragment,
          side: THREE.DoubleSide
        });
      } else if(this.type == "phong") {
        var map=null;
        if(this.map) {
          map=new THREE.Texture(prop.shader.textures[this.map]);
          map.wrapS = map.wrapT = THREE.RepeatWrapping;
          map.repeat.set(2,2);
          map.needsUpdate=true;
        }

        var bumpMap=null;
        if(this.bumpMap) {
          bumpMap=new THREE.Texture(prop.shader.textures[this.bumpMap]);
          bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
          bumpMap.repeat.set(2,2);
          bumpMap.needsUpdate=true;
        }

        var normalMap=null;
        if(this.normalMap) {
          normalMap=new THREE.Texture(prop.shader.textures[this.normalMap]);
          normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
          normalMap.repeat.set(2,2);
          normalMap.needsUpdate=true;
        }

        this.material=new THREE.MeshPhongMaterial({
          color: this.color,
          shininess: this.shininess,
          metal: this.metal,
          map: map,
          bumpMap: bumpMap,
          bumpScale: this.bumpScale,
          normalMap: normalMap,
          side: THREE.DoubleSide
        });
      }
    },
    ready: function() {
      if(this.type == "custom") {
        this.linkUniforms();
        this.createMaterial();
      } else {
        this.createMaterial();
      }
    }
  };
});

function shader_init_pre() {

  prop.shader={};

  prop.shader.url_root="assets/shaders/";

  prop.shader.shaders={};

  prop.shader.textures={};

  prop.shader.default_vertex=[
    "varying vec2 vUV;",
    "varying float vD;",
    "varying vec3 vNormal;",
    "void main() {",
    "  vUV = uv;",
    "  vNormal = normal;",
    "  vec4 pos = vec4(position,1.0);",
    "  gl_Position=projectionMatrix * modelViewMatrix * pos;",
    "  vD = gl_Position.z;",
    "}",
  ].join("\n");

  prop.shader.default_fragment=[
    "void main() {",
    "  gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);",
    "}",
  ].join("\n");

}

function shader_init() {
  shader_load("skydome");
  shader_load("grass");
//  shader_load("gravel");
  shader_get_texture("concrete-sleeper");
  shader_get_texture("concrete-sleeper-normal");
  shader_add(new Shader({
    name: "gravel",
    type: "phong",
    map: "concrete-sleeper",
    normalMap: "concrete-sleeper-normal",
    metal: false,
    shininess: 5,
  }));
  shader_add(new Shader({
    name: "rails",
    type: "phong",
    color:0x776655,
    shininess:20,
  }));
}

function shader_ready_pre() {
  for(var i in prop.shader.shaders) {
    prop.shader.shaders[i].ready();
  }
}

function shader_load(name) {
  var shader=new Shader({
    name: name
  });
  shader_add(shader);
  return shader;
}

function shader_add(shader) {
  prop.shader.shaders[shader.name]=shader;
}

function shader_parse(text) {
  return text
    .replace("$UTILS",prop.draw.shaders["utils"])
    .replace("$FOG_PARAMETERS",prop.draw.shaders["fog-parameters"])
    .replace("$FOG_COLOR",prop.draw.shaders["fog-color"]);
}

function shader_get_texture(name,url) {
  if(name in prop.shader.textures) return;
  if(!url) url="assets/textures/"+name+".png";
  else url="assets/textures/"+url;
  var image_content=new Content({
    url: url,
    type: "image",
    payload: name,
    callback: function(status,data,payload) {
      prop.shader.textures[payload]=data;
    }
  });
  prop.shader.textures[name]=image_content.data;
}

function shader_get(name) {
  return prop.shader.shaders[name];
}

function shader_get_material(name) {
  return shader_get(name).material;
}
