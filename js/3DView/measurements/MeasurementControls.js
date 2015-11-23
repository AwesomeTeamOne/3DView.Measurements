/* 3DView.Measurements
 * 
 * @author awesometeam / awesometeamone@gmail.com
 *
 * License: LGPL v3
 *
 */

 "use strict";

////////////////////////////////////////////////////////////////////////////////
//Control
//MeasurementControls class
////////////////////////////////////////////////////////////////////////////////


THREE.MeasurementControls = function ( viewport, camera, container ) {

	THREE.Object3D.call( this );

	var domElement = container.dom;

	this.measurementGizmos = [];
	this.pickers = [];
	this.enabled = false;
	this.selectedPicker = false;
	this.snap = true;
	this.dragging = false;

	var scope = this;
	

	var changeEvent = { type: "change" };
	var sceneChangedEvent = { type: "sceneChanged" };

	var ray = new THREE.Raycaster();
	var projector = new THREE.Projector();

	domElement.addEventListener( "mousedown", onPointerDown, false );
	domElement.addEventListener( "touchstart", onPointerDown, false );

	domElement.addEventListener( "mousemove", onPointerHover, false );
	domElement.addEventListener( "touchmove", onPointerHover, false );

	domElement.addEventListener( "mousemove", onPointerMove, false );
	domElement.addEventListener( "touchmove", onPointerMove, false );

	domElement.addEventListener( "mouseup", onPointerUp, false );
	domElement.addEventListener( "mouseout", onPointerUp, false );
	domElement.addEventListener( "touchend", onPointerUp, false );
	domElement.addEventListener( "touchcancel", onPointerUp, false );
	domElement.addEventListener( "touchleave", onPointerUp, false );
	window.addEventListener( 'keydown', onKeyDown, false );

	function notifyGizmoSelection(measurementGizmo) {
		if (measurementGizmo)
			scope.dispatchEvent( { type: 'select', measurement: measurementGizmo.measurement} );
		else
			scope.dispatchEvent( { type: 'select' } );
	}
	
	function onGizmoTextSelected(event) {

		if (event.measurementGizmo) {
			notifyGizmoSelection(event.measurementGizmo);
			scope.select(event.measurementGizmo.measurement);
		}
	}
	
	function onGizmoTextMouseDown(event) {

		if (event.measurementGizmo && event.originalEvent) {
			scope.selectedPicker = event.measurementGizmo.getTextPicker();
			if (scope.selectedPicker) {
				camera.updateMatrixWorld();
				var pointer = event.originalEvent.touches? event.originalEvent.touches[0] : event.originalEvent;
				var eye = getEyeVector( pointer ); 
				
				var planeNormal = new THREE.Vector3( 0, 0, 1 );
				if (planeNormal.unproject)
					planeNormal.unproject( camera )
				else
					projector.unprojectVector( planeNormal, camera ); 
				var position = linePlaneIntersection(camera.position, eye, scope.selectedPicker.position, planeNormal);
				
				event.measurementGizmo.dragStart(scope.selectedPicker.name, eye, position);
				scope.dragging = true;
				scope.update();
			}
			notifyGizmoSelection(event.measurementGizmo);
		}

	}
	
	function addGizmo( measurementGizmo ) {

		THREE.Object3D.prototype.add.call(scope, measurementGizmo);
		scope.measurementGizmos.push( measurementGizmo );
		
		measurementGizmo.addEventListener( 'select', onGizmoTextSelected );
		measurementGizmo.addEventListener( 'textMouseDown', onGizmoTextMouseDown );
		
		if (measurementGizmo.acceptPoints())
			domElement.style.cursor = 'crosshair';
		
		for( var i = 0; i< measurementGizmo.pickers.children.length; ++i) {
			var picker = measurementGizmo.pickers.children[i];
			scope.pickers.push(picker);
		}
		
		scope.update();
	 	scope.dispatchEvent( sceneChangedEvent );

	}

	function removeGizmo ( measurementGizmo ) {

		for( var i = 0; i< measurementGizmo.pickers.children.length; ++i) {
			var picker = measurementGizmo.pickers.children[i];
			var index = scope.pickers.indexOf(picker);
			if (index >=0 )
				scope.pickers.splice(index, 1); 	
		}

		measurementGizmo.removeEventListener( 'select', onGizmoTextSelected );
		measurementGizmo.removeEventListener( 'textMouseDown', onGizmoTextMouseDown );

		var index = scope.measurementGizmos.indexOf(measurementGizmo);
		if (index >=0 )
			scope.measurementGizmos.splice(index, 1); 	

		measurementGizmo.clean();
		THREE.Object3D.prototype.remove.call(scope, measurementGizmo);
			
	 	scope.update();

	}

	this.add = function ( measurement ) {
		var gizmo = measurement.createGizmo(container);
		addGizmo(gizmo);
	}
	
	this.remove = function ( measurement ) {
		if (measurement && measurement.measurementGizmo)
			removeGizmo(measurement.measurementGizmo);
		scope.dispatchEvent( { type: "objectRemoved", object: measurement } );
	}

	this.attachGizmo = function ( gizmo ) {
		addGizmo(gizmo);
		gizmo.restore();
	}
	
	this.onAddedObject = function( measurement ) {
		scope.dispatchEvent( { type: "objectAdded", object: measurement } );
	}	
	
	this.update = function () {

		camera.updateMatrixWorld();
		
		for (var i=0; i < this.measurementGizmos.length; ++i) {
			
			this.measurementGizmos[i].highlight( false );
			this.measurementGizmos[i].update( camera );
		
		}
		
		if (scope.selectedPicker)
			scope.selectedPicker.measurementGizmo.highlight( scope.selectedPicker.name );
		
	}
	
	this.select = function ( measurement ) {
		//unselect everything
		for (var i=0; i < this.measurementGizmos.length; ++i) {
			this.measurementGizmos[i].select( false );
		}
		
		//select what is needed
		if (measurement && measurement.measurementGizmo) {
		
			measurement.measurementGizmo.select();
			this.update();
			scope.dispatchEvent( { type: "change", scope: "select", object: measurement } );
		} 
	}
	
	this.load = function ( scene, measure, data ) {
		if (!scene || !measure || !measure.measurementGizmo || !data || !data.points) return;
		var measurementGizmo = measure.measurementGizmo;
		var point, pointName, object = null;
		for (var i=0; i<data.points.length; ++i) {
			point = new THREE.Vector3().copy(data.points[i]);
			pointName = data.points[i].name;
			object = null;
			
			for (var j=0; j<scene.children.length; ++j) {
				var objName = scene.children[j].name;
				var objExt = THREE.FileOperations.extractExtension(objName);		
				var objNameNoExt = (objExt == 'stl' || objExt == 'zip') ? THREE.FileOperations.extractName(objName) : null;
			
				if (pointName == objName || (objNameNoExt && pointName == objNameNoExt)) {
					object = scene.children[j];
					break;
				}
			}
			
			measurementGizmo.addControlPoint(point, object ? object : scene, true, null, scope.onAddedObject);
		}
		
		domElement.style.cursor = 'default';
		if (data.visible !== undefined) measure.visible = data.visible;
		if (data.name !== undefined) measure.name = data.name;
		if (data.comments !== undefined) measure.setComments(data.comments);
		//if (data.textWidth !== undefined) measurementGizmo.text.setStyle("width", [data.textWidth]);
		//if (data.textHeight !== undefined) measurementGizmo.text.setStyle("height", [data.textHeight]);
		
		if (measurementGizmo.acceptPoints()) {
			cancelMeasurement();
		} else {
			scope.update();
			scope.dispatchEvent( sceneChangedEvent );		
		}
	}
	
	this.acceptPoints = function () {
	
		var measurementGizmo = (scope.measurementGizmos.length > 0) ? scope.measurementGizmos[scope.measurementGizmos.length - 1] : null;
		return measurementGizmo && measurementGizmo.acceptPoints();
	
	}	

	function onPointerHover( event ) {

		if (event && event.cancel)  return; //the event is cancelled
		if ( !scope.enabled || scope.dragging ) return;

		event.preventDefault();
		//event.stopPropagation();

		var pointer = event.touches? event.touches[0] : event;

		var intersect = intersectObjects( pointer, scope.pickers, false );

		if ( intersect ) {
	
			if (scope.selectedPicker !== intersect.object) {
				scope.selectedPicker = intersect.object;
				scope.update();
				if (!event.rendered) {
					event.rendered = true; //prevent other listeners from rendering
					scope.dispatchEvent( { type: "change", scope: "hover", object: scope.selectedPicker ? scope.selectedPicker.measurementGizmo.measurement : null } );
				}
			}

		} else {

			if (scope.selectedPicker !== false) {
				scope.selectedPicker = false;
				scope.update();
				if (!event.rendered) {
					event.rendered = true; //prevent other listeners from rendering
					scope.dispatchEvent( { type: "change", scope: "hover" } );
				}
			}

		}

	};

	function snapToFaceCorner( intersect, measurementGizmo ) {
		if (intersect && intersect.face && intersect.object && intersect.object.geometry ) {
				
			var vertexes = [intersect.object.geometry.vertices[intersect.face.a], intersect.object.geometry.vertices[intersect.face.b], intersect.object.geometry.vertices[intersect.face.c]];
			camera.updateMatrixWorld();
			var maxSnapDistance = measurementGizmo.getWidth(intersect.point, camera) * 4;
			
			//getting min distance to the points within maxSnapDistance
			var facePoint, distance,  minDistance, minDistancePoint = null;
			for (var i=0; i<3; ++i) {
				facePoint = new THREE.Vector3().copy(vertexes[i]);
				intersect.object.localToWorld(facePoint);
				
				distance = intersect.point.distanceTo(facePoint);
				if (distance <= maxSnapDistance && (!minDistancePoint || distance < minDistance) ) {
					minDistance = distance;
					minDistancePoint = facePoint;
				}
			}
			if (minDistancePoint) {//update intersect point 
				intersect.point = minDistancePoint;
				return true;
			}
				
			
		}
		return false;
	}
	
	function onPointerDown( event ) {

		if (event && event.cancel)  return; //the event is cancelled
		if ( !scope.enabled ) return;

		event.preventDefault();
		event.stopPropagation();
		
		var pointer = event.touches? event.touches[0] : event;

		if ( pointer.button === 0 || pointer.button == undefined ) {
		
			//check if last measurementGizmo is accepting points
			var measurementGizmo = (scope.measurementGizmos.length > 0) ? scope.measurementGizmos[scope.measurementGizmos.length - 1] : null;
			if (measurementGizmo && measurementGizmo.acceptPoints()) {
				//check for intersection with scene objects
				var intersect = intersectObjects( pointer, viewport.objects, true );
			
				if (intersect) {
				
					if (scope.snap && measurementGizmo.mustSnapToPart()) 
						snapToFaceCorner(intersect, measurementGizmo);
					
					measurementGizmo.addControlPoint(intersect.point, intersect.object, null, intersect.face, scope.onAddedObject);
					if (measurementGizmo.mustDragGizmo()) {
						scope.selectedPicker = measurementGizmo.mustDragGizmo();
						var eye = getEyeVector( pointer ); 
						measurementGizmo.addControlPoint(intersect.point, intersect.object, null, null, scope.onAddedObject);
						measurementGizmo.dragStart(scope.selectedPicker.name, eye, intersect.point);
						domElement.style.cursor = 'default';
						scope.dragging = true;

					} else	if (measurementGizmo.acceptPoints())
						domElement.style.cursor = 'crosshair';


					event.cancel = true; //prevent other listeners from getting this event
					scope.update();
					notifyGizmoSelection(measurementGizmo);
				 	scope.dispatchEvent( sceneChangedEvent );
				}
			} else {
				//check for intersection with gizmos
				var intersect = intersectObjects( pointer, scope.pickers, false );

				if ( intersect ) {
					scope.selectedPicker = intersect.object;
					var measurementGizmo = intersect.object.measurementGizmo;
					if (measurementGizmo) {
						camera.updateMatrixWorld();
						var eye = getEyeVector( pointer ); 
						measurementGizmo.dragStart(intersect.object.name, eye, intersect.point);

						event.cancel = true; //prevent other listeners from getting this event
						scope.dragging = true;
						scope.update();
						notifyGizmoSelection(measurementGizmo);
					}

				
				}
			}

		}

	};

	function onPointerMove( event ) {

		if (event && event.cancel)  return; //the event is cancelled
		if ( !scope.enabled ) return;

		var measurementGizmo = (scope.measurementGizmos.length > 0) ? scope.measurementGizmos[scope.measurementGizmos.length - 1] : null;
		if (measurementGizmo && measurementGizmo.acceptPoints())
			domElement.style.cursor = 'crosshair';
	
		if ( !scope.dragging ) return;

		event.preventDefault();
		event.stopPropagation();

		var pointer = event.touches? event.touches[0] : event;

		if (scope.selectedPicker && scope.selectedPicker.measurementGizmo) {
			var measurementGizmo = scope.selectedPicker.measurementGizmo;
			camera.updateMatrixWorld();
			var eye = getEyeVector( pointer ); 
			var cameraPos = new THREE.Vector3().setFromMatrixPosition( camera.matrixWorld );
			measurementGizmo.dragMove(scope.selectedPicker.name, eye, cameraPos);

			event.cancel = true; //prevent other listeners from getting this event
			scope.dispatchEvent( { type: "change", scope: "dragging", object: scope.selectedPicker.measurementGizmo.measurement } );
			scope.update();
		}
		

	}

	function onPointerUp( event ) {

		if (event && event.cancel)  return; //the event is cancelled
		if (event && event.type == 'mouseout' && event.relatedTarget && event.relatedTarget.parentElement == domElement) return; //the mouse is actually over the child element

		//if (scope.dragging)
		//	event.cancel = true; //prevent other listeners from getting this event

		var measurement = scope.selectedPicker ? scope.selectedPicker.measurementGizmo.measurement : null;
		scope.dragging = false;
		scope.selectedPicker = false;

		if (!event.rendered) {
			event.rendered = true; //prevent other listeners from rendering
		}
		scope.dispatchEvent( { type: "change", scope: "finishDragging", object: measurement } ); 
		scope.update();

	}
	
	function cancelMeasurement() {
	
		var measurementGizmo = (scope.measurementGizmos.length > 0) ? scope.measurementGizmos[scope.measurementGizmos.length - 1] : null;
		if (measurementGizmo && measurementGizmo.acceptPoints()) {
			scope.remove(measurementGizmo.measurement);
			measurementGizmo.removeUIObject();
			notifyGizmoSelection();
			scope.dispatchEvent( sceneChangedEvent );
		}
	
	}
	
	function onKeyDown( event ) {

		if ( scope.enabled === false ) return;

		switch (event.keyCode) {
			case 27: //ESC
				cancelMeasurement();
				break;
		}

	}	
	
	function getEyeVector( pointer ) {
	    var rect = domElement.getBoundingClientRect();
	    var x = (pointer.clientX - rect.left) / rect.width;
	    var y = (pointer.clientY - rect.top) / rect.height;
		var pointerVector = new THREE.Vector3( ( x ) * 2 - 1, - ( y ) * 2 + 1, 0.5 );

		if (pointerVector.unproject)
			pointerVector.unproject( camera )
		else
			projector.unprojectVector( pointerVector, camera );
		return pointerVector.sub( camera.position ).normalize();
	}
	
	function intersectObjects( pointer, objects, recursive ) {

		ray.set( camera.position, getEyeVector( pointer ));
		if (!objects) {
			console.log('err');
		}
		var intersections = ray.intersectObjects( objects, recursive );
		if (intersections.length > 0)
			while (intersections.length > 0 
				&& ((intersections[0].object.measurementGizmo && intersections[0].object.measurementGizmo.isVisible() === false) 
				|| (!intersections[0].object.measurementGizmo && intersections[0].object.visible === false)))
				intersections.shift();
		
		return intersections[0] ? intersections[0] : false;

	}

};

THREE.MeasurementControls.prototype = Object.create( THREE.Object3D.prototype );