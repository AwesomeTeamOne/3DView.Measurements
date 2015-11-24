/* 3DView.Measurements
 * 
 * @author awesometeam / awesometeamone@gmail.com
 *
 * Description: 3D models viewing control with interactive measurements
 * Support distance, thickness, angle and radius measurements
 * Part of 3DView Chrome app https://chrome.google.com/webstore/detail/3dview/hhngciknjebkeffhafnaodkfidcdlcao
 * Requires three.js r73
 *
 * License: LGPL v3
 *
 * Usage:
 *	 	var renderer = new THREE.WebGLRenderer(); //for webgl rendering
 *
 * 		//set view
 *		//controlsType can be "trackball" or "orbit"
 *		var view = new View3D(document.getElementById( 'container' ), renderer, {controlsType : "trackball"});
 * 		
 * 		//load STL file
 * 		new THREE.STLLoader().load( './models/3DView.stl', function ( geometry ) {
 * 			view.addGeometry( geometry );
 * 		} );
 * 		
 * 		//add measurement
 * 		view.addMeasurement(new THREE.MeasurementDistance());
 *
 */

 View3D = function ( dom, renderer, settings ) {	
 
	///////////////////////////public interface
 
	this.addMeasurement = function(measurement) {
		measurementControls.add(measurement);
		measurementControls.enabled = true;
	}

	this.removeMeasurement = function(measurement) {
		measurementControls.remove(measurement);
		if (measurement.parent)
			measurement.parent.remove(measurement);
	}
	
	this.addObject = function( mesh ) {
		if (!(mesh instanceof THREE.Mesh))
			return null;
			
		var geometry = mesh.geometry;
		
		var boundingSphere = geometry.boundingSphere.clone();

		mesh.rotateX (-Math.PI/2);
		mesh.updateMatrixWorld();
		scene.add( mesh );

		var center = mesh.localToWorld(boundingSphere.center);
		scope.controls.target.copy( center );
		scope.controls.minDistance = boundingSphere.radius * 0.5;
		scope.controls.maxDistance = boundingSphere.radius * 3;
		
		camera.position.set(0, 0, boundingSphere.radius * 2).add(center);
		camera.lookAt( center );
	}

	this.addGeometry = function(geometry) {
		var material =  (geometry.hasColors) 
			? 
			new THREE.MeshPhongMaterial( { specular: 0x111111, emissive: 0X151515, color:  0xcccccc, shininess:20, side: THREE.DoubleSide,  opacity: geometry.alpha, vertexColors: THREE.VertexColors, shading: THREE.FlatShading } )
			:
			new THREE.MeshPhongMaterial( { specular: 0x111111, emissive: 0X050505, color:  0xcccccc, shininess:20, side: THREE.DoubleSide, shading: THREE.FlatShading } );
			
		if (geometry instanceof THREE.BufferGeometry) {
			geometry = new THREE.Geometry().fromBufferGeometry(geometry);
		}
		geometry.computeFaceNormals();
		geometry.computeBoundingSphere();
		geometry.normalsNeedUpdate  = true;
		
		return this.addObject(new THREE.Mesh( geometry, material ));

	}
	
	this.clear = function() {
		while (scene.children.length)
			scene.remove(scene.children[0]);
	}

	this.clearMeasurements = function() {
		for (var key in scene.children) {
			var measurements = [];
			scene.children[key].traverse( function ( child ) {

				if ( child instanceof THREE.Measurement ) 
					measurements.push(child);

			} );			
		}
		
		for (var key in measurements) {
			this.removeMeasurement(measurements[key]);
		}
		
	}
	
	///////////////////////////private section
	
	if (settings) {
		this.controlsType = settings.controlsType;
	}
	
	var scope = this;
	var container = new UI.Panel().setPosition('relative');
	var camera, scene, measurementControls;
	var scope = this;	
	
	function init() {
	
		scene = new THREE.Scene();
		dom = dom ? dom : window;
		dom.appendChild(container.dom);
		container.dom.appendChild( renderer.domElement );

		//camera
		camera = new THREE.PerspectiveCamera( 60, dom.offsetWidth / dom.offsetHeight, 1, 1000 );
		camera.position.z = 50;

		//controls
		if (scope.controlsType == "orbit") {
			scope.controls = new THREE.OrbitControls( camera, container.dom );
			scope.controls.enableDamping = true;
			scope.controls.dampingFactor = 0.25;
			scope.controls.enableZoom = true;
		} else {
			scope.controls = new THREE.TrackballControls( camera, container.dom );

			scope.controls.rotateSpeed = 10.0;
			scope.controls.zoomSpeed = 3.0;
			scope.controls.panSpeed = 0.8;

			scope.controls.noZoom = false;
			scope.controls.noPan = false;

			scope.controls.staticMoving = true;
			scope.controls.dynamicDampingFactor = 0.3;

			scope.controls.keys = [ 65, 83, 68 ];
		}
		scope.controls.addEventListener( 'change', function () {
			measurementControls.update();
			render();
		} );

		// lights

		light = new THREE.PointLight( 0xFFFFFF, 1, 0 );
		scene.add( light );


		// measurement controls
	
		measurementControls = new THREE.MeasurementControls({objects: scene.children}, camera, container);
		measurementControls.enabled = false;
		measurementControls.snap = true;
		measurementControls.addEventListener( 'change', function (event) {
		
			scope.dispatchEvent( {type: "measurementChanged", object: event.object} );
			render();

		} );
		measurementControls.addEventListener( 'objectAdded', function (event) {
		
			scope.dispatchEvent( { type: "measurementAdded", object: event.object } );
			render();
			
		} );
		measurementControls.addEventListener( 'objectRemoved', function (event) {
		
			scope.dispatchEvent( { type: "measurementRemoved", object: event.object } );
			
		} );
		
		scene.add( measurementControls );	

		//logo
		container.add(new UI.Panel().setTextContent( 'Powered by 3DView' ).setPosition('absolute').setRight('0px').setBottom('30px').setOpacity('0.5').setDisplay('inline').setFontSize('12px').setFontWeight('normal').setPadding('0px').setMargin('0px').setCursor('default').setWidth('200px').setHeight('12px').setColor('#000') );		

		//window
		window.addEventListener( 'resize', onWindowResize, false );
		onWindowResize();

	}

	function onWindowResize() {

		camera.aspect = dom.offsetWidth / dom.offsetHeight;
		camera.updateProjectionMatrix();

		renderer.setSize( dom.offsetWidth, dom.offsetHeight );
		measurementControls.update();

	}

	function animate() {

		requestAnimationFrame( animate );

		scope.controls.update(); // required if controls.enableDamping = true, or if controls.autoRotate = true
		light.position.copy(camera.position);

		render();

	}

	function render() {

		renderer.render( scene, camera );

	}
	
	init();
	animate();	

}
 
 THREE.EventDispatcher.prototype.apply( View3D.prototype );

 
///////////////////////////////////////////////////////////////////////////////
//Service functions
///////////////////////////////////////////////////////////////////////////////

function projectPointToVector(point, vectorOrigin, vector) {
	
	return new THREE.Vector3().copy(point).sub(vectorOrigin).projectOnVector(vector).add(vectorOrigin);
	
}
 
function projectPointToPlane(point, planeOrigin, planeNormal) {
	
	return new THREE.Vector3().copy(point).sub(planeOrigin).projectOnPlane(planeNormal).add(planeOrigin);
	
}
 
function linePlaneIntersection(lineOrigin, lineNormal, planeOrigin, planeNormal) {
	var u = new THREE.Vector3().copy(lineNormal);
	var w = new THREE.Vector3().copy(lineOrigin).sub(planeOrigin);
	var pN = new THREE.Vector3().copy(planeNormal);

	var d = pN.dot(u);
	var n = pN.dot(w) *-1.0;

	if (Math.abs(d) < 0.00001) { // segment is (almost) parallel to plane
		return;
	}
	
	var sI = n / d;
	return new THREE.Vector3().copy(lineOrigin).add(u.multiplyScalar(sI));   // compute segment intersect point
}

CircleFitting = function () {
	this.radius = -1;
	this.center = new THREE.Vector3();
	this.normal = new THREE.Vector3();

	this.fitPoints = function(pt1, pt2, pt3) {
		var bc = new THREE.Vector3().subVectors( pt2, pt3 );
		var ab = new THREE.Vector3().subVectors( pt1, pt2 );
		this.normal.copy(bc).cross(ab);
		this.radius = -1;
		
		if (this.normal.length() > 0.0001) {
			this.normal.normalize();
			var na = new THREE.Vector3().copy(ab).cross(this.normal);
			var nc = new THREE.Vector3().copy(bc).cross(this.normal);
			var ca = new THREE.Vector3().addVectors( pt1, pt2 ).divideScalar(2);
			var cc = new THREE.Vector3().addVectors( pt2, pt3 ).divideScalar(2);
			var intersection1 = linePlaneIntersection(cc, nc, ca, ab);
			var intersection2 = linePlaneIntersection(ca, na, cc, bc);
			if (intersection1 && intersection2)
				this.center = intersection1.add(intersection2).divideScalar(2);
			else if (intersection1)
				this.center = intersection1;
			else if (intersection2)
				this.center = intersection2;
			else return false;
			
			this.radius = (this.center.distanceTo(pt1) + this.center.distanceTo(pt2) + this.center.distanceTo(pt3)) /3;
			return true;
		}
		return false;
		
	}

}

THREE.GeometryUtils.computeFaceNormal = function (face) {
	var cb = new THREE.Vector3(), ab = new THREE.Vector3();
	if (!face)
		return cb;
	
	var vA = this.vertices[ face.a ];
	var vB = this.vertices[ face.b ];
	var vC = this.vertices[ face.c ];

	cb.subVectors( vC, vB );
	ab.subVectors( vA, vB );
	cb.cross( ab );

	cb.normalize();

	face.normal.copy( cb );
	return face.normal;
};

THREE.DynamicTorusGeometry = function ( radius, tube, radialSegments, tubularSegments, arc ) {

	THREE.TorusGeometry.call( this, radius, tube, radialSegments, tubularSegments, arc );

	this.updateArc = function (arc, updateFaces) {

		this.arc = arc || Math.PI * 2;

		var center = new THREE.Vector3(), uvs = [], normals = [];

		for ( var j = 0, index = 0; j <= this.radialSegments; j ++ ) {

			for ( var i = 0; i <= this.tubularSegments; i ++, index ++ ) {

				var u = i / this.tubularSegments * this.arc;
				var v = j / this.radialSegments * Math.PI * 2;

				center.x = this.radius * Math.cos( u );
				center.y = this.radius * Math.sin( u );

				var vertex = this.vertices[index];
				vertex.x = ( this.radius + this.tube * Math.cos( v ) ) * Math.cos( u );
				vertex.y = ( this.radius + this.tube * Math.cos( v ) ) * Math.sin( u );
				vertex.z = this.tube * Math.sin( v );

				if (updateFaces) {
					uvs.push( new THREE.Vector2( i / this.tubularSegments, j / this.radialSegments ) );
					normals.push( vertex.clone().sub( center ).normalize() );
				}

			}
		}

		if (updateFaces) {
			for ( var j = 1, index = 0; j <= this.radialSegments; j ++ ) {

				for ( var i = 1; i <= this.tubularSegments; i ++, index ++ ) {
				
					var face = this.faces[index];

					var a = ( this.tubularSegments + 1 ) * j + i - 1;
					var b = ( this.tubularSegments + 1 ) * ( j - 1 ) + i - 1;
					var c = ( this.tubularSegments + 1 ) * ( j - 1 ) + i;
					var d = ( this.tubularSegments + 1 ) * j + i;

					face.normal.copy( normals[ a ] );
					face.normal.add( normals[ b ] );
					face.normal.add( normals[ d ] );
					face.normal.normalize();

					this.faceVertexUvs[ 0 ][index] = [ uvs[ a ].clone(), uvs[ b ].clone(), uvs[ d ].clone() ];

					index ++;
					var face = this.faces[index];
					face.normal.copy( normals[ b ] );
					face.normal.add( normals[ c ] );
					face.normal.add( normals[ d ] );
					face.normal.normalize();

					this.faceVertexUvs[ 0 ][index] = [ uvs[ b ].clone(), uvs[ c ].clone(), uvs[ d ].clone() ];
				}

			}
		this.elementsNeedUpdate = true;	
		this.uvsNeedUpdate = true;
		this.normalsNeedUpdate = true;	
		this.computeCentroids();
		}
		
	this.verticesNeedUpdate = true;
	}


};

THREE.DynamicTorusGeometry.prototype = Object.create( THREE.TorusGeometry.prototype );