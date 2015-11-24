# 3DView.Measurements
JavaScript 3D models viewing control with interactive measurements

Description: 3D models viewing control with interactive measurements based on [Three.js] (http://threejs.org/).
Supports distance, thickness, angle and radius measurements. Accepts STL and other formats using standard [Three.js loaders] (https://github.com/mrdoob/three.js/tree/master/examples/js/loaders).
It is part of [3DView Chrome app] (https://chrome.google.com/webstore/detail/3dview/hhngciknjebkeffhafnaodkfidcdlcao) development.

Author: awesometeam / awesometeamone@gmail.com 

License: LGPL v3

[Usage example] (https://goo.gl/UG7T1l)


### Usage ###

Link all necessary JS files from Three.js r73 (included)  

		<script src="js/Three.js.r73/examples/libs/Detector.js"></script>

		<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r73/three.min.js"></script>
		<script src="js/Three.js.r73/examples/renderers/CanvasRenderer.js"></script>
		<script src="js/Three.js.r73/examples/renderers/Projector.js"></script>
		<script src="js/Three.js.r73/examples/libs/ui.js"></script>
		<script src="js/Three.js.r73/examples/controls/OrbitControls.js"></script>
		<script src="js/Three.js.r73/examples/controls/TrackballControls.js"></script>
		<script src="js/Three.js.r73/examples/loaders/STLLoader.js"></script>

Link all necessary JS files from 3DView :

		<script src="js/3DView/measurements/MeasurementControls.js"></script>
		<script src="js/3DView/measurements/Measurement.js"></script>
		<script src="js/3DView/measurements/Measurement.Distance.js"></script>
		<script src="js/3DView/measurements/Measurement.Thickness.js"></script>
		<script src="js/3DView/measurements/Measurement.Angle.js"></script>
		<script src="js/3DView/measurements/Measurement.Radius.js"></script>
		<script src="js/3DView/3DView.Measurements.js"></script>

		
This code creates creates a renderer; loads the STL file; request the user to add a measurement and listens to measurement events.

```html
<script>

	//set renderer
	var renderer = new THREE.WebGLRenderer(); //for webgl rendering
	//renderer = new THREE.CanvasRenderer(); //for canvas rendering
	renderer.setClearColor( new THREE.Color('#fff') ); //set background color
	
	//set view
	//controlsType can be "trackball" or "orbit"
	var view = new View3D(document.getElementById( 'container' ), renderer, {controlsType : "trackball"});
	
	//load STL file from URL
	new THREE.STLLoader().load( './models/3DView.stl', function ( geometry ) {
		
		view.addGeometry( geometry );
 
	} );
	
	//.....
	
	//request user to make new measurement
	view.addMeasurement(new THREE.MeasurementDistance());
	//view.addMeasurement(new THREE.MeasurementThickness());
	//view.addMeasurement(new THREE.MeasurementAngle());
	//view.addMeasurement(new THREE.MeasurementRadius());

	//.....
	
	//events
	
	//on measurement added
	view.addEventListener( 'measurementAdded', function (event) {

		//measurement is added (but configured yet) after user picks 1st point on the 3D model
		
		var measurement = event.object;
		//....
			
		
	} );

	//on measurement changed
	view.addEventListener( 'measurementChanged', function (event) {

		//measurement has changed
		
		var measurement = event.object;
		if (measurement) {
			// measurement.getType(); 
			// measurement.getValue();
			// measurement.getInfo();
		}
		//....
		
	} );

	//on measurement removed
	view.addEventListener( 'measurementRemoved', function (event) {

		//measurement is removed
	
		var measurement = event.object;
		//....
		
	} );

</script>
```
