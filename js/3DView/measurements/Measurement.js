/* 3DView.Measurements
 * 
 * @author awesometeam / awesometeamone@gmail.com
 *
 * License: LGPL v3
 *
 */
 
////////////////////////////////////////////////////////////////////////////////
//MeasurementGizmoMaterial
////////////////////////////////////////////////////////////////////////////////

THREE.MeasurementGizmoMaterial = function ( parameters ) {

	THREE.MeshBasicMaterial.call( this );

	this.depthTest = false;
	this.depthWrite = false;
	this.side = THREE.DoubleSide;
	this.transparent = true;

	this.setValues( parameters );

}

THREE.MeasurementGizmoMaterial.prototype = Object.create( THREE.MeshBasicMaterial.prototype );

THREE.MeasurementPickerMaterial = new THREE.MeasurementGizmoMaterial({visible: false});


////////////////////////////////////////////////////////////////////////////////
//Measurements
//Measurement interface (base class)
////////////////////////////////////////////////////////////////////////////////

THREE.Measurement = function ( ) {

	THREE.Object3D.call( this );
	this.measurementGizmo = null;
	this.color = new THREE.Color(0xc75050);
	this.comments = "";
	
	this.visible = false;

	this.createGizmo = function(container) {
		return this.measurementGizmo;
	};

	this.getValue = function() {
		return null;
	};

	this.getInfo = function() {
		return [];
	};

	this.getType = function() {
		return 'Measurment';
	};

	this.getDescription = function() {
		return 'Generic Measurement';
	}

	this.getComments = function() {
		return this.comments;
	};

	this.setComments = function(text) {
		this.comments = text;
	};

}

THREE.Measurement.prototype = Object.create( THREE.Object3D.prototype );

THREE.Measurement.prototype.export = function() {
	
	var controlPoints = [];
	for (var i=0; i<this.measurementGizmo.controlPoints.length; ++i) {
		controlPoints[i] = new THREE.Vector3().copy(this.measurementGizmo.controlPoints[i].point);
		var object = this.measurementGizmo.controlPoints[i].object;
		if (object) {
			object.localToWorld(controlPoints[i]);

			//find last mesh in parens
			var parent = object;
			for (var it = object; it!= null; it = it.parent) {
				if (it instanceof THREE.Mesh)
					parent = it;
			}
			controlPoints[i].name = parent.referenceName;
		}
	}
		
	return {type: this.getType(),
		name: this.name,
		points: controlPoints,
		visible: this.visible,
		comments: this.comments
	};
}

THREE.Measurement.prototype.translatePointsForObject = function ( object, offset ) {
	for (var i=0; i<this.measurementGizmo.controlPoints.length; ++i) {
		var point = this.measurementGizmo.controlPoints[i].point;
		if (point && this.measurementGizmo.controlPoints[i].object == object) {
			point.add(offset); 
		}
	}
}


////////////////////////////////////////////////////////////////////////////////
//Gizmos
//MeasurementGizmo base class
////////////////////////////////////////////////////////////////////////////////


THREE.MeasurementGizmo = function ( measurement, container ) {

	THREE.Object3D.call( this );

	this.handleGizmos = {
	}

	var showPickers = true; //debug

	this.dragNormal = new THREE.Vector3();
	this.dragOrigin = new THREE.Vector3();
	this.lastPosition = new THREE.Vector3();
	this.dragGizmo = '';
	this.container = container;
	this.measurement = measurement;
	this.selected = false;
	var scope = this;

	this.controlPoints = [];
	
	var projector = new THREE.Projector();
	
	this.transformGizmo = function(mesh, translate, rotate) {
		if ( translate ) mesh.geometry.applyMatrix( new THREE.Matrix4().makeTranslation( translate.x, translate.y, translate.z ) );
		if ( rotate ) {
			var m = new THREE.Matrix4();

			var m1 = new THREE.Matrix4();
			var m2 = new THREE.Matrix4();
			var m3 = new THREE.Matrix4();

			m1.makeRotationX( rotate.x );
			m2.makeRotationY( rotate.y );
			m3.makeRotationZ( rotate.z );

			m.multiplyMatrices( m1, m2 );
			m.multiply( m3 );
			mesh.geometry.applyMatrix( m );
		}
	}

	this.init = function () {

		this.handles = new THREE.Object3D();
		this.pickers = new THREE.Object3D();

		this.add(this.handles);
		this.add(this.pickers);
		
		//// Text field
		
		if (this.container) {
			if (this.initText)
				this.initText();
			else {
				this.text = new UI.Text();
				this.text.setDisplay( 'none' );
				this.text.setPosition( 'absolute' );
				this.text.setColor('#000000');
				this.text.setPadding('3px');
				this.text.setPaddingRight('8px');
				this.text.setPaddingLeft('8px');
				this.text.setBackgroundColor('#FFFFFF');
				this.text.setBorder('1px solid #FF0000');
				this.text.setOpacity('0.9');
				this.text.setStyle('font', ["normal normal normal 13px/normal 'Helvetica Neue', arial, sans-serif"]);
				this.text.setStyle('overflow', ['hidden']);
				this.container.add( this.text );
			}
			
			this.text.dom.addEventListener( 'mousedown', function(event) {
				event.cancel = true; //prevent other listeners from getting this event
			 	scope.dispatchEvent( { type: 'textMouseDown', measurementGizmo: scope, originalEvent: event} );
			});
			
			this.text.onMouseOver(function() {
				if (scope.selected !== false) {
					scope.text.setBackgroundColor('#FFFF88');
					scope.text.setBorder('2px solid #FF0000');
					scope.text.setOpacity('1');
				} else {
					scope.text.setBackgroundColor('#EEEEEE');
					scope.text.setBorder('1px solid #FF0000');		
					scope.text.setOpacity('1');
				}

			});
			this.text.onMouseOut(function() {
				if (scope.selected !== false) {
					scope.text.setBackgroundColor('#FFFF88');
					scope.text.setBorder('2px solid #FF0000');
					scope.text.setOpacity('1');
				} else {
					scope.text.setBackgroundColor('#FFFFFF');
					scope.text.setBorder('1px solid #FF0000');		
					scope.text.setOpacity('0.92');
				}
			});

		}

		//// HANDLES AND PICKERS

		for ( var i in this.handleGizmos ) {

			var handle = this.handleGizmos[i][0];
			handle.name = i;
			this.transformGizmo(handle, this.handleGizmos[i][1], this.handleGizmos[i][2]);
		
			handle.visible = false;
			this.handles.add( handle );

		}
		
		for ( var i in this.pickerGizmos ) {

			var picker = this.pickerGizmos[i][0];
			picker.name = i;
			this.transformGizmo(picker, this.pickerGizmos[i][1], this.pickerGizmos[i][2]);

			picker.visible = showPickers;
			picker.measurementGizmo = this;
			this.pickers.add( picker );

		}

	}

	this.hide = function () {

		for ( var j in this.handles.children ) this.handles.children[j].visible = false;
		for ( var j in this.pickers.children ) this.pickers.children[j].visible = false;
		if (this.text) this.text.setDisplay( 'none' );
		this.measurement.visible = false;

	}

	this.show = function () {

		for ( var j in this.handles.children ) this.handles.children[j].visible = false;
		for ( var j in this.pickers.children ) this.pickers.children[j].visible = showPickers;
		if (this.text) this.text.setDisplay( 'block' );
		this.measurement.visible = true;

	}

	this.isVisible = function () {

		return this.measurement.visible;

	}
	
	this.getMainPicker = function () {
		for ( var i in this.pickerGizmos )
			return this.pickerGizmos[i][0];
		
	}

	this.getTextPicker = function () {
		if (this.pickerGizmos['TEXT'])
			return this.pickerGizmos['TEXT'][0];
		else
			return null;
	}

	this.highlight = function ( control ) {

		var handle;

		for ( var i in this.handleGizmos ) {

			handle = this.handleGizmos[ i ][0];

			if ( handle.material.oldColor ) {

				handle.material.color.copy( handle.material.oldColor );
				handle.material.opacity = handle.material.oldOpacity;

			}

		}

		if ( control && this.handleGizmos[ control ] ) {
		
			handle = this.handleGizmos[ control ][0];

			handle.material.oldColor = handle.material.color.clone();
			handle.material.oldOpacity = handle.material.opacity;
	 
			handle.material.color.setRGB( 1, 1, 0 );
			handle.material.opacity = 1;

		}

	}
	
	this.dragStart = function(gizmo, eye, origin) {
		this.dragNormal.copy(eye);
		this.dragGizmo = gizmo;
		this.dragOrigin = origin;
		this.lastPosition = new THREE.Vector3().copy(origin);
	}
	
	this.onGizmoMoved = function(gizmo, offset) {
		if (this.pickerGizmos && this.pickerGizmos[gizmo])
			this.pickerGizmos[gizmo][0].position.add(offset);

		if (this.handleGizmos && this.handleGizmos[gizmo])
			this.handleGizmos[gizmo][0].position.add(offset);
	}

	this.dragMove = function(gizmo, eye, cameraPosition) {
		if (gizmo !== this.dragGizmo) {
			return;
		}
		
		var intersection = linePlaneIntersection(cameraPosition, eye, this.dragOrigin, this.dragNormal);
		if (intersection) {
			this.onGizmoMoved(gizmo, this.lastPosition.sub(intersection).negate());
			this.lastPosition = new THREE.Vector3().copy(intersection);
		}
	}

	this.mustDragGizmo = function() {
		return false;
	}
	
	this.mustSnapToPart = function() {
		return true;
	}

	this.acceptPoints = function() {
		return false;
	}
	
	this.getCenterPointWorld = function() {
		var center = new THREE.Vector3();
		var controlPoints = this.getControlPointsWorld();
		for (var i=0; i < controlPoints.length; ++i) {
			center.add(controlPoints[i]);
		}
		if (controlPoints.length > 0)
			center.divideScalar(controlPoints.length);
		
		return center;
	}
	
	this.getWidth = function(point, camera) {
		var camPosition = new THREE.Vector3().setFromMatrixPosition( camera.matrixWorld );
		return point.distanceTo( camPosition ) / 300;
	}

	this.getScreenCoords = function( position, camera ) {
	    var rect = this.container.dom.getBoundingClientRect();
		var widthHalf = rect.width / 2, heightHalf = rect.height / 2;

		var vector = new THREE.Vector3().copy(position);

		if (vector.project)
			vector.project(camera);
		else
			projector.projectVector( vector, camera );

		return new THREE.Vector2(( vector.x * widthHalf ) + widthHalf, - ( vector.y * heightHalf ) + heightHalf);
	}
	
	this.getControlPointsWorld = function() {
		//get points in world coordinates
		var controlPoints = [];
		for (var i=0; i<this.controlPoints.length; ++i) {
			controlPoints[i] = new THREE.Vector3().copy(this.controlPoints[i].point);
			if (this.controlPoints[i].object)
				this.controlPoints[i].object.localToWorld(controlPoints[i]);
		}
		return controlPoints;
	}
	
	this.offsetControlPoint = function(i, offset) {
		//get points in world coordinates
		if (i >= this.controlPoints.length || !this.controlPoints[i].point) return;
		
		if (this.controlPoints[i].object) {
			var localOffset = new THREE.Vector3().copy(offset);
			var point = new THREE.Vector3().copy(this.controlPoints[i].point);
			this.controlPoints[i].object.localToWorld(point);
			point.add(offset);
			this.controlPoints[i].object.worldToLocal(point);
			
			this.controlPoints[i].point.copy(point);
		} else this.controlPoints[i].point.add(offset);


	}

	this.setText = function(text, position, camera) {
		if (this.text) {
			this.text.setDisplay( 'block' );		
			var coords = this.getScreenCoords(position, camera);
			var rect = this.text.dom.getBoundingClientRect();
			coords.x += this.container.dom.offsetLeft - rect.width/2;
			coords.y += this.container.dom.offsetTop - rect.height/2;
			
			if (text) this.text.setValue( text );
			this.text.setLeft(coords.x.toString() +'px'); 
			this.text.setTop(coords.y.toString() +'px'); 
		}
	}
	
	this.getValue = function() {
		return null;
	};
	
	
	this.clean = function() {
		if (this.container && this.text) {
			this.text.setDisplay( 'none' );
			this.container.remove(this.text);
		}
	}

	this.restore = function() {
		if (this.container && this.text) {
			this.text.setDisplay( 'block' );
			this.container.add(this.text);
		}
	}
	
	this.removeUIObject = function() {
		if (this.measurement && this.measurement.parent)
			this.measurement.parent.remove( this.measurement );
	}
	

}

THREE.MeasurementGizmo.prototype = Object.create( THREE.Object3D.prototype );

THREE.MeasurementGizmo.prototype.update = function ( camera ) {

}

THREE.MeasurementGizmo.prototype.addControlPoint = function ( point, object, forceAdd, face, callbackAddedObject ) {
		var point = new THREE.Vector3().copy(point);
		if (object) {
			object.worldToLocal(point);
		}
		this.controlPoints.push({point: point, object: object});
	}
	
THREE.MeasurementGizmo.prototype.select = function (selected) {
		
	this.selected = selected;
	if (this.text) {
		if (selected !== false) {
			this.text.setBackgroundColor('#FFFF88');
			this.text.setBorder('2px solid #FF0000');
			this.text.setOpacity('1');
			this.text.setStyle('z-index', ['2']);
			this.highlight("TOPLINE");
		} else {
			this.text.setBackgroundColor('#FFFFFF');
			this.text.setBorder('1px solid #FF0000');		
			this.text.setOpacity('0.92');
			this.text.setStyle('z-index', ['1']);
		}
	}
}
