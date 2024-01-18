

var container = document.getElementById('popup');
var content = document.getElementById('popup-content');
var closer = document.getElementById('popup-closer');
var sketch;

closer.onclick = function() {
    container.style.display = 'none';
    closer.blur();
    return false;
};
var overlayPopup = new ol.Overlay({
    element: container
});

var expandedAttribution = new ol.control.Attribution({
    collapsible: false
});

var map = new ol.Map({
    controls: ol.control.defaults({attribution:false}).extend([
        expandedAttribution
    ]),
    target: document.getElementById('map'),
    renderer: 'canvas',
    overlays: [overlayPopup],
    layers: layersList,
    view: new ol.View({
         maxZoom: 28, minZoom: 1
    })
});


map.getView().fit([-626373.960956, 5162347.595176, -608868.683237, 5171602.341088], map.getSize());

var NO_POPUP = 0
var ALL_FIELDS = 1

/**
 * Returns either NO_POPUP, ALL_FIELDS or the name of a single field to use for
 * a given layer
 * @param layerList {Array} List of ol.Layer instances
 * @param layer {ol.Layer} Layer to find field info about
 */
function getPopupFields(layerList, layer) {
    // Determine the index that the layer will have in the popupLayers Array,
    // if the layersList contains more items than popupLayers then we need to
    // adjust the index to take into account the base maps group
    var idx = layersList.indexOf(layer) - (layersList.length - popupLayers.length);
    return popupLayers[idx];
}


var collection = new ol.Collection();
var featureOverlay = new ol.layer.Vector({
    map: map,
    source: new ol.source.Vector({
        features: collection,
        useSpatialIndex: false // optional, might improve performance
    }),
    style: [new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: '#f00',
            width: 1
        }),
        fill: new ol.style.Fill({
            color: 'rgba(255,0,0,0.1)'
        }),
    })],
    updateWhileAnimating: true, // optional, for instant visual feedback
    updateWhileInteracting: true // optional, for instant visual feedback
});

var doHighlight = false;
var doHover = false;

var highlight;
var autolinker = new Autolinker({truncate: {length: 30, location: 'smart'}});
var onPointerMove = function(evt) {
    if (!doHover && !doHighlight) {
        return;
    }
    var pixel = map.getEventPixel(evt.originalEvent);
    var coord = evt.coordinate;
    var popupField;
    var currentFeature;
    var currentLayer;
    var currentFeatureKeys;
    var clusteredFeatures;
    var popupText = '<ul>';
    map.forEachFeatureAtPixel(pixel, function(feature, layer) {
        // We only care about features from layers in the layersList, ignore
        // any other layers which the map might contain such as the vector
        // layer used by the measure tool
        if (layersList.indexOf(layer) === -1) {
            return;
        }
        var doPopup = false;
        for (k in layer.get('fieldImages')) {
            if (layer.get('fieldImages')[k] != "Hidden") {
                doPopup = true;
            }
        }
        currentFeature = feature;
        currentLayer = layer;
        clusteredFeatures = feature.get("features");
        var clusterFeature;
        if (typeof clusteredFeatures !== "undefined") {
            if (doPopup) {
                for(var n=0; n<clusteredFeatures.length; n++) {
                    clusterFeature = clusteredFeatures[n];
                    currentFeatureKeys = clusterFeature.getKeys();
                    popupText += '<li><table>'
                    for (var i=0; i<currentFeatureKeys.length; i++) {
                        if (currentFeatureKeys[i] != 'geometry') {
                            popupField = '';
                            if (layer.get('fieldLabels')[currentFeatureKeys[i]] == "inline label") {
                            popupField += '<th>' + layer.get('fieldAliases')[currentFeatureKeys[i]] + ':</th><td>';
                            } else {
                                popupField += '<td colspan="2">';
                            }
                            if (layer.get('fieldLabels')[currentFeatureKeys[i]] == "header label") {
                                popupField += '<strong>' + layer.get('fieldAliases')[currentFeatureKeys[i]] + ':</strong><br />';
                            }
                            if (layer.get('fieldImages')[currentFeatureKeys[i]] != "ExternalResource") {
                                popupField += (clusterFeature.get(currentFeatureKeys[i]) != null ? autolinker.link(clusterFeature.get(currentFeatureKeys[i]).toLocaleString()) + '</td>' : '');
                            } else {
                                popupField += (clusterFeature.get(currentFeatureKeys[i]) != null ? '<img src="images/' + clusterFeature.get(currentFeatureKeys[i]).replace(/[\\\/:]/g, '_').trim()  + '" /></td>' : '');
                            }
                            popupText += '<tr>' + popupField + '</tr>';
                        }
                    } 
                    popupText += '</table></li>';    
                }
            }
        } else {
            currentFeatureKeys = currentFeature.getKeys();
            if (doPopup) {
                popupText += '<li><table>';
                for (var i=0; i<currentFeatureKeys.length; i++) {
                    if (currentFeatureKeys[i] != 'geometry') {
                        popupField = '';
                        if (layer.get('fieldLabels')[currentFeatureKeys[i]] == "inline label") {
                            popupField += '<th>' + layer.get('fieldAliases')[currentFeatureKeys[i]] + ':</th><td>';
                        } else {
                            popupField += '<td colspan="2">';
                        }
                        if (layer.get('fieldLabels')[currentFeatureKeys[i]] == "header label") {
                            popupField += '<strong>' + layer.get('fieldAliases')[currentFeatureKeys[i]] + ':</strong><br />';
                        }
                        if (layer.get('fieldImages')[currentFeatureKeys[i]] != "ExternalResource") {
                            popupField += (currentFeature.get(currentFeatureKeys[i]) != null ? autolinker.link(currentFeature.get(currentFeatureKeys[i]).toLocaleString()) + '</td>' : '');
                        } else {
                            popupField += (currentFeature.get(currentFeatureKeys[i]) != null ? '<img src="images/' + currentFeature.get(currentFeatureKeys[i]).replace(/[\\\/:]/g, '_').trim()  + '" /></td>' : '');
                        }
                        popupText += '<tr>' + popupField + '</tr>';
                    }
                }
                popupText += '</table></li>';
            }
        }
    });
    if (popupText == '<ul>') {
        popupText = '';
    } else {
        popupText += '</ul>';
    }

    if (doHighlight) {
        if (currentFeature !== highlight) {
            if (highlight) {
                featureOverlay.getSource().removeFeature(highlight);
            }
            if (currentFeature) {
                var styleDefinition = currentLayer.getStyle().toString();

                if (currentFeature.getGeometry().getType() == 'Point') {
                    var radius = styleDefinition.split('radius')[1].split(' ')[1];

                    highlightStyle = new ol.style.Style({
                        image: new ol.style.Circle({
                            fill: new ol.style.Fill({
                                color: "#ffff00"
                            }),
                            radius: radius
                        })
                    })
                } else if (currentFeature.getGeometry().getType() == 'LineString') {

                    var featureWidth = styleDefinition.split('width')[1].split(' ')[1].replace('})','');

                    highlightStyle = new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: '#ffff00',
                            lineDash: null,
                            width: featureWidth
                        })
                    });

                } else {
                    highlightStyle = new ol.style.Style({
                        fill: new ol.style.Fill({
                            color: '#ffff00'
                        })
                    })
                }
                featureOverlay.getSource().addFeature(currentFeature);
                featureOverlay.setStyle(highlightStyle);
            }
            highlight = currentFeature;
        }
    }

    if (doHover) {
        if (popupText) {
            overlayPopup.setPosition(coord);
            content.innerHTML = popupText;
            container.style.display = 'block';        
        } else {
            container.style.display = 'none';
            closer.blur();
        }
    }
};

var onSingleClick = function(evt) {
    if (doHover) {
        return;
    }
    if (sketch) {
        return;
    }
    var pixel = map.getEventPixel(evt.originalEvent);
    var coord = evt.coordinate;
    var popupField;
    var currentFeature;
    var currentFeatureKeys;
    var clusteredFeatures;
    var popupText = '<ul>';
    map.forEachFeatureAtPixel(pixel, function(feature, layer) {
        if (feature instanceof ol.Feature && (layer.get("interactive") || layer.get("interactive") == undefined)) {
            var doPopup = false;
            for (k in layer.get('fieldImages')) {
                if (layer.get('fieldImages')[k] != "Hidden") {
                    doPopup = true;
                }
            }
            currentFeature = feature;
            clusteredFeatures = feature.get("features");
            var clusterFeature;
            if (typeof clusteredFeatures !== "undefined") {
                if (doPopup) {
                    for(var n=0; n<clusteredFeatures.length; n++) {
                        clusterFeature = clusteredFeatures[n];
                        currentFeatureKeys = clusterFeature.getKeys();
                        popupText += '<li><table>'
                        for (var i=0; i<currentFeatureKeys.length; i++) {
                            if (currentFeatureKeys[i] != 'geometry') {
                                popupField = '';
                                if (layer.get('fieldLabels')[currentFeatureKeys[i]] == "inline label") {
                                popupField += '<th>' + layer.get('fieldAliases')[currentFeatureKeys[i]] + ':</th><td>';
                                } else {
                                    popupField += '<td colspan="2">';
                                }
                                if (layer.get('fieldLabels')[currentFeatureKeys[i]] == "header label") {
                                    popupField += '<strong>' + layer.get('fieldAliases')[currentFeatureKeys[i]] + ':</strong><br />';
                                }
                                if (layer.get('fieldImages')[currentFeatureKeys[i]] != "ExternalResource") {
                                    popupField += (clusterFeature.get(currentFeatureKeys[i]) != null ? autolinker.link(clusterFeature.get(currentFeatureKeys[i]).toLocaleString()) + '</td>' : '');
                                } else {
                                    popupField += (clusterFeature.get(currentFeatureKeys[i]) != null ? '<img src="images/' + clusterFeature.get(currentFeatureKeys[i]).replace(/[\\\/:]/g, '_').trim()  + '" /></td>' : '');
                                }
                                popupText += '<tr>' + popupField + '</tr>';
                            }
                        } 
                        popupText += '</table></li>';    
                    }
                }
            } else {
                currentFeatureKeys = currentFeature.getKeys();
                if (doPopup) {
                    popupText += '<li><table>';
                    for (var i=0; i<currentFeatureKeys.length; i++) {
                        if (currentFeatureKeys[i] != 'geometry') {
                            popupField = '';
                            if (layer.get('fieldLabels')[currentFeatureKeys[i]] == "inline label") {
                                popupField += '<th>' + layer.get('fieldAliases')[currentFeatureKeys[i]] + ':</th><td>';
                            } else {
                                popupField += '<td colspan="2">';
                            }
                            if (layer.get('fieldLabels')[currentFeatureKeys[i]] == "header label") {
                                popupField += '<strong>' + layer.get('fieldAliases')[currentFeatureKeys[i]] + ':</strong><br />';
                            }
                            if (layer.get('fieldImages')[currentFeatureKeys[i]] != "ExternalResource") {
                                popupField += (currentFeature.get(currentFeatureKeys[i]) != null ? autolinker.link(currentFeature.get(currentFeatureKeys[i]).toLocaleString()) + '</td>' : '');
                            } else {
                                popupField += (currentFeature.get(currentFeatureKeys[i]) != null ? '<img src="images/' + currentFeature.get(currentFeatureKeys[i]).replace(/[\\\/:]/g, '_').trim()  + '" /></td>' : '');
                            }
                            popupText += '<tr>' + popupField + '</tr>';
                        }
                    }
                    popupText += '</table>';
                }
            }
        }
    });
    if (popupText == '<ul>') {
        popupText = '';
    } else {
        popupText += '</ul>';
    }
    
	var viewProjection = map.getView().getProjection();
	var viewResolution = map.getView().getResolution();

	for (i = 0; i < wms_layers.length; i++) {
		if (wms_layers[i][1] && wms_layers[i][0].getVisible()) {
			overlayPopup.setPosition(coord);
			container.style.display = 'block';
			var url = wms_layers[i][0].getSource().getFeatureInfoUrl(
					evt.coordinate, viewResolution, viewProjection, {
					'INFO_FORMAT': 'text/html',
				});
			if (url) {
				content.innerHTML = '';

				var loadingIcon = document.createElement('div');
				loadingIcon.className = 'lds-roller';

				var imgElement = document.createElement('img');
				imgElement.src = "data:image/gif;base64,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";
				imgElement.style.height = '25px';
				imgElement.style.width = '25px';
				loadingIcon.appendChild(imgElement);

				container.appendChild(loadingIcon); // Aggiungi l'icona come ultimo figlio di "popup"

				var timeoutPromise = new Promise((resolve, reject) => {
						setTimeout(() => {
							reject(new Error('Timeout exceeded'));
						}, 5000); // 5000 millisecondi (5 secondi)
					});

				Promise.race([
						fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent(url)),
						timeoutPromise
					])
				.then((response) => {
					if (response.ok) {
						return response.text();
					} //else {						
					//}
				})
				.then((html) => {
					if (html.indexOf('<table') !== -1) {
						overlayPopup.setPosition(coord);
						content.innerHTML += html + '<p>' + '</p>';
						container.style.display = 'block';
					} // else {
					// }
				})
				// .catch((error) => {
				// })
				.finally(() => {
					var loaderIcon = document.querySelector('.lds-roller');
					loaderIcon.remove();
				});
			}
		}
	}

    if (popupText) {
        overlayPopup.setPosition(coord);
        content.innerHTML = popupText;
        container.style.display = 'block';        
    } else {
        container.style.display = 'none';
        closer.blur();
    }
};



map.on('pointermove', function(evt) {
    onPointerMove(evt);
});
map.on('singleclick', function(evt) {
    onSingleClick(evt);
});




var attributionComplete = false;
map.on("rendercomplete", function(evt) {
    if (!attributionComplete) {
        var attribution = document.getElementsByClassName('ol-attribution')[0];
        var attributionList = attribution.getElementsByTagName('ul')[0];
        var firstLayerAttribution = attributionList.getElementsByTagName('li')[0];
        var qgis2webAttribution = document.createElement('li');
        qgis2webAttribution.innerHTML = '<a href="https://github.com/tomchadwin/qgis2web">qgis2web</a> &middot; ';
        var olAttribution = document.createElement('li');
        olAttribution.innerHTML = '<a href="https://openlayers.org/">OpenLayers</a> &middot; ';
        var qgisAttribution = document.createElement('li');
        qgisAttribution.innerHTML = '<a href="https://qgis.org/">QGIS</a>';
        attributionList.insertBefore(qgis2webAttribution, firstLayerAttribution);
        attributionList.insertBefore(olAttribution, firstLayerAttribution);
        attributionList.insertBefore(qgisAttribution, firstLayerAttribution);
        attributionComplete = true;
    }
})
