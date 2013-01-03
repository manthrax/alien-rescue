
var sphere;
var chopperObject;
var hellcatObject;
var sandrailObject;
var ptboatObject;
var billboardObject;
var fsQuadObject;
var waterObject;
var ralienModel;
var skybox;
var g_videoElement;

var skyboxTextures = ['assets/neg_x.png', 'assets/pos_x.png', 'assets/pos_y.png', 'assets/neg_y.png', 'assets/neg_z.png', 'assets/pos_z.png'];

// Terrain uniforms.
var zonlyConst = {
    viewInverse: viewInverse,
    viewVolume: viewVolume
};

var zonlyPer = {
	world: world,
	worldViewProjection: worldViewProjection,
	worldInverse: worldInverse,
	worldInverseTranspose: worldInverseTranspose,
        viewVolume: viewVolume
};

var skyConst = {
	viewInverse: viewInverse,
	lightMatrix: lightMatrix,
	specular: one4,
	shininess: 50,
	specularFactor: 0.2
};

var skyPer = {
	lightColor: new Float32Array([1, 1, 1, 1]),
	world: world,
	worldViewProjection: worldViewProjection,
	worldInverse: worldInverse,
	worldInverseTranspose: worldInverseTranspose
};

var sphereConst = {
	viewInverse: viewInverse,
	lightMatrix: lightMatrix,
	specular: one4,
	shininess: 50,
	specularFactor: 1.2
};

var spherePer = {
	lightColor: new Float32Array([1, 1, 1, 1]),
	world: world,
	worldViewProjection: worldViewProjection,
	worldInverse: worldInverse,
	worldInverseTranspose: worldInverseTranspose,
        scale:  5.0
};

function setupTerrainMaterial() {
	return {textures:textures,program:program};
}

var	terrainDef={
// Terrain uniforms.
	isStatic: true,
	exportName:'terrain',
	shaderConst:{
		viewInverse: viewInverse,
                lightMatrix: lightMatrix,
		specular: one4,
		shininess: 50,
		specularFactor: 0.2
	},
	shaderPer:{
		lightColor: new Float32Array([1, 1, 1, 1]),
		world: world,
		worldViewProjection: worldViewProjection,
		worldInverse: worldInverse,
		worldInverseTranspose: worldInverseTranspose
	},
	
	material:{
		textures:{
			diffuseSampler: 'assets/terrainLM.jpg',
			detailSampler: 'assets/MaPZone[Planet_01_diffuse].png',
			cubeSampler:skyboxTextures,
			dirtSampler: 'assets/dirt.png',
			grassSampler: 'assets/grass.png',
			stoneSampler: 'assets/stone.png',
			mixmapSampler: 'assets/terrainmix.png'
		}
	},
	vertexShader:'terrainVertexShader',
	fragmentShader:'terrainFragmentShader'
}


var	hellcatDef={
	exportName:'Hellcat',
	shaderConst:{
		rotorSpins: rotorSpins,
		viewInverse: viewInverse,
                lightMatrix: lightMatrix,
		specular: one4,
		shininess: 50,
		specularFactor: 1.2
	},
	shaderPer:{
		lightColor: new Float32Array([1, 1, 1, 1]),
		world: world,
		worldViewProjection: worldViewProjection,
		worldInverse: worldInverse,
		worldInverseTranspose: worldInverseTranspose
	},
	material:{
		textures:{
			diffuseSampler: 'assets/hellcat.jpg',
			detailSampler: 'assets/MaPZone[Planet_01_diffuse].png',
			cubeSampler: skyboxTextures
		}
	},
	vertexShader:'ralienVertexShader',
	fragmentShader:'ralienFragmentShader'
}

var	sandrailDef={
	exportName:'sandrail',
	shaderConst:{
		rotorSpins: rotorSpins,
		viewInverse: viewInverse,
                lightMatrix: lightMatrix,
		specular: one4,
		shininess: 50,
		specularFactor: 1.2
	},
	shaderPer:{
		lightColor: new Float32Array([1, 1, 1, 1]),
		world: world,
		worldViewProjection: worldViewProjection,
		worldInverse: worldInverse,
		worldInverseTranspose: worldInverseTranspose
	},
	material:{
		textures:{
			diffuseSampler: 'assets/sandrail.png',
			detailSampler: 'assets/MaPZone[Planet_01_diffuse].png',
			cubeSampler: skyboxTextures
		}
	},
	vertexShader:'ralienVertexShader',
	fragmentShader:'ralienFragmentShader'
}

var	ptboatDef={
	exportName:'ptboat',
	shaderConst:{
		rotorSpins: rotorSpins,
		viewInverse: viewInverse,
                lightMatrix: lightMatrix,
		specular: one4,
		shininess: 50,
		specularFactor: 1.2
	},
	shaderPer:{
		lightColor: new Float32Array([1, 1, 1, 1]),
		world: world,
		worldViewProjection: worldViewProjection,
		worldInverse: worldInverse,
		worldInverseTranspose: worldInverseTranspose
	},
	material:{
		textures:{
			diffuseSampler: 'assets/ptboat.png',
			detailSampler: 'assets/MaPZone[Planet_01_diffuse].png',
			cubeSampler: skyboxTextures
		}
	},
	vertexShader:'ralienVertexShader',
	fragmentShader:'ralienFragmentShader'
}

var chopperDef={
	exportName:'Cube002',
	shaderConst:{
		rotorSpins: rotorSpins,
		viewInverse: viewInverse,
                lightMatrix: lightMatrix,
		specular: one4,
		shininess: 50,
		specularFactor: 1.2,
                viewVolume: viewVolume
	},
	
	shaderPer :{
		lightColor: new Float32Array([1, 1, 1, 1]),
		world: world,
		worldViewProjection: worldViewProjection,
		worldInverse: worldInverse,
		worldInverseTranspose: worldInverseTranspose
	},
	material:{
		textures:{
			diffuseSampler: 'assets/oh6tex.png',
			detailSampler:'assets/MaPZone[Planet_01_diffuse].png',
			cubeSampler:skyboxTextures
		}
	},
	vertexShader:'chopperVertexShader',
	fragmentShader:'chopperFragmentShader',
	depthVertexShader:'chopperVertexShader',
	depthFragmentShader:'depthOnlyFragmentShader'
};



var ralienDef={
    exportName:"ralien",
    shaderConst:{
        viewInverse: viewInverse,
	lightMatrix: lightMatrix,
        specular: one4,
        shininess: 50,
        specularFactor: 1.2
    },
    shaderPer:{
        lightColor: new Float32Array([1, 1, 1, 1]),
        world: world,
        worldViewProjection: worldViewProjection,
        worldInverse: worldInverse,
        worldInverseTranspose: worldInverseTranspose
    },        
    material:{
        textures:{
            diffuseSampler:'assets/ralien.png',
            detailSampler:'assets/MaPZone[Planet_01_diffuse].png',
            cubeSampler: skyboxTextures
        }
    },
    vertexShader:'ralienVertexShader',
    fragmentShader:'ralienFragmentShader'
}

var	billboardDef={
	exportName:'billboard',
	shaderConst:{
		viewInverse: viewInverse,
                lightMatrix: lightMatrix,
		specular: one4,
		shininess: 0,
		specularFactor: 0.0
	},
	shaderPer:{
		lightColor: new Float32Array([1, 1, 1, 1]),
		world: world,
		worldViewProjection: worldViewProjection,
		worldInverse: worldInverse,
		worldInverseTranspose: worldInverseTranspose
	},
	material:{
		textures:{
			diffuseSampler: 'assets/billboard.png',
			detailSampler: 'assets/MaPZone[Planet_01_diffuse].png',
			cubeSampler: skyboxTextures
		}
	},
	vertexShader:'billboardVertexShader',
	fragmentShader:'billboardFragmentShader'
}

var	fsQuadDef={
	exportName:'fsQuad',
	shaderConst:{
        worldViewProjection:worldViewProjection,
        orthoWorldViewProjection:orthoWorldViewProjection,
        projectionInverse: projectionInverse,
		viewInverse: viewInverse,
		cameraMatrix: cameraMatrix,
		frustumFarCorners: frustumFarCorners,
		viewProjectionInverse:viewProjectionInverse,
		worldViewProjectionInverse:worldViewProjectionInverse,
        orthoProjectionInverse: orthoProjectionInverse,
		orthoViewInverse: orthoViewInverse,

                lightMatrix: lightMatrix,
		specular: one4,
		shininess: 0,
		specularFactor: 0.0
	},
	shaderPer:{
		lightColor: new Float32Array([1, 1, 1, 1]),
		world: world,
		view: view,
		worldViewProjection: worldViewProjection,
		worldInverse: worldInverse,
		worldInverseTranspose: worldInverseTranspose,
        viewInverse:viewInverse,
        orthoProjectionInverse: orthoProjectionInverse,
		orthoViewInverse: orthoViewInverse
	},
	material:{
		textures:{
			diffuseSampler: 'assets/billboard.png',
			depthSampler: 'assets/MaPZone[Planet_01_diffuse].png',
			shadowSampler: 'assets/sandrail.png'
		}
	},
	vertexShader:'texVertexShader',
	fragmentShader:'texFragmentShader'
}

var	waterDef={
	exportName:'waterPlane',
	shaderConst:{
		viewInverse: viewInverse,
                lightMatrix: lightMatrix,
		specular: one4,
		shininess: 0,
		timers: g_timers,
		specularFactor: 0.0,
		screenToRT: screenToRT
	},
	shaderPer:{
		lightColor: new Float32Array([1, 1, 1, 1]),
		world: world,
		worldViewProjection: worldViewProjection,
		worldInverse: worldInverse,
		worldInverseTranspose: worldInverseTranspose
	},
	material:{
		textures:{
			diffuseSampler: 'assets/MaPZone[stone_01_normal].png',
			depthSampler: 'assets/MaPZone[Planet_01_diffuse].png',
			cubeSampler: skyboxTextures
		}
	},
	vertexShader:'waterVertexShader',
	fragmentShader:'waterFragmentShader'
}

var	borgDef={
	exportName:'borg',
	shaderConst:{
		viewInverse: viewInverse,
		lightMatrix: lightMatrix,
		specular: one4,
		shininess: 0,
		specularFactor: 0.0
	},
	shaderPer:{
		lightColor: new Float32Array([1, 1, 1, 1]),
		world: world,
		worldViewProjection: worldViewProjection,
		worldInverse: worldInverse,
		worldInverseTranspose: worldInverseTranspose
	},
	material:{
		textures:{
			diffuseSampler: 'assets/borg.png',
			detailSampler: 'assets/MaPZone[Planet_01_diffuse].png',
			cubeSampler: skyboxTextures
		}
	},
	vertexShader:'billboardVertexShader',
	fragmentShader:'billboardFragmentShader'
}


function setupGrappler() {
    var textures = {
        diffuseSampler: textureLoad('assets/env_unholy_inshallah_valley_06.png'),
        //pos_y.png'),//env_unholy_inshallah_valley_01.png'),//MaPZone[Moon_diffuse].png'),
        detailSampler: textureLoad('assets/MaPZone[Planet_01_diffuse].png'),
        cubeSampler:textureLoad(skyboxTextures)
    };
    var program = createProgramFromTags('sphereVertexShader', 'sphereFragmentShader');
 
    var arrays = tdl.primitives.createCylinder(0.25,
    5.0,
    6,
    16);    
    return new tdl.models.Model(program, arrays, textures);
    
}

function setupSphere() {
    var textures = {
        diffuseSampler: textureLoad('assets/env_unholy_inshallah_valley_06.png'),
        //pos_y.png'),//env_unholy_inshallah_valley_01.png'),//MaPZone[Moon_diffuse].png'),
        detailSampler: textureLoad('assets/MaPZone[Planet_01_diffuse].png'),
        cubeSampler:textureLoad(skyboxTextures)
    };
    var program = createProgramFromTags('sphereVertexShader', 'sphereFragmentShader');
    var arrays = tdl.primitives.createSphere(0.5, 16, 16);
    return new tdl.models.Model(program, arrays, textures);
}

