function satelliteTool(trackID, map, zoomToGPSButton) {
    this.trackID = trackID;
    this.zoomToGPSButton = zoomToGPSButton;
    this.view = map.getView();
    this.geolocation = new ol.Geolocation({
        projection: this.view.getProjection()
    });
    this.iconSource = "img/soldado.svg";
    this.accuracyFeature = new ol.Feature();
    this.positionFeature = new ol.Feature();
    this.positionFeature.setStyle(new ol.style.Style({
        image: new ol.style.Icon({
            src: this.iconSource,
            anchor: [0.5, 0.5],
            anchorXUnits: 'fraction',
            anchorYUnits: 'fraction'
        })
    }));
    
    this.layer = new ol.layer.Vector({
        map: map,
        source: new ol.source.Vector({
            features: [this.accuracyFeature, this.positionFeature]
        })
    });    
}

satelliteTool.prototype.el = function(id) {
  return document.getElementById(id);
}

satelliteTool.prototype.listen = function() {

    var satTool = this;
    
    $(this.trackID).on('change', function() {
        satTool.geolocation.setTracking(this.checked);	
        if (!this.checked) {
            satTool.positionFeature.setGeometry(null);
            satTool.accuracyFeature.setGeometry(null);
            $(this).siblings("button")[0].lastChild.data="Ativar";
        } else {
            $(this).siblings("button")[0].lastChild.data="Desativar";
            satTool.geolocation.once('change', function() {
                $(satTool.zoomToGPSButton).click();
            });
        }
        sidebar.close();
    });

    // update the HTML page when the position changes.
    this.geolocation.on('change', function() {
        satTool.el('accuracy').innerText = satTool.geolocation.getAccuracy() + ' [m]';
        satTool.el('altitude').innerText = satTool.geolocation.getAltitude() + ' [m]';
        satTool.el('altitudeAccuracy').innerText = satTool.geolocation.getAltitudeAccuracy() + ' [m]';  
    });
    
    // handle geolocation error.
    this.geolocation.on('error', function(error) {
        var info = document.getElementById('info');
        info.innerHTML = error.message;
        info.style.display = '';
    });
    
    this.geolocation.on('change:accuracyGeometry', function() {
        satTool.accuracyFeature.setGeometry(satTool.geolocation.getAccuracyGeometry());
    });
    
    this.geolocation.on('change:position', function() {
        var coordinates = satTool.geolocation.getPosition();
        satTool.positionFeature.setGeometry(coordinates ? new ol.geom.Point(coordinates) : null);
    });
    
    $(satTool.zoomToGPSButton).on('click', function() {
        if ($(satTool.trackID)[0].checked) {
            var coordinates = satTool.geolocation.getPosition();
            zoomToCoord(coordinates[0],coordinates[1],11,"");
        }
    });
        
}

satelliteToolObj = new satelliteTool('#track', map, "#btn-zoomtogps");
satelliteToolObj.listen();

















