/**
 * Define a namespace for the application.
 */
window.app = {};
var app = window.app;
var mapExtent=[-125, -55, 0, 15];

const geonamesPath = '';

var resolutions = [0.07936954220105226, 0.06349563376084183, 0.047621725320631365, 0.031747816880420915, 0.015873908440210457, 0.007936954220105229, 0.0031747816880420914, 0.0015873908440210457, 0.0007936954220105229, 0.00031747816880420905, 0.0002476329716672831, 0.00015873908440210453, 7.936954220105226e-05, 4.7621725320631366e-05, 3.1747816880420904e-05, 2.3810862660315683e-05, 1.5873908440210452e-05, 7.936954220105226e-06, 3.174781688042091e-06, 1.5873908440210455e-06, 3.174781688042091e-07]

var nodeLayermap = {}; //this is used to remember the unique relation from nodeId to openlayers layer object
//var idcgToNodeIdMap={};


var defaultLayerDrawingName = "layerDrawingOrder";

/* returns the description text of a layer */
function getNameByLayerNumber(layerIndex) {
    var layerName=$("#"+defaultLayerDrawingName+layerIndex+ " .panel-heading").html(); 
    return layerName;
}

/* changes Index to defaultLayerDrawingName+Index*/
function getLayerNode(layerIndex) {
    return $("#"+defaultLayerDrawingName+layerIndex);
}

/* changes defaultLayerDrawingName+Index to Index */
function getLayerIndexFromId(layerId) {
    return layerId.substring(defaultLayerDrawingName.length);
}

/*return the node that the layer with idcg_arvore was assigned during tree creation.*/
function getLayerIndexFromIDCGArvore() {
    var idcgToNodeIdMap={};
    var layerNodes=$layerTree.treeview('getEnabled'); 
    $.each(layerNodes, function (index, layerNode) {
        idcgToNodeIdMap[layerNode.idcg_arvore]=layerNode.nodeId;    
    });
    return idcgToNodeIdMap
}

function getBaseURL() {
	var baseURL=window.location.href.match(/^[^\#\?]+/)[0];
	if (baseURL[baseURL.length-1]!='/') {
		baseURL+='/';
	}
	return baseURL;
}

function isHttps() {
	return (window.location.protocol == 'https:');
}

function fixIfHttps(fixurl) {
	if (isHttps()) {
		fixurl=fixurl.replace('http://','https://');
		return fixurl;
	} else {
		return fixurl;
	}
}

function isMobile() {
    if (window.screen.width < 1024) {
    // resolution is below 1024 x 768
        return true;
    } else {
        return false;
    }
} 

function checkIfSidebarShouldClose() {
    if (isMobile()) {
        sidebar.close();
    }
}

var image = new ol.style.Circle({
  radius: 5,
  fill: null,
  stroke: new ol.style.Stroke({color: 'red', width: 1}),
});

var styles = {
  'Point': new ol.style.Style({
    image: image,
  }),
}

var styleFunction = function (feature) {
  return styles[feature.getGeometry().getType()];
};

function loadJSONFile(callback, url) {   

    var xmlobj = new XMLHttpRequest();

    xmlobj.overrideMimeType("application/json");

    xmlobj.open('GET', url, true); // Provide complete path to your json file here. Change true to false for synchronous loading.

    xmlobj.onreadystatechange = function () {
          if (xmlobj.readyState == 4 && xmlobj.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            callback(xmlobj.responseText);
          }
    };

    xmlobj.send(null);  
 }

app.newMapLayer=function(layerTitle,layerName,url,nodeId,type) {
    var tileGrid = new ol.tilegrid.TileGrid({
        extent: mapExtent,
        resolutions: resolutions,
        tileSize: [256, 256]
    });
    
    //check if https should be started
    if (isHttps()) {
    	//url=url.replace("http://","https://");
    }
    
    switch(type){
        case 8:
            let urlEdit = url.replace('{layerName}',layerName) 
            var layer = new ol.layer.Tile({
                source: new ol.source.XYZ({
                    url: urlEdit
                })
            });
            break;
        default:            
            var layer=new ol.layer.Tile({
                extent: mapExtent,
                source: new ol.source.TileWMS({
                preload: Infinity,
                url: url,
                params: {'LAYERS': layerName, 'TILED': true, 'VERSION': '1.1.1',},
                serverType: 'geoserver',
                tileGrid: tileGrid
                })
            });
    }
    app.AddLayerToMap(layer,layerTitle,layerName,nodeId);
    return layer;
};

app.AddLayerToMap= function(layer,layerTitle,layerName,nodeId) {
	map.addLayer(layer);
    nodeLayermap[nodeId]=layer;
    
    $( "#layerDrawingOrder" ).prepend( '<li id="'+defaultLayerDrawingName+nodeId+'" class="panel panel-info layerorder"> \
    <div class="panel-heading">'+layerTitle+'</div> \
    <div class="panel-body" style="clear:both; padding-right:10px; padding-bottom:5px;"> \
        <div class="layerDrawingOrderLeft" style="padding-left:20px;"> \
    	<label>Transparência: 0%</label><br>\
        <div class="transparencySliders" id="transparencySlider'+nodeId+'"></div> \
        </div> \
        <div class="layerDrawingOrderRight">  \
        <label for="removeLayerButton'+nodeId+'">Remover</label><br> \
        <button type="button" id=removeLayerButton'+nodeId+' class="btn btn-default" aria-label="Left Align"> \
            <span class="glyphicon glyphicon-remove" aria-hidden="true"></span> \
        </button> \
        </div> \
    </div> \
    </li>');
    
    $("#removeLayerButton"+nodeId).click(function () {
        //alert($( this ).parent().parent());
        //app.removeWMSLayer(nodeId);
        $('#treeview-selectable').treeview('unselectNode', nodeId);
    });  
 
    var slider = document.getElementById('transparencySlider'+nodeId);
        noUiSlider.create(slider, {
        start: [0],
        connect: true,
        step: 10,
        orientation: 'horizontal', // 'horizontal' or 'vertical'
        range: {
            'min': 0,
            'max': 100
        }
    });
        
    slider.noUiSlider.on('update', function (value, handle) {
        var layerId = defaultLayerDrawingName + nodeId;
        transparencyChange(layerId, value);
    });
    
    //adding WMSlegend
    //imgSrc = url +'?service=WMS&request=GetLegendGraphic&version=1.1.0&layer=' + layerName;    
    //$( "#"+defaultLayerDrawingName+nodeId+" .panel-body" ).append("<img src="+imgSrc+"></img>");
    syncMapWithDrawingOrder();
    checkIfSidebarShouldClose();
};



        

app.removeMapLayer = function(nodeId) {
	var l=nodeLayermap[nodeId];
	delete nodeLayermap[nodeId];
    map.removeLayer(l);
    $(getLayerNode(nodeId)).remove();
    syncMapWithDrawingOrder();
    checkIfSidebarShouldClose();
};

var layers = [];



var map = new ol.Map({
  controls: ol.control.defaults({
    attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
      collapsible: false
    })
  }).extend([
    new ol.control.FullScreen({source: document.getElementById('map').parentNode}),
    new ol.control.ZoomToExtent({extent: [-70,-30,-40,2]}),
    new ol.control.MousePosition({coordinateFormat: ol.coordinate.createStringXY(2)}),
    new ol.control.ScaleLine() 
  ]),
  layers: layers,
  pixelRatio: 1,
  target: 'map',
  view: new ol.View({
    resolutions: resolutions,
    projection : 'EPSG:4326',
    center: [-53, -13],
    zoom: 2,
    extent: mapExtent
  })
});

var sidebar = new ol.control.Sidebar({ element: 'sidebar', position: 'left' });
map.addControl(sidebar);


//Sets transparency when default
function setDefaultTransparency(layerId, transparency) {
    transparencyChange(layerId, transparency);
    var slider = document.getElementById('transparencySlider14');
    slider.noUiSlider.set(transparency);
}


//geonames search
function geoNamesSearch(e) {
    //cleaning before searching
    $("#geonamesList").html('');
    var inputFilter=$("#input-geonames-search").val();
    if (inputFilter.length>2) {
        var wfsurl=location.protocol + '//' + location.host+geonamesPath;
        
        var wfsXML='<?xml version="1.0" encoding="UTF-8"?>\
        <wfs:GetFeature  service="WFS" version="1.0.0" \
            outputFormat="GML2" \
            xmlns:topp="http://www.openplans.org/topp" \
             xmlns:wfs="http://www.opengis.net/wfs" \
             xmlns:ogc="http://www.opengis.net/ogc" \
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" \
             xsi:schemaLocation="http://www.opengis.net/wfs \
             http://schemas.opengis.net/wfs/1.0.0/WFS-basic.xsd">\
            <wfs:Query  typeName="municipios_sede">\
            <wfs:propertyName>ms:msGeometry,ms:NM_LOCALID,ms:NM_UF,ms:CD_CATEGOR</wfs:propertyName>\
            <ogc:Filter>\
            <ogc:PropertyIsLike  wildCard="*" singleChar="." escape="!">\
            <ogc:PropertyName>NM_LOCALID</ogc:PropertyName>\
            <ogc:Literal>*'+inputFilter.toUpperCase()+'*</ogc:Literal>\
            </ogc:PropertyIsLike>\
           </ogc:Filter>\
           </wfs:Query>\
            </wfs:GetFeature>'
        
        //let's ajax
        $.ajax({
            type: "post",
            url: wfsurl,
            //contentType: "text/xml",
            contentType: "text/xml;  charset=UTF-8",
            data: wfsXML,
            dataType: "xml",
            success: function(xml) {
                    var matched = $(xml).find(escapeElementName('ms:municipios_sede'));
                    var defaultZoom=5;
                    //$("#geonamesList").html(data);
                    //$( this ).addClass( "done" );
                    if (matched.length==0) { //if I didn't find any features
                            $("#geonamesList").html('Nenhuma localidade foi encontrada.')
                    } else {
                        $.each(matched, function (index, value) {
                            var coordinates= $(value).find(escapeElementName('gml:coordinates'))[0].innerHTML.split(' ')[0];
                            var locname= $(value).find(escapeElementName('ms:NM_LOCALID'))[0].innerHTML;
                            var UF=$(value).find(escapeElementName('ms:NM_UF'))[0].innerHTML;
                            var nivel=$(value).find(escapeElementName('ms:CD_CATEGOR'))[0].innerHTML;
                            $("#geonamesList").append('<div class="row"  nivel='+nivel+'><a class="btn btn-default" role="button" href="javascript:zoomToCoord('+coordinates+','+defaultZoom+',\''+locname+'\')">'+locname+" - "+ UF+'</a></div>');
                        });
                        $('#geonamesList div').sort(function(a,b) {
                            var nivelA=a.getAttribute("nivel").length;
                            var nivelB=b.getAttribute("nivel").length;
                            if (nivelA==nivelB) {
                                    return a.firstChild.firstChild.nodeValue > b.firstChild.firstChild.nodeValue ? 1 : -1; //be carefull, string comparison
                            } else {
                                    return  nivelA > nivelB ? 1 : -1;
                            }
                        }).appendTo('#geonamesList');
                    }
            }
        });
    } else {
        $("#geonamesList").html('Digite pelo menos 3 caracteres.');
    }

}



function geoNamesSearchClear() {
	$("#geonamesList").html('');
	$("#input-geonames-search").val('');
	clearVectorSource();
}


//transparency stuff
function transparencyChange(layerDrawingOrderId,val) {
	var nodeId = getLayerIndexFromId(layerDrawingOrderId);
	var newVal = 1 - val/100;
	nodeLayermap[nodeId].setOpacity(newVal);
	transparencyUpdateLabel(layerDrawingOrderId,newVal);
}

function transparencyUpdateLabel(layerDrawingOrderId,newVal) {
	var transpText=$("#"+layerDrawingOrderId+" .panel-body .layerDrawingOrderLeft label").text().split(':')[0];
	$("#"+layerDrawingOrderId+" .panel-body .layerDrawingOrderLeft label").text(transpText+": "+Math.round((1.-newVal)*100)+"%");
}


function zoomToExtent(extent) {
	checkIfSidebarShouldClose();
    map.getView().fit(extent, map.getSize());    
}

//Markers layer
var iconFeature=null; //yes, this should be overwritten every time
var vectorSource=new ol.source.Vector({
	  features: []
});
var vectorLayer = new ol.layer.Vector({
	  source: vectorSource
});

map.addLayer(vectorLayer);
vectorLayer.setZIndex(10000);

function zoomToCoord(lon,lat,zoom=5, description='') {
	//clean old vector feature if it exists
	clearVectorSource();
	if (description!='' ) {
		iconFeature = new ol.Feature({
			  geometry: new ol.geom.Point([lon, lat]),
			  descricao: description,
		});
		
		var iconStyle =new ol.style.Style({
			image: new ol.style.Circle({
				radius: 6,
				fill: new ol.style.Fill({color: '#FFFF00' }),
				stroke: new ol.style.Stroke({color: '#000000', width: 2 })
			}),
			text: new ol.style.Text({
				textAlign: 'Center',
				textBaseline: 'Middle',
				font: 'Normal 14px Courier New',
				text: description,
				fill: new ol.style.Fill({color: '#FFFF00'}),
				stroke: new ol.style.Stroke({color: '#000000', width: 2}),
				offsetX: 10
			})
		});
		
		iconFeature.setStyle(iconStyle);
		vectorSource.addFeature(iconFeature);
	}
	checkIfSidebarShouldClose();
	map.getView().setCenter([lon,lat]);
	map.getView().setZoom(zoom);
}



function clearVectorSource() {
	if (iconFeature!=null) { 
		vectorSource.removeFeature(iconFeature);
		iconFeature=null;
	};
}

//Alert overlay function use this to show status messages
/*bootstrap_alert = function () {}
bootstrap_alert.warning = function (message, alert, timeout) {
    //$('<div id="floating_alert" class="alert alert-' + alert + ' alert-dismissable fade in"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">×</button>' + message + '&nbsp;&nbsp;</div>').appendTo('body');
    $('<div id="floating_alert" class="alert alert-danger alert-dismissable fade in"> \
    <a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a> \
    <strong>Danger!</strong> This alert box could indicate a dangerous or potentially negative action. \
  </div>').appendTo('body');
  $('<div id="floating_alert class="alert alert-success"> \
  <strong>Success!</strong> Indicates a successful or positive action. \
</div>').appendTo('body');
}*/


function mobileModal(tagId) {
    this.tagId = '#'+tagId;
}

mobileModal.prototype.showModal = function() {
    $(this.tagId).modal();
    $(this.tagId).css("z-index","2001");

};
mobileModal.prototype.setHeader = function(header) {
    $(this.tagId).find("#mobileModalLabel").html(header);
};
mobileModal.prototype.setText = function(text) {
    $(this.tagId).find(".modal-body").html(text);
};
mobileModal.prototype.setButton = function(btnText, btnStyle, btnId, btnFunction) {
    //btnStyle deve ser uma classe de estilo de botão do bootstrap, como: btn-primary, btn-outline-warning, btn-secondary btn-lg, etc.
    //btnId pode ser a Id a que você se referirá ao botão
    var buttonStyle = 'class="btn '+ btnStyle + '" ';
    var buttonId = 'id="'+ btnId + '" ';
    var button = '<button type="button" '+ buttonStyle + buttonId + '>' + btnText + '</button>';
    $(this.tagId).find(".modal-footer").append(button);
    $("#"+btnId).on('click', btnFunction);
};

mobileModal.prototype.setLinkButton = function(btnText, btnStyle, btnId, btnLink, btnFunction) {
    //btnStyle deve ser uma classe de estilo de botão do bootstrap, como: btn-primary, btn-outline-warning, btn-secondary btn-lg, etc.
    //btnId pode ser a Id a que você se referirá ao botão
    var buttonStyle = 'class="btn '+ btnStyle + '" ';
    var buttonId = 'id="'+ btnId + '" ';
    var buttonHref = 'href="' + btnLink + '" ';
    var button = '<a role="button" '+ buttonStyle + buttonId + buttonHref + '>' + btnText + '</a>';
    $(this.tagId).find(".modal-footer").append(button);
    $("#"+btnId).on('click', btnFunction);
};    
    
mobileModal.prototype.addCloseButton = function() {
    
    this.setButton("Cancelar", "btn-secondary", "cancelButton", function() { 
        $(this.tagId).modal('hide');
        
    }.bind(this));    
};

mobileModal.prototype.clear = function() {
    $(this.tagId).find(".modal-body").empty();
    $(this.tagId).find(".modal-footer").empty();
}

$(document).ready(function() { 
    //Jquery Mobile swipe control for the sidebar
    if ( isMobile() ) {
        $(".sidebar-content").swipeleft(function() {  
            sidebar.close();
        }); 
        //Jquery Mobile swipe control for the sidebar
        $(".sidebar-tabs").swiperight(function() {  
            sidebar.openLast();
        });
        //Cut tool hides if mobile device
        $('#cutToolButton').hide();
    }
    //eventos do wms externo
    $('#btn-clear-input-wms').on('click', function (e) {
        $('#externalWMSLayerList').html('');
        $('#input-wms').val('');
    });
    
    //eventos da busca por localidade
    $("#btn-search-geonames").on('click', geoNamesSearch);
    $("#btn-clear-search-geonames").on('click', geoNamesSearchClear);
    
    $('#input-geonames-search').keypress(function(event){
    	if(event.keyCode == 13){
    		$('#btn-search-geonames').click();
    	}
    });    
    
    var modal = new mobileModal('mobileModal');
    modal.setHeader("Deseja aproximar para a sua posição?");
    modal.setText("O BDGEx pode utilizar o posicionamento satelital do seu aparelho. Caso deseje seguir para uma posição definida na barra de endereços, não ative.");
    modal.setButton("Ativar", "btn-primary", "activateButton", function () {
        $('#track').click();
        $(modal.tagId).modal('hide');
    }.bind(modal));
    modal.addCloseButton();
    modal.showModal();

    //bootstrap_alert.warning('Bem vindo ao <strong>BDGEx</strong>.', 'success', 4000);
});
