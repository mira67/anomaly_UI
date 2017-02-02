/*
main data product:
https://wiki.earthdata.nasa.gov/display/GIBS/GIBS+Available+Imagery+Products
https://nsidc.org/data/docs/daac/nsidc0001_ssmi_tbs.gd.html
*/
gridSize = 25000; // 25 kilometers for some satellites, 12.5 km for others
epsgCode = 'EPSG:3413';

colorScale = d3.scale.threshold()
    .domain([20, 50, 100, 200, 300, 400, 500]) // max = 617
    .range(['#FFEDA0', '#FED976', '#FEB24C', '#FD8D3C', '#FC4E2A', '#E31A1C', '#BD0026', '#800026']);

// good reference for set_extent: http://openlayers.org/en/latest/examples/reprojection.html
// definitions for 3031 projection
proj4.defs("EPSG:3413", "+proj=stere +lat_0=90 +lat_ts=70 +lon_0=-45 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs");
ol.proj.get("EPSG:3413").setExtent([-4194304, -4194304, 4194304, 4194304]);


// for outputting the mouse position
var mousePositionControl = new ol.control.MousePosition({
	//coordinateFormat: ol.coordinate.createStringXY(2),
	projection: 'EPSG:4326',
	coordinateFormat: function(coordinate){
		return "EPSG:3413 " + ol.coordinate.format(coordinate, '{y}, {x}', 3);
	},
	className: 'custom-mouse-position', // comment the following two lines to have the mouse position
	target: document.getElementById('mouse-position'), // be placed within the map.
	undefinedHTML: 'EPSG: 3413' //&nbsp;'
});

// create the map
map = new ol.Map({
	controls: ol.control.defaults().extend([
			mousePositionControl,
			new ol.control.ScaleLine()
		]),
	view: new ol.View({
		maxResolution: 8192.0,
		projection: ol.proj.get("EPSG:3413"),
		extent: [-4194304, -4194304, 4194304, 4194304],
		center: [-1069056, 695296], // map.getView().getCenter()
		zoom: 2, // map.getView().getZoom()
		maxZoom: 6
	}),
	target: "map",
	renderer: ["canvas","dom"]
});

// vars for computing pixelation size for data overlay
projection = ol.proj.get(epsgCode);
projectionExtent = projection.getExtent();
size = 1.1; //ol.extent.getWidth(projectionExtent) / 512; // 512 is # of tiles

//https://earthdata.nasa.gov/labs/gibs/examples/openlayers/antarctic-epsg3031.html
// this service seems to be a higher resolution ...maybe import it when you can geotag the results that the user queries	

// create layer for binary layers of water, land, and permanent glacier
sourceLandWater = new ol.source.WMTS({
	url: "//map1{a-c}.vis.earthdata.nasa.gov/wmts-arctic/wmts.cgi",
	layer: "OSM_Land_Mask", // jpeg 500m
	extent: [-4194304, -4194304, 4194304, 4194304],
	format: "image/png",
	matrixSet: "EPSG3413_250m",
	tileGrid: new ol.tilegrid.WMTS({
		origin: [-4194304, 4194304],
		resolutions: [
			8192.0,
			4096.0,
			2048.0,
			1024.0,
			512.0,
			256.0
		],
		matrixIds: [0, 1, 2, 3, 4, 5],
		tileSize: 512
	})
});
layerLandWater = new ol.layer.Tile({source: sourceLandWater});
map.addLayer(layerLandWater);

// https://wiki.earthdata.nasa.gov/display/GIBS/GIBS+Available+Imagery+Products#expand-EarthatNight1Product
// coastline: SCAR antarctic digital database
sourceBaseMap = new ol.source.WMTS({
	opacity: 0.1,
	url: "//map1{a-c}.vis.earthdata.nasa.gov/wmts-arctic/wmts.cgi",
	//layer: "MODIS_Terra_CorrectedReflectance_TrueColor", // png 250m
	//layer: "BlueMarble_ShadedRelief_Bathymetry", // jpeg 500m
	layer: "BlueMarble_ShadedRelief", // jpeg 500m
	extent: [-4194304, -4194304, 4194304, 4194304],
	format: "image/jpeg",
	matrixSet: "EPSG3413_500m",
	tileGrid: new ol.tilegrid.WMTS({
		origin: [-4194304, 4194304],
		resolutions: [
			8192.0,
			4096.0,
			2048.0,
			1024.0,
			512.0,
			256.0
		],
		matrixIds: [0, 1, 2, 3, 4, 5],
		tileSize: 512
	})
});
layerBaseMap = new ol.layer.Tile({source: sourceBaseMap});
map.addLayer(layerBaseMap);

// add layer with outlines of coasts and permanent glacier boundaries
sourceCoastlines = new ol.source.WMTS({
	url: "//map1{a-c}.vis.earthdata.nasa.gov/wmts-arctic/wmts.cgi",
	layer: "Coastlines", // jpeg 500m
	extent: [-4194304, -4194304, 4194304, 4194304],
	format: "image/png",
	matrixSet: "EPSG3413_250m",
	tileGrid: new ol.tilegrid.WMTS({
		origin: [-4194304, 4194304],
		resolutions: [
			8192.0,
			4096.0,
			2048.0,
			1024.0,
			512.0,
			256.0
		],
		matrixIds: [0, 1, 2, 3, 4, 5],
		tileSize: 512
	})
});
layerCoastlines = new ol.layer.Tile({source: sourceCoastlines});
map.addLayer(layerCoastlines);

// add layer with latitude and longitude lines
sourceGraticule = new ol.source.WMTS({
	url: "//map1{a-c}.vis.earthdata.nasa.gov/wmts-arctic/wmts.cgi",
	layer: "Graticule", // jpeg 500m
	extent: [-4194304, -4194304, 4194304, 4194304],
	format: "image/png",
	matrixSet: "EPSG3413_250m",
	tileGrid: new ol.tilegrid.WMTS({
		origin: [-4194304, 4194304],
		resolutions: [
			8192.0,
			4096.0,
			2048.0,
			1024.0,
			512.0,
			256.0
		],
		matrixIds: [0, 1, 2, 3, 4, 5],
		tileSize: 512
	})
});
layerGraticule = new ol.layer.Tile({source: sourceGraticule});
map.addLayer(layerGraticule);

// for drawing the selection box
source = new ol.source.Vector();
vector = new ol.layer.Vector({
	source: source,
	style: new ol.style.Style({
		fill: new ol.style.Fill({
			color: 'rgba(255, 255, 255, 0.5)'
		}),
		stroke: new ol.style.Stroke({
			color: '#00BFFF',
			width: 2
		}),
		image: new ol.style.Circle({
			radius: 7,
			fill: new ol.style.Fill({
				color: '#00BFFF'
			})
		})
	})
});
map.addLayer(vector);

///////////////////////////////
// storage for the "pixels" to be drawn on map
points = {
	type: 'FeatureCollection',
	features: []
};
///////////////////////////////

// for drawing aggregate anomalies [this should be the same as the other red/grey layer ...need to fix]
vectorSource = new ol.source.Vector(); // empty vector

//create the style
iconStyle = new ol.style.Style({
	image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
		anchor: [.01, .1],
		anchorXUnits: 'fraction',
		anchorYUnits: 'fraction',
		src: 'images/greenMarker.jpg'
	}))
});

//add the feature vector to the layer vector, and apply a style to whole layer
vectorLayer = new ol.layer.Vector({
	opacity: 0.75,
	source: vectorSource,
	style: iconStyle
});

// for drawing aggregate results
redVectorSource = new ol.source.Vector();
redIconStyle = new ol.style.Style({
	image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
		/*anchor: [1, 1],
		anchorXUnits: 'fraction',
		anchorYUnits: 'fraction',*/
		src: 'images/redMarker.jpg'
	}))
});
redVectorLayer = new ol.layer.Vector({
	opacity: 0.75,
	source: redVectorSource,
	style: redIconStyle
});

greyVectorSource = new ol.source.Vector();
greyIconStyle = new ol.style.Style({
	image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
		/*anchor: [1, 1],
		anchorXUnits: 'fraction',
		anchorYUnits: 'fraction',*/
		src: 'images/greyMarker.jpg'
	}))
});
greyVectorLayer = new ol.layer.Vector({
	opacity: 0.75,
	source: greyVectorSource,
	style: greyIconStyle
});

////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////	
// end onload

// Column separator used in dataset from SSB
csv = d3.dsv(' ', 'text/plain');
psv = d3.dsv(" ", "text/plain");

// Convert SSBgrid data to GeoJSON
function ssbgrid2geojson( size ){
	points = {
		type: 'FeatureCollection',
		features: []
	};
	
	$.ajaxSetup({
		async: false
	});
	foo = (function( ){
		var result;
		$.getJSON('data/testArctic.json', {}, function(data){
		  result = data;
		});
		return result;
	})();
	$.ajaxSetup({
		async: true
	});
	
	var lll = 0;
	for( lll = 0; lll < foo.length; lll++ ){
		var id = foo[lll].sum;
		var x = foo[lll].long; // use better var names
		var y = foo[lll].lat;
		loc = ol.proj.transform([x, y], 'EPSG:4326', 'EPSG:3413'); 

		points.features.push({
			type: 'Feature',
			id: id,
			properties: foo[lll],
			geometry: {
				type: 'Point',
				coordinates: [loc[0]+ size / 2, loc[1] + size / 2]
			}
		});
	}
	return points;
}

// Convert to GeoJSON
geojson = ssbgrid2geojson(gridSize);

// Create vector grid from GeoJSON
grid = new ol.source.Vector({
	features: (new ol.format.GeoJSON()).readFeatures(geojson),
	attributions: [new ol.Attribution({
		html: '<a href="http://ssb.no/">SSB</a>'
	})]
});

console.log("grid: " + grid);

// Create grid style function
gridStyle = function( feature ){
	var coordinate = feature.getGeometry().getCoordinates(),
		x = coordinate[0] - gridSize / 2,
		y = coordinate[1] - gridSize / 2,
		pop = parseInt(feature.getProperties().sum),
		rgb = d3.rgb(colorScale(240)); //(Math.random()*(500 - 20)+20)); // refreshes each time i interact?
		
	return [
		new ol.style.Style({
			fill: new ol.style.Fill({
				color: [rgb.r, rgb.g, rgb.b, 0.6] // color: [0, 255, 0, 0.4] // color: [rgb.r, rgb.g, rgb.b, 0.6]
			}),
			geometry: new ol.geom.Polygon([[
				[x,y], [x, y + gridSize], [x + gridSize, y + gridSize], [x + gridSize, y]
			]])
		})
	];
};

// Create grid selection style
gridSelectStyle = function( feature, resolution ){
	var coordinate = feature.getGeometry().getCoordinates(),
		x = coordinate[0] - gridSize / 2,
		y = coordinate[1] - gridSize / 2,
		pop = parseInt(feature.getProperties().sum),
		rgb = d3.rgb(colorScale(70));

	return [
		new ol.style.Style({
			stroke: new ol.style.Stroke({
				color: '#333',
				width: 10 / resolution
			}),
			fill: new ol.style.Fill({
				color: [0, 0, 240, 0.3] // Math.random() * (max - min) + min;
			}),
			geometry: new ol.geom.Polygon([[
				[x,y], [x, y + gridSize], [x + gridSize, y + gridSize], [x + gridSize, y]
			]])
		})
	];
};

// Create layer form vector grid and style function
gridLayer = new ol.layer.Vector({
	source: grid,
	style: gridStyle
});

console.log("adding grid layer")
// Add grid layer to map
map.addLayer(gridLayer);