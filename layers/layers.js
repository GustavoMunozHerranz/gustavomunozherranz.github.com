var wms_layers = [];


        var lyr_GoogleHybrid_0 = new ol.layer.Tile({
            'title': 'Google Hybrid',
            'type': 'base',
            'opacity': 1.000000,
            
            
            source: new ol.source.XYZ({
    attributions: ' ',
                url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
            })
        });
var format_PLANOS_1 = new ol.format.GeoJSON();
var features_PLANOS_1 = format_PLANOS_1.readFeatures(json_PLANOS_1, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_PLANOS_1 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_PLANOS_1.addFeatures(features_PLANOS_1);
var lyr_PLANOS_1 = new ol.layer.Vector({
                declutter: true,
                source:jsonSource_PLANOS_1, 
                style: style_PLANOS_1,
                interactive: true,
                title: 'PLANOS'
            });

lyr_GoogleHybrid_0.setVisible(true);lyr_PLANOS_1.setVisible(true);
var layersList = [lyr_GoogleHybrid_0,lyr_PLANOS_1];
lyr_PLANOS_1.set('fieldAliases', {'fid': 'fid', 'dn_surface': 'dn_surface', 'uso_sigpac': 'uso_sigpac', 'idPanel': 'idPanel', 'DETALLES_Poblaci�n': 'DETALLES_Poblaci�n', 'DETALLES_Referencia catastral': 'DETALLES_Referencia catastral', 'PAC': 'PAC', 'CULTIVO 2024': 'CULTIVO 2024', });
lyr_PLANOS_1.set('fieldImages', {'fid': 'Range', 'dn_surface': 'TextEdit', 'uso_sigpac': 'TextEdit', 'idPanel': 'TextEdit', 'DETALLES_Poblaci�n': 'TextEdit', 'DETALLES_Referencia catastral': 'TextEdit', 'PAC': 'TextEdit', 'CULTIVO 2024': 'TextEdit', });
lyr_PLANOS_1.set('fieldLabels', {'fid': 'no label', 'dn_surface': 'no label', 'uso_sigpac': 'no label', 'idPanel': 'no label', 'DETALLES_Poblaci�n': 'no label', 'DETALLES_Referencia catastral': 'no label', 'PAC': 'no label', 'CULTIVO 2024': 'no label', });
lyr_PLANOS_1.on('precompose', function(evt) {
    evt.context.globalCompositeOperation = 'normal';
});