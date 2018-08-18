(function () {
'use strict';
function generateColor(dot, dist)
{
	var colorText = "rgba(";

	var falloff = 5.0;
	var dist = dist / falloff;
	var intensity = document.querySelector('#light1').getAttribute('intensity') / (dist * dist);

	var midLight = 255 / 2.0;
	var maxLight = 255 - midLight;
	var colorNumber = parseInt((midLight + (maxLight * dot)) * intensity);

	if( colorNumber > 255 )
		colorNumber = 255;
	else if( colorNumber < 0 )
		colorNumber = 0;

	colorText += colorNumber + ", " + colorNumber + ", " + colorNumber;

	colorText += ")";

	return colorText;
}
AFRAME.registerComponent('bake-vertex-light', {
	schema: {
		light: {type: 'selector', default: '#light1'}
	},
	bake: function (object) 
	{
		this.el.sceneEl.object3D.updateMatrixWorld();
		var light = this.data.light.object3DMap.light;

		var pos = document.querySelector('#light1').getAttribute('position');
light.position.set(pos.x, pos.y, pos.z);

        //console.log(light);

        if (object.geometry.attributes) {
	//console.log('is buffer');
	var geo = new THREE.Geometry().fromBufferGeometry(object.geometry);
	object.geometry = geo;
	//console.log(object.geometry, geo);
}

		if( !object.geometry )
			return;
        object.geometry = object.geometry.clone();
		object.material.vertexColors = THREE.FaceColors;

		object.parent.updateMatrixWorld();

		var dist = object.getWorldPosition().distanceTo(light.getWorldPosition());

		if( !object.geometry.attributes )
		{
			//console.log('yay');
			//console.log(dist);
			// non-BUFFER geometry

			var count = object.geometry.faces.length;
			var keyLetters = ["a", "b", "c"];
			var vertexPosition = new THREE.Vector3();
			var vertexNormal = new THREE.Vector3();
			var normalLook = new THREE.Vector3();
			var lightLook = new THREE.Vector3();

			var i, face, j, dot, colorText;
			for( i = 0; i < count; i++ )
			{
				face = object.geometry.faces[i];

				for( j = 0; j < 3; j++ )
				{
					// get vertexPosition
					vertexPosition.copy(object.geometry.vertices[face[keyLetters[j]]]);
					vertexPosition.applyMatrix4(object.matrixWorld);

					// get vertexNormal
					vertexNormal.copy(object.geometry.vertices[face[keyLetters[j]]]);
					vertexNormal.add(face.vertexNormals[j]);
					vertexNormal.applyMatrix4(object.matrixWorld);

					// get vertexNormalLook
					normalLook.copy(vertexPosition);
					normalLook.sub(vertexNormal);
					normalLook.normalize();

					// get vertexLightLook
					lightLook.copy(vertexPosition);
					lightLook.sub(light.position);
					lightLook.normalize();

					// get dot
					dot = normalLook.dot(lightLook);

					colorText = generateColor(dot, dist);
					if( !!face.vertexColors[j] )
						face.vertexColors[j].set(colorText);
					else
						face.vertexColors[j] = new THREE.Color(colorText);

					object.geometry.colorsNeedUpdate = true;
				}
			}
		}

		else
		{
			// BUFFER geometry
			//console.log(object, object.geometry);
		}
	},
	update: function () {
		this.bake(this.el.object3DMap.mesh);
		this.el.addEventListener('model-loaded', function () {
			//console.log('loaded');
			this.el.object3DMap.mesh.traverse(function (child) {
				if (child instanceof THREE.Mesh) {
					this.bake(child);
				}
			}.bind(this));
		}.bind(this));
	}
});
}());