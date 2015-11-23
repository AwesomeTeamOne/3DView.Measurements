# 3DView.Measurements
JavaScript 3D models viewing control with interactive measurements

Description: 3D models viewing control with interactive measurements
Author: awesometeam / awesometeamone@gmail.com
License: LGPL v3

[Examples] https://goo.gl/UG7T1l


### Usage ###

Link all necessary JS files from THREE.JS (r73):

		<script src="js/Three.js.r73/examples/libs/Detector.js"></script>

		<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r73/three.min.js"></script>
		<script src="js/Three.js.r73/examples/renderers/projector.js"></script>
		<script src="js/Three.js.r73/examples/libs/ui.js"></script>
		<script src="js/Three.js.r73/examples/controls/OrbitControls.js"></script>
		<script src="js/Three.js.r73/examples/loaders/STLLoader.js"></script>

Link all necessary JS files from 3DVIew :

		<script src="js/3DView/measurements/MeasurementControls.js"></script>
		<script src="js/3DView/measurements/Measurement.js"></script>
		<script src="js/3DView/measurements/Measurement.Distance.js"></script>
		<script src="js/3DView/measurements/Measurement.Thickness.js"></script>
		<script src="js/3DView/measurements/Measurement.Angle.js"></script>
		<script src="js/3DView/measurements/Measurement.Radius.js"></script>
		<script src="js/3DView/3DView.Measurements.js"></script>

		
This code creates creates a renderer, loads the STL file and adds a measurement

```html
<script>

	//set renderer
	var renderer = new THREE.WebGLRenderer();
	renderer.setClearColor( new THREE.Color('#fff') ); //set background color
	
	//set view
	var view = new View3D(document.getElementById( 'container' ), renderer);
	
	//load STL file from URL
	new THREE.STLLoader().load( './models/3DView.stl', function ( geometry ) {
		
		view.addGeometry( geometry );
 
	} );
	
	//add measurement
	view.addMeasurement(new THREE.MeasurementDistance())	
	//view.addMeasurement(new THREE.MeasurementThickness());
	//view.addMeasurement(new THREE.MeasurementAngle());
	//view.addMeasurement(new THREE.MeasurementRadius());

	//events
	
	//on measurement added
	view.addEventListener( 'measurementAdded', function (event) {

		var measurement = event.object;
		//....
			
		
	} );

	//on measurement changed
	view.addEventListener( 'measurementChanged', function (event) {

		var measurement = event.object;
		//....
		
	} );

	//on measurement removed
	view.addEventListener( 'measurementRemoved', function (event) {

		var measurement = event.object;
		//....
		
	} );

</script>
```
