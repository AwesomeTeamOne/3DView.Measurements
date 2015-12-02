/* 3DView.Measurements
 * 
 * @author awesometeam / awesometeamone@gmail.com
 *
 * License: LGPL v3
 *
 */

////////////////////////////////////////////////////////////////////////////////
//MeasurementAngle class
////////////////////////////////////////////////////////////////////////////////

THREE.MeasurementRadius = function ( ) {

	THREE.Measurement.call( this );
	
	this.createGizmo = function(container) {
		this.measurementGizmo = new THREE.MeasurementGizmoRadius( this, container );
		return this.measurementGizmo;
	};

	this.getValue = function() {
		return this.measurementGizmo.getValue();
	};

	this.getInfo = function() {
		//get control points in world coordinates
		var controlPoints = this.measurementGizmo.getControlPointsWorld();
		
		var info = [];
		var radius = this.measurementGizmo.circleFit.radius;
		var center = this.measurementGizmo.circleFit.center;
		info.push({name: 'Center ', values:[center.x, center.y, center.z]});
		
		for (var i=0; i<Math.min(3, controlPoints.length); ++i) {
			info.push({name: 'Point '+ (i+1).toString()
			, values:[controlPoints[i].x, controlPoints[i].y, controlPoints[i].z]});
		}
		return info;
	};

	this.getType = function() {
		return 'Radius';
	};
	
	this.getDescription = function() {
		var value = this.getValue();
		if (value == null) return "radius";
		
		return 'radius = ' + this.measurementGizmo.circleFit.radius.toFixed(2);
	}

}

THREE.MeasurementRadius.prototype = Object.create( THREE.Measurement.prototype );


////////////////////////////////////////////////////////////////////////////////////////////////
//class MeasurementGizmoRadius
////////////////////////////////////////////////////////////////////////////////////////////////
	
THREE.MeasurementGizmoRadius = function ( measurement, container ) {

	THREE.MeasurementGizmo.call( this, measurement, container );
	this.circleFit = new CircleFitting();
	
	var scope = this;

	this.handleGizmos = {

		'CIRCLE': [
			new THREE.Mesh( new THREE.TorusGeometry( 10, 0.3, 2, 36), new THREE.MeasurementGizmoMaterial( { color: 0xff0000, opacity: 0.2 } ) )
		],
		'START': [
			new THREE.Mesh( new THREE.SphereGeometry( 2 ), new THREE.MeasurementGizmoMaterial( { color: 0xff0000, opacity: 0.4 } ) )
		],
		'MIDDLE': [
			new THREE.Mesh( new THREE.SphereGeometry( 2 ), new THREE.MeasurementGizmoMaterial( { color: 0xff0000, opacity: 0.4 } ) )
		],
		'END': [
			new THREE.Mesh( new THREE.SphereGeometry( 2 ), new THREE.MeasurementGizmoMaterial( { color: 0xff0000, opacity: 0.4 } ) )
		],
		'CENTER': [
			new THREE.Mesh( new THREE.SphereGeometry( 2 ), new THREE.MeasurementGizmoMaterial( { color: 0xff0000, opacity: 0.4 } ) )
		],
		'ARROW': [
			new THREE.Mesh( new THREE.CylinderGeometry( 3, 0, 6, 8, 1, false ), new THREE.MeasurementGizmoMaterial( { color: 0xff0000, opacity: 0.4 } ) ),
			new THREE.Vector3( 0, 1, 0 ),
			new THREE.Vector3( Math.PI/2, 0, 0 )
		],
		'RADIUS': [
			new THREE.Mesh( new THREE.CylinderGeometry( 1, 1, 1, 4, 1, false ), new THREE.MeasurementGizmoMaterial( { color: 0xff0000, opacity: 0.4 } ) ),
			new THREE.Vector3( 0, 0.5, 0 ),
			new THREE.Vector3( Math.PI/2, 0, 0 )
		],
		'LINE': [
			new THREE.Mesh( new THREE.CylinderGeometry( 1, 1, 1, 4, 1, false ), new THREE.MeasurementGizmoMaterial( { color: 0x000000, opacity: 0.2 } ) ),
			new THREE.Vector3( 0, 0.5, 0 ),
			new THREE.Vector3( Math.PI/2, 0, 0 )
		]
	}

	this.pickerGizmos = {

		'ARROW': [
			new THREE.Mesh( new THREE.SphereGeometry( 4 ), THREE.MeasurementPickerMaterial )
		],
		'RADIUS': [
			new THREE.Mesh( new THREE.CylinderGeometry( 3, 3, 1, 4, 1, false ), THREE.MeasurementPickerMaterial ),
			new THREE.Vector3( 0, 0.5, 0 ),
			new THREE.Vector3( Math.PI/2, 0, 0 )
		],
		'LINE': [
			new THREE.Mesh( new THREE.CylinderGeometry( 3, 3, 1, 4, 1, false ), THREE.MeasurementPickerMaterial ),
			new THREE.Vector3( 0, 0.5, 0 ),
			new THREE.Vector3( Math.PI/2, 0, 0 )
		],
		'TEXT': [
			new THREE.Mesh( new THREE.SphereGeometry( 4 ), THREE.MeasurementPickerMaterial )
		]

	}


	this.addControlPoint = function(point, object, forceAdd, face, callbackAddedObject) {
		
		var object = (scope.controlPoints.length < 3) ? object : scope.controlPoints[0].object; //for 4th point use object of the 1st point
		THREE.MeasurementGizmo.prototype.addControlPoint.call(this, point, object, forceAdd, face, callbackAddedObject);
		
		if (scope.controlPoints.length == 1) {
			//1st point - add measurement to object
			if (object) {
				object.add(this.measurement);
				if (callbackAddedObject) callbackAddedObject(this.measurement);
			}
			
		} 
		
		this.show();
	}
	
	this.acceptPoints = function() {
		return this.controlPoints.length < 3;
	}
	
	this.mustDragGizmo = function() {
		if (this.controlPoints.length == 3)
			return this.pickerGizmos['TEXT'][0];
		return false;
	}
	
	this.mustSnapToPart = function() {
		return this.controlPoints.length < 3;
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

	this.onGizmoMoved = function(gizmo, offset) {
		switch (gizmo) {
			case "ARROW":
			case "RADIUS":
			case "LINE":
			case "TEXT":
				if (this.controlPoints.length == 4) {
					var controlPoints = this.getControlPointsWorld();
					var cb = new THREE.Vector3().subVectors( controlPoints[2], controlPoints[1] );
					var ab = new THREE.Vector3().subVectors( controlPoints[0], controlPoints[1] );
					var pN = new THREE.Vector3().copy(cb).cross(ab);
					if (pN.length() > 0.0001) {
						//radius is not 0
						this.offsetControlPoint(3, new THREE.Vector3().copy(offset).projectOnPlane(pN));
					}
				}
				break;
		}
	}

		
	this.getValue = function() {
		if (this.controlPoints.length < 3) return null;

		//get points in local coordinates
		var controlPoints = scope.getControlPointsWorld();
		
		if (this.circleFit.fitPoints(controlPoints[0], controlPoints[1], controlPoints[2])) {
			return this.circleFit.radius;
		} 
		
		return 0;

	};

	this.init();

	function updateGizmosFromControlPoints(camera) {
		
		//getting width
		var width = scope.getWidth(scope.getCenterPointWorld(), camera);
	
		var distance, correction;
		//get control points in world coordinates
		var controlPoints = scope.getControlPointsWorld();
		
		
		switch (scope.controlPoints.length) {
		
			
			case 4:
				
				//getting parameters
				var radius = scope.getValue();
				var center = scope.circleFit.center; //center is calculated already by getValue();
				var normal = scope.circleFit.normal; //normal is calculated already by getValue();

				//hide all
				var handle = scope.handleGizmos['CIRCLE'][0];
				
				handle.visible = false;
				scope.handleGizmos['CENTER'][0].visible = false;
				scope.handleGizmos['RADIUS'][0].visible = false;
				scope.handleGizmos['LINE'][0].visible = false;
				scope.handleGizmos['ARROW'][0].visible = false;

				if (normal.length() > 0.0001 && radius > 0) { //radius is not 0
					var referencePoint = projectPointToPlane(controlPoints[3], controlPoints[1], normal);
					var referenceRadius = center.distanceTo(referencePoint);
					var lookAtTarget = new THREE.Vector3().copy(center).add(normal);
					var lineCorrection = new THREE.Vector3().copy(referencePoint).sub(center).setLength(width * 2.0);

					//circle handle
					handle.position.copy(center);
					handle.lookAt(lookAtTarget);
					handle.scale.set(radius / 10.3, radius / 10.3, width) ;
					handle.visible = true;
					
					//center point
					var object = scope.handleGizmos['CENTER'][0];
					object.position.copy(center);
					object.scale.set(width, width, width);
					object.visible = true;


					//radius
					if (radius > 4*width) {
						var object = scope.handleGizmos['RADIUS'][0];
						
						//radius handle
						object.position.copy(center).add(lineCorrection);
						object.lookAt(referencePoint);
						object.scale.set(width, width, radius-4*width);
						object.visible = true;

						//radius picker
						var object = scope.pickerGizmos['RADIUS'][0];
						
						object.position.copy(center).add(lineCorrection);
						object.lookAt(referencePoint);
						object.scale.set(width, width, radius-4*width);
					}

					var arrowPosition = new THREE.Vector3().copy(lineCorrection).setLength(radius-width*2).add(center);

					//arrow handle
					var object = scope.handleGizmos['ARROW'][0];
					object.position.copy(arrowPosition);
					object.lookAt(center);
					object.scale.set(width, width, width);
					object.visible = true;

					//arrow picker
					var object = scope.pickerGizmos['ARROW'][0];
					object.position.copy(arrowPosition);
					object.scale.set(width, width, width);

					
					//line
					distance = referenceRadius - radius;
					if (distance > 4*width) {
						//line handle
						var object = scope.handleGizmos['LINE'][0];
						
						object.position.copy(arrowPosition).add(lineCorrection);
						object.lookAt(referencePoint);
						object.scale.set(width, width, distance-4*width);
						object.visible = true;

						//line picker
						var object = scope.pickerGizmos['LINE'][0];
						
						object.position.copy(arrowPosition).add(lineCorrection);
						object.lookAt(referencePoint);
						object.scale.set(width, width, distance-4*width);
						
					}
					
				}
				
				//text picker
				var object = scope.pickerGizmos['TEXT'][0];
				object.position.copy(controlPoints[3]);
				object.scale.set(width, width, width);

				//set text value
				scope.setText('R ' + radius.toFixed(2), controlPoints[3], camera);
				
			case 3:
				//end point
				var pointWidth = scope.getWidth(controlPoints[2], camera);
				var object = scope.handleGizmos['END'][0];
				object.position.copy(controlPoints[2]);
				object.scale.set(pointWidth, pointWidth, pointWidth);
				object.visible = true;
				
			case 2:
				//middle point
				var pointWidth = scope.getWidth(controlPoints[1], camera);
				var object = scope.handleGizmos['MIDDLE'][0];
				object.position.copy(controlPoints[1]);
				object.scale.set(pointWidth, pointWidth, pointWidth);
				object.visible = true;
				
				
			case 1:
				//start point
				var pointWidth = scope.getWidth(controlPoints[0], camera);
				var object = scope.handleGizmos['START'][0];
				object.position.copy(controlPoints[0]);
				object.scale.set(pointWidth, pointWidth, pointWidth);
				object.visible = true;
		}	
	}
	
}

THREE.MeasurementGizmoRadius.prototype = Object.create( THREE.MeasurementGizmo.prototype );