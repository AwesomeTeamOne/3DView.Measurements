////////////////////////////////////////////////////////////////////////////////
//MeasurementInfo class
////////////////////////////////////////////////////////////////////////////////

THREE.MeasurementInfo = function ( ) {

	THREE.Measurement.call( this );
	
	this.createGizmo = function(container) {
		this.measurementGizmo = new THREE.MeasurementGizmoInfo( this, container );
		return this.measurementGizmo;
	};

	this.getValue = function() {
		return null;
	};

	this.getInfo = function() {
		var value = this.measurementGizmo.getValue();
		if (value == null) return [];

		return value;
	};
	
	this.getType = function() {
		return 'Point';
	};
	
	this.getDescription = function() {
		return 'Point information';
	}
	
}

THREE.MeasurementInfo.prototype = Object.create( THREE.Measurement.prototype );


////////////////////////////////////////////////////////////////////////////////////////////////
//class MeasurementGizmoInfo
////////////////////////////////////////////////////////////////////////////////////////////////
	
THREE.MeasurementGizmoInfo = function ( measurement, container ) {

	THREE.MeasurementGizmo.call( this, measurement, container );
	
	var scope = this;
	this.selectedFace = null;
	this.selectedObject = null;

	this.handleGizmos = {

		'START': [
			new THREE.Mesh( new THREE.SphereGeometry( 2 ), new THREE.MeasurementGizmoMaterial( { color: 0xff0000, opacity: 0.4 } ) )
		]
	}

	this.pickerGizmos = {

	}


	this.addControlPoint = function(point, object, forceAdd, face, callbackAddedObject) {
		
		THREE.MeasurementGizmo.prototype.addControlPoint.call(this, point, object, forceAdd, face, callbackAddedObject);
		
		if (scope.controlPoints.length == 1) {
			//1st point - add measurement to object
			if (object) {
				this.selectedFace = face;
				this.selectedObject = object;
				object.add(this.measurement);
				if (callbackAddedObject) callbackAddedObject(this.measurement);
			}
			
		} 
		
		this.show();
	}
	
	this.acceptPoints = function() {
		return this.controlPoints.length < 1;
	}
	
	this.mustDragGizmo = function() {
		return false;
	}
	
	this.mustSnapToPart = function() {
		return this.controlPoints.length < 1;
	}
	
	this.update = function ( camera ) {
	
		//update gizmos
		if (this.isVisible()) {
			this.show();
			updateGizmosFromControlPoints( camera );
		} else {
			this.hide();
		}
	}		

		
	this.getValue = function() {
		if (this.controlPoints.length < 1 || !this.selectedFace || !this.selectedObject || !this.selectedObject.geometry) return null;

		//get points in local coordinates
		var controlPoints = scope.getControlPointsWorld();
		var geometry = this.selectedObject.geometry;
		var facePoints = [
			this.selectedObject.localToWorld(geometry.vertices[this.selectedFace.a].clone()),
			this.selectedObject.localToWorld(geometry.vertices[this.selectedFace.b].clone()),
			this.selectedObject.localToWorld(geometry.vertices[this.selectedFace.c].clone())
			];
		var matrixWorldInverse = new THREE.Matrix4();
		matrixWorldInverse.getInverse(this.selectedObject.parent.matrixWorld);
		var normalMatrix = new THREE.Matrix3().getNormalMatrix( matrixWorldInverse );
		
		THREE.GeometryUtils.computeFaceNormal.call(geometry, this.selectedFace);
		var normal = this.selectedFace.normal.clone().applyMatrix3( normalMatrix ).normalize();
		
		return [
			{name: 'Point' , values: [controlPoints[0].x, controlPoints[0].y, controlPoints[0].z]},
			{name: 'Face' , values: [
					{name: 'Point1' , values:[facePoints[0].x, facePoints[0].y, facePoints[0].z]},
					{name: 'Point2' , values:[facePoints[1].x, facePoints[1].y, facePoints[1].z]},
					{name: 'Point3' , values:[facePoints[2].x, facePoints[2].y, facePoints[2].z]}
				]
			},
			{name: 'Normal' , values:[normal.x, normal.y, normal.z]}
		];

	};

	this.init();

	function updateGizmosFromControlPoints(camera) {
		
		//getting width
		var width = scope.getWidth(scope.getCenterPointWorld(), camera);
	
		var distance, correction;
		//get control points in world coordinates
		var controlPoints = scope.getControlPointsWorld();
		
		
		switch (scope.controlPoints.length) {
		
			case 1:
				
				//arrow
				var object = scope.handleGizmos['START'][0];
				object.position.copy(controlPoints[0]);
				object.scale.set(width, width, width);
				object.visible = true;

		}	
	}
	
}

THREE.MeasurementGizmoInfo.prototype = Object.create( THREE.MeasurementGizmo.prototype );