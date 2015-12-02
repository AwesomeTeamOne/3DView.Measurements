/* 3DView.Measurements
 * 
 * @author awesometeam / awesometeamone@gmail.com
 *
 * License: LGPL v3
 *
 */

////////////////////////////////////////////////////////////////////////////////
//MeasurementDistance class
////////////////////////////////////////////////////////////////////////////////

THREE.MeasurementDistance = function ( ) {

	THREE.Measurement.call( this );
	
	this.createGizmo = function(container) {
		this.measurementGizmo = new THREE.MeasurementGizmoDistance( this, container );
		return this.measurementGizmo;
	};

	this.getValue = function() {
		return this.measurementGizmo.getValue();
	};

	this.getInfo = function() {
		//get control points in world coordinates
		var controlPoints = this.measurementGizmo.getControlPointsWorld();
		
		var info = [];
		for (var i=0; i<Math.min(2, controlPoints.length); ++i) {
			info.push({name: 'Point '+ (i+1).toString()
			, values:[controlPoints[i].x, controlPoints[i].y, controlPoints[i].z]});
		}
		return info;
	};

	this.getType = function() {
		return 'Distance';
	};
	
	this.getDescription = function() {
		var value = this.getValue();
		if (value == null) return "distance";
		
		return 'distance = ' + this.getValue().toFixed(2);
	}

}

THREE.MeasurementDistance.prototype = Object.create( THREE.Measurement.prototype );


////////////////////////////////////////////////////////////////////////////////////////////////
//class MeasurementGizmoDistance
////////////////////////////////////////////////////////////////////////////////////////////////
	
THREE.MeasurementGizmoDistance = function ( measurement, container ) {

	THREE.MeasurementGizmo.call( this, measurement, container );
	
	var scope = this;

	this.handleGizmos = {

		'TOPLINE': [
			new THREE.Mesh( new THREE.CylinderGeometry( 1, 1, 1, 4, 1, false ), new THREE.MeasurementGizmoMaterial( { color: 0xff0000, opacity: 0.4 } ) ),
			new THREE.Vector3( 0, 0.5, 0 ),
			new THREE.Vector3( Math.PI/2, 0, 0 )
		],
		'STARTLINE': [
			new THREE.Mesh( new THREE.CylinderGeometry( 0.5, 0.5, 1, 4, 1, false ), new THREE.MeasurementGizmoMaterial( { color: 0x000000, opacity: 0.1 } ) ),
			new THREE.Vector3( 0, 0.5, 0 ),
			new THREE.Vector3( Math.PI/2, 0, 0 )
		],
		'ENDLINE': [
			new THREE.Mesh( new THREE.CylinderGeometry( 0.5, 0.5, 1, 4, 1, false ), new THREE.MeasurementGizmoMaterial( { color: 0x000000, opacity: 0.1 } ) ),
			new THREE.Vector3( 0, 0.5, 0 ),
			new THREE.Vector3( Math.PI/2, 0, 0 )
		],
		'START': [
			new THREE.Mesh( new THREE.SphereGeometry( 2 ), new THREE.MeasurementGizmoMaterial( { color: 0xff0000, opacity: 0.4 } ) )
		],
		'END': [
			new THREE.Mesh( new THREE.SphereGeometry( 2 ), new THREE.MeasurementGizmoMaterial( { color: 0xff0000, opacity: 0.4 } ) )
		],
		'STARTARROW': [
			new THREE.Mesh( new THREE.CylinderGeometry( 3, 0, 6, 8, 1, false ), new THREE.MeasurementGizmoMaterial( { color: 0xff0000, opacity: 0.4 } ) ),
			new THREE.Vector3( 0, 1, 0 ),
			new THREE.Vector3( Math.PI/2, 0, 0 )
		],
		'ENDARROW': [
			new THREE.Mesh( new THREE.CylinderGeometry( 3, 0, 6, 8, 1, false ), new THREE.MeasurementGizmoMaterial( { color: 0xff0000, opacity: 0.4 } ) ),
			new THREE.Vector3( 0, 1, 0 ),
			new THREE.Vector3( Math.PI/2, 0, 0 )
		]
	}

	this.pickerGizmos = {

		'TOPLINE': [
			new THREE.Mesh( new THREE.CylinderGeometry( 3, 3, 1, 4, 1, false ), THREE.MeasurementPickerMaterial ),
			new THREE.Vector3( 0, 0.5, 0 ),
			new THREE.Vector3( Math.PI/2, 0, 0 )
		],
		'STARTARROW': [
			new THREE.Mesh( new THREE.SphereGeometry( 4 ), THREE.MeasurementPickerMaterial )
		],
		'ENDARROW': [
			new THREE.Mesh( new THREE.SphereGeometry( 4 ), THREE.MeasurementPickerMaterial )
		],
		'TEXT': [
			new THREE.Mesh( new THREE.SphereGeometry( 4 ), THREE.MeasurementPickerMaterial )
		]

	}


	THREE.MeasurementGizmoDistance.prototype.addControlPoint = function(point, object, forceAdd, face, callbackAddedObject) {
		
		var object = (scope.controlPoints.length < 2) ? object : scope.controlPoints[1].object; //for 3rd point use object of the 2nd point
		THREE.MeasurementGizmo.prototype.addControlPoint.call(this, point, object, forceAdd, face, callbackAddedObject);
		
		if (scope.controlPoints.length == 1) {
			//1st point - add measurement to object
			if (object) {
				object.add(this.measurement);
				if (callbackAddedObject) callbackAddedObject(this.measurement);
			}
			
		} else if (scope.controlPoints.length == 3) {
				
			//get control points in world coordinates
			var controlPoints = scope.getControlPointsWorld();
		
			//add 4th point automatically
			if (forceAdd !== true) {
				var point = new THREE.Vector3().copy(controlPoints[0]).add(controlPoints[2]).sub(controlPoints[1])
				THREE.MeasurementGizmo.prototype.addControlPoint.call(this, point, scope.controlPoints[0].object, false, face, callbackAddedObject); //for 4th point use object of the 1st point
			}
		}
		
		this.show();
	}
	
	this.acceptPoints = function() {
		return this.controlPoints.length < 3;
	}
	
	this.mustDragGizmo = function() {
		if (this.controlPoints.length == 2)
			return this.pickerGizmos["TOPLINE"][0];
		return false;
	}
	
	this.mustSnapToPart = function() {
		return this.controlPoints.length < 2;
	}
	
	this.update = function ( camera ) {
	
		//update gizmos
		if (this.isVisible()) {
			this.show();
			this.updateGizmosFromControlPoints( camera );
		} else {
			this.hide();
		}
	}		

	this.onGizmoMoved = function(gizmo, offset) {
		switch (gizmo) {
			case "TOPLINE":
			case "TEXT":
				if (this.controlPoints.length == 4) {
					this.offsetControlPoint(2, offset);
					this.offsetControlPoint(3, offset);
				} else if (this.controlPoints.length == 2) {
					this.offsetControlPoint(0, offset);
					this.offsetControlPoint(1, offset);
				}
				break;
			case "STARTARROW":
				if (this.controlPoints.length == 4)
					this.offsetControlPoint(3, offset);
				break;
			case "ENDARROW":
				if (this.controlPoints.length == 4)
					this.offsetControlPoint(2, offset);
				break;
		}
	}

	this.getValue = function() {
		if (this.controlPoints.length < 2) return null;

		//get points in local coordinates
		var controlPoints = scope.getControlPointsWorld();
		
		return controlPoints[1].distanceTo(controlPoints[0]);
	};

	this.init();

	THREE.MeasurementGizmoDistance.prototype.updateGizmosFromControlPoints = function(camera) {
		var scope = this;
		//getting width
		var width = scope.getWidth(scope.getCenterPointWorld(), camera);
	
		var distance;
		
		var horisontal, horisontalCorrection, arrowCorrection, verticalCorrection, topPoints;
		//get control points in world coordinates
		var controlPoints = scope.getControlPointsWorld();
		
		//get top points
		if (scope.controlPoints.length == 4) 
			topPoints = [controlPoints[3], controlPoints[2]];
		else if (scope.controlPoints.length == 2) 
			topPoints = [controlPoints[0], controlPoints[1]];
		
		
		switch (scope.controlPoints.length) {
			case 4:
					
				//lines
				distance = controlPoints[0].distanceTo(controlPoints[3]);
				if (distance > 2*width) {
					var object = scope.handleGizmos['STARTLINE'][0];
					verticalCorrection = new THREE.Vector3().copy(controlPoints[3]).sub(controlPoints[0]).setLength(width * 2.0);
					
					object.position.copy(controlPoints[0]).add(verticalCorrection);
					object.lookAt(topPoints[0]);
					object.scale.set(width, width, distance-2*width);
					object.visible = true;
				} else scope.handleGizmos['STARTLINE'][0].visible = false;
				
				distance = controlPoints[1].distanceTo(controlPoints[2]);
				if (distance > 2*width) {
					var object = scope.handleGizmos['ENDLINE'][0];
					verticalCorrection = new THREE.Vector3().copy(controlPoints[2]).sub(controlPoints[1]).setLength(width * 2.0);
					
					object.position.copy(controlPoints[1]).add(verticalCorrection);
					object.lookAt(topPoints[1]);
					object.scale.set(width, width, distance-2*width);
					object.visible = true;
				} else scope.handleGizmos['ENDLINE'][0].visible = false;
				
			case 2:

				//end point
				var pointWidth = scope.getWidth(controlPoints[1], camera);
				var object = scope.handleGizmos['END'][0];
				object.position.copy(controlPoints[1]);
				object.scale.set(pointWidth, pointWidth, pointWidth);
				object.visible = true;
				
				//start-end pickers
				var object = scope.pickerGizmos['STARTARROW'][0];
				object.position.copy(topPoints[0]);
				object.scale.set(width, width, width);

				var object = scope.pickerGizmos['ENDARROW'][0];
				object.position.copy(topPoints[1]);
				object.scale.set(width, width, width);
				
				horisontal = new THREE.Vector3().copy(topPoints[1]).sub(topPoints[0]);
				horisontalCorrection = new THREE.Vector3().copy(horisontal).setLength(width * 6.0);
				arrowCorrection = new THREE.Vector3().copy(horisontal).setLength(width * 2.0);
				
				if (horisontal.length()-12*width > 0) {
					//top line
					var object = scope.handleGizmos['TOPLINE'][0];
					object.position.copy(topPoints[0]).add(horisontalCorrection);
					object.lookAt(topPoints[1]);
					object.scale.set(width, width, horisontal.length()-12*width);
					object.visible = true;

					//arrows
					var object = scope.handleGizmos['STARTARROW'][0];
					object.position.copy(topPoints[0]).add(arrowCorrection);
					object.lookAt(topPoints[1]);
					object.scale.set(width, width, width);
					object.visible = true;

					var object = scope.handleGizmos['ENDARROW'][0];
					object.position.copy(topPoints[1]).sub(arrowCorrection);
					object.lookAt(topPoints[0]);
					object.scale.set(width, width, width);
					object.visible = true;
					
					//top line picker
					var object = scope.pickerGizmos['TOPLINE'][0];
					object.position.copy(topPoints[0]).add(horisontalCorrection);
					object.lookAt(topPoints[1]);
					object.scale.set(width, width, horisontal.length()-12*width);
					

				} else {
					scope.handleGizmos['TOPLINE'][0].visible = false;
					scope.handleGizmos['STARTARROW'][0].visible = false;
					scope.handleGizmos['ENDARROW'][0].visible = false;
				}

				//text picker
				var midPoint = new THREE.Vector3().copy(topPoints[0]).add(topPoints[1]).divideScalar(2);
				var object = scope.pickerGizmos['TEXT'][0];
				object.position.copy(midPoint);
				object.scale.set(width, width, width);

				//set text value
				var distance = scope.getValue();
				scope.setText(distance.toFixed(2), midPoint, camera);
				
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

THREE.MeasurementGizmoDistance.prototype = Object.create( THREE.MeasurementGizmo.prototype );