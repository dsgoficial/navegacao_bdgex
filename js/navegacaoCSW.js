var csw_url = location.protocol + '//' + location.hostname+"/csw";
var pagesize = 10;
var featureOverlay;

var protocols = {
    "None": ["Unknown", "WWW"],
    "ESRI:AIMS--http--configuration": ["ArcIMS Map Service Configuration File (*.AXL)", "ArcIMS"],
    "ESRI:AIMS--http-get-feature": ["ArcIMS Internet Feature Map Service", "ArcIMS"],
    "ESRI:AIMS--http-get-image": ["ArcIMS Internet Image Map Service", "ArcIMS"],
    "GLG:KML-2.0-http-get-map": ["Google Earth KML service (ver 2.0)", "KML"],
    "OGC:CSW": ["OGC-CSW Catalogue Service for the Web", "CSW"],
    "OGC:KML": ["OGC-KML Keyhole Markup Language", "KML"],
    "OGC:GML": ["OGC-GML Geography Markup Language", "GML"],
    "OGC:ODS": ["OGC-ODS OpenLS Directory Service", "OpenLS"],
    "OGC:OGS": ["OGC-ODS OpenLS Gateway Service", "OpenLS"],
    "OGC:OUS": ["OGC-ODS OpenLS Utility Service", "OpenLS"],
    "OGC:OPS": ["OGC-ODS OpenLS Presentation Service", "OpenLS"],
    "OGC:ORS": ["OGC-ODS OpenLS Route Service", "OpenLS"],
    "OGC:SOS": ["OGC-SOS Sensor Observation Service", "SOS"],
    "OGC:SPS": ["OGC-SPS Sensor Planning Service", "SPS"],
    "OGC:SAS": ["OGC-SAS Sensor Alert Service", "SAS"],
    "OGC:WCS": ["OGC-WCS Web Coverage Service", "WCS"],
    "OGC:WCS-1.1.0-http-get-capabilities": ["OGC-WCS Web Coverage Service (ver 1.1.0)", "WCS"],
    "OGC:WCTS": ["OGC-WCTS Web Coordinate Transformation Service", "WCTS"],
    "OGC:WFS": ["OGC-WFS Web Feature Service", "WFS"],
    "OGC:WFS-1.0.0-http-get-capabilities": ["OGC-WFS Web Feature Service (ver 1.0.0)", "WFS"],
    "OGC:WFS-G": ["OGC-WFS-G Gazzetteer Service", "WFS-G"],
    "OGC:WMC-1.1.0-http-get-capabilities": ["OGC-WMC Web Map Context (ver 1.1)", "WMC"],
    "OGC:WMS": ["OGC-WMS Web Map Service", "WMS"],
    "OGC:WMS-1.1.1-http-get-capabilities": ["OGC-WMS Capabilities service (ver 1.1.1)", "WMS"],
    "OGC:WMS-1.3.0-http-get-capabilities": ["OGC-WMS Capabilities service (ver 1.3.0)", "WMS"],
    "OGC:WMS-1.1.1-http-get-map": ["OGC Web Map Service (ver 1.1.1)", "WMS"],
    "OGC:WMS-1.3.0-http-get-map": ["OGC Web Map Service (ver 1.3.0)", "WMS"],
    "OGC:SOS-1.0.0-http-get-observation": ["OGC-SOS Get Observation (ver 1.0.0)", "SOS"],
    "OGC:SOS-1.0.0-http-post-observation": ["OGC-SOS Get Observation (POST) (ver 1.0.0)", "SOS"],
    "OGC:WNS": ["OGC-WNS Web Notification Service", "WNS"],
    "OGC:WPS": ["OGC-WPS Web Processing Service", "WPS"],
    "WWW:DOWNLOAD-1.0-ftp--download": ["File for download through FTP", "FTP"],
    "WWW:DOWNLOAD-1.0-http--download": ["File for download", "Baixar"],
    "FILE:GEO": ["GIS file", "GIS"],
    "FILE:RASTER": ["GIS RASTER file", "Raster"],
    "WWW:LINK-1.0-http--ical": ["iCalendar (URL)", "iCal"],
    "WWW:LINK-1.0-http--link": ["Web address (URL)", "WWW"],
    "WWW:LINK-1.0-http--partners": ["Partner web address (URL)", "WWW"],
    "WWW:LINK-1.0-http--related": ["Related link (URL)", "WWW"],
    "WWW:LINK-1.0-http--rss": ["RSS News feed (URL)", "RSS"],
    "WWW:LINK-1.0-http--samples": ["Showcase product (URL)", "WWW"],
    "DB:POSTGIS": ["PostGIS database table", "PostGIS"],
    "DB:ORACLE": ["ORACLE database table", "Oracle"],
    "WWW:LINK-1.0-http--opendap": ["OPeNDAP URL", "OPeNDAP"],
    "RBNB:DATATURBINE": ["Data Turbine", "turbine"],
    "UKST": ["Unknown Service Type", "unknown"],
    "WWW:LINK-1.0-http--image-thumbnail": ["Web image thumbnail (URL)", "thumb"],
};

function BoundingBox(xml) {
    //var ll = [,];
    //var ur = [,];')).children().text(),$(xml).find(escapeElementName('gmd:southBoundLatitude')).children().text()];
    this.minx = $(xml).find(escapeElementName('gmd:westBoundLongitude')).children().text()//ll[1];
    this.miny = $(xml).find(escapeElementName('gmd:southBoundLatitude')).children().text();//ll[0];
    this.maxx = $(xml).find(escapeElementName('gmd:eastBoundLongitude')).children().text()//ur[1];
    this.maxy = $(xml).find(escapeElementName('gmd:northBoundLatitude')).children().text();//ur[0];
    this.csv = [this.minx, this.miny, this.maxx, this.maxy].join();
}

function Link(xml) {
    this.value = $(xml).find(escapeElementName('gmd:linkage')).children().text();
    
    this.scheme = 'None';
    var scheme = $(xml).find(escapeElementName('gmd:protocol')).children().text();
    if (scheme in protocols) {
        this.scheme = scheme;
    } else {
    	this.scheme = "WWW:DOWNLOAD-1.0-http--download";
    }
}

function CswRecord(xml) {
    this.identifier = $(xml).find(escapeElementName('gmd:fileIdentifier')).find(escapeElementName('gco:CharacterString')).text();
    this.series = $(xml).find(escapeElementName('gmd:CI_Series')).find(escapeElementName('gmd:name')).children().text();
    this.title = $(xml).find(escapeElementName('gmd:MD_DataIdentification')).find(escapeElementName('gmd:title')).children().text();
    this.abstract = $(xml).find(escapeElementName('gmd:MD_DataIdentification')).find(escapeElementName('gmd:abstract')).children().text();
    this.publisher = $(xml).find(escapeElementName('gmd:MD_DataIdentification')).find(escapeElementName('gmd:pointOfContact')).find(escapeElementName('gmd:organisationName')).children().text();
    this.date = $(xml).find(escapeElementName('gmd:MD_DataIdentification')).find(escapeElementName('gmd:date')).find(escapeElementName('gco:Date')).text();
    this.modified = $(xml).find(escapeElementName('gmd:MD_DataIdentification')).find(escapeElementName('gmd:editionDate')).children().text();
    this.references = [];
    this.bbox = new BoundingBox($(xml).find(escapeElementName('gmd:MD_DataIdentification')).find(escapeElementName('gmd:EX_GeographicBoundingBox')));

    var self = this;

    // get all links
    $(xml).find(escapeElementName('gmd:distributionInfo')).find(escapeElementName('gmd:CI_OnlineResource')).each(function() {
        self.references.push(new Link($(this)));
    });
}

function truncate(value, length) {
    if (value.length > length) {
        return value.substring(0, length) + '...';
    }
    return value;
}

function escapeElementName(str) {
    return str.replace(':', '\\:').replace('.', '\\.');
}
function bbox2polygon(bbox,title) {
    if (bbox == null) {
        return null;
    }
    var polyCoords= [[[bbox.minx, bbox.miny], [bbox.minx, bbox.maxy], [bbox.maxx, bbox.maxy], [bbox.maxx, bbox.miny], [bbox.minx, bbox.miny]]];
    var feature = new ol.Feature({
    	geometry: new ol.geom.Polygon(polyCoords),
    	labelPoint: new ol.geom.Point([bbox.minx,bbox.maxy]),
    	name: title
	});
    return feature;
}

function style_record(rec) {
    var snippet = "<div class=\"cswRecord\">";
    var links = "";
    // get all links
    for (var i = 0; i < rec.references.length; i++) { 
        if (rec.references[i].value != "None" && !(rec.references[i].value.lastIndexOf('baixarpdf')>0) && rec.references[i].value.lastIndexOf("http", 0) === 0) {//aqui foi feita uma bagunça para evitar o pdf nos vetoriais!
            if (rec.references[i].scheme == 'OGC:WMS-1.1.1-http-get-map') {
                urlbase = rec.references[i].value.split('?')[0];
                links += '<span id="' + rec.references[i].value + '##' + rec.title + '" class="btn btn-primary btn-sm">Add to map</span>';
            }
            else {
                links += ' <a class="btn btn-primary btn-sm" title="' + rec.references[i].scheme + '" href="' + fixIfHttps(rec.references[i].value) + '">' + protocols[rec.references[i].scheme][1] + '</a> ';
            }
        }
    }
    //botao detalhes do metadado do produto
    var metadataURL=location.protocol+"//"+location.hostname+location.pathname+"verMetadados/"+rec.identifier;
    links += ' <a class="btn btn-primary btn-sm" title="Ver Metadados" href="'+metadataURL+'" target="_blank">Detalhar</a> ';
    //O nome do produto dá zoom nele.
    title2 = '<a id="' + rec.bbox.csv + '" class="a-record" title="Aproximar à região do produto" href="javascript:zoomToExtent(['+rec.bbox.csv+']);"> <i class="glyphicon glyphicon-zoom-in"></i> ' + rec.title + '</a>';
    snippet += '<h5>' + title2 + '</h5>';
    snippet += '<small><strong>Série:</strong> ' + rec.series + '</small><br/>';
    snippet += '<small><strong>Produtor:</strong> ' + rec.publisher + '</small><br/>';
    snippet += '<small><strong>Data</strong>: ' + rec.date + '</small>';
    snippet += links;
    snippet += '</div>';
    return snippet;
}

function clearCSWSearch() {
	$("#input-csw-search").val('');
	$('#cswProductListControls').hide();
	$('#div-results').html('');
	$('#table-csw-results').empty();
}

function search(startposition) {
	//$("#input-csw-search").val('');
	$('#table-csw-results').empty();
	$('#cswProductListControls').hide();
    $('#div-results').html('Pesquisando. Por favor, aguarde.');
    if (!startposition) {
        startposition = 1;
    }

    var bbox_enabled = $('#chk-csw-usebbox').is(':checked');
    //var sortby = $('#select-sortby option:selected').val();

    //typeName=gmd:MD_Metadata&outputSchema=http://www.isotc211.org/2005/gmd
    //data = '<csw:GetRecords maxRecords="' + pagesize + '" startPosition="' + startposition + '" outputFormat="application/xml" outputSchema="http://www.opengis.net/cat/csw/2.0.2" resultType="results" service="CSW" version="2.0.2"  xmlns:ogc="http://www.opengis.net/ogc" xmlns:csw="http://www.opengis.net/cat/csw/2.0.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><csw:Query typeNames="csw:Record"><csw:ElementSetName>full</csw:ElementSetName>';
    var data = '<csw:GetRecords maxRecords="' + pagesize + '" startPosition="' + startposition + '" outputFormat="application/xml" outputSchema="http://www.isotc211.org/2005/gmd" resultType="results" service="CSW" version="2.0.2" xsi:schemaLocation="http://www.opengis.net/cat/csw/2.0.2 http://schemas.opengis.net/csw/2.0.2/CSW-discovery.xsd" xmlns:ogc="http://www.opengis.net/ogc" xmlns:csw="http://www.opengis.net/cat/csw/2.0.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\
    <csw:Query typeNames="csw:Record"><csw:ElementSetName>full</csw:ElementSetName>';
     
    var cswFilters=0; //let's count the filters. If we have more than one I should use AND logical operator
    
    //spatial filter
    var qbbox='';
    if (bbox_enabled && map != null) {
        bounds = map.getView().calculateExtent();
        qbbox = '<ogc:BBOX><ogc:PropertyName>ows:BoundingBox</ogc:PropertyName><gml:Envelope xmlns:gml="http://www.opengis.net/gml"><gml:lowerCorner>' + bounds[1] + ' ' + bounds[0] + '</gml:lowerCorner><gml:upperCorner>' + bounds[3] + ' ' + bounds[2] + '</gml:upperCorner></gml:Envelope></ogc:BBOX>';
        cswFilters+=1;
    }
    //product type filter works only if the user has set it to work
    var productTypes=$("#csw-sel-tipoPCDG").val().split(',');
    var produtTypeFilter='';
	if ((productTypes.length>0) && (productTypes[0]!='')) { cswFilters+=1 }; //we have at least one productType, count this with the other filters
    if (productTypes.length>1) { produtTypeFilter+='<ogc:Or>';} // We have more than one possible productType. Let's use ogc:Or
    $(productTypes).each(function(index,productType) {
    	if (productType!='') {
    		produtTypeFilter+='<ogc:PropertyIsLike escapeChar="\\" singleChar="_" wildCard="%"><ogc:PropertyName>apiso:AnyText</ogc:PropertyName><ogc:Literal>%' + productType + '%</ogc:Literal></ogc:PropertyIsLike>';
    	}
    });
    if (productTypes.length>1) {produtTypeFilter+='</ogc:Or>';} //end of multiple productType
    
    //text filter
    var freetext = $('#input-csw-search').val().trim();
    var freeTextFilter = '';
    if (freetext != '') {
    	cswFilters+=1;
        freeTextFilter += '<ogc:PropertyIsLike escapeChar="\\" singleChar="_" wildCard="%"><ogc:PropertyName>apiso:AnyText</ogc:PropertyName><ogc:Literal>%' + $("#input-csw-search").val().trim() + '%</ogc:Literal></ogc:PropertyIsLike>';
    }
    var dateFilter1='';
    if($.trim($("#input-csw-datemin").val()).length>0) { // not zero-length string AFTER a trim
        cswFilters+=1;
        dateFilter1+='<ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyName>dc:date</ogc:PropertyName><ogc:Literal>' + $("#input-csw-datemin").val().trim() + '-01-01</ogc:Literal></ogc:PropertyIsGreaterThanOrEqualTo>';
    }
    var dateFilter2='';
    if($.trim($("#input-csw-datemax").val()).length>0) { // not zero-length string AFTER a trim
        cswFilters+=1;
        dateFilter2+='<ogc:PropertyIsLessThan><ogc:PropertyName>dc:date</ogc:PropertyName><ogc:Literal>' + $("#input-csw-datemax").val().trim() + '-12-31</ogc:Literal></ogc:PropertyIsLessThan>';
    }
    if($.trim($("#input-csw-datemax").val()).length>0) { // not zero-length string AFTER a trim
        cswFilters+=1;
        dateFilter2+='<ogc:PropertyIsLessThanOrEqualTo><ogc:PropertyName>dc:date</ogc:PropertyName><ogc:Literal>' + $("#input-csw-datemax").val().trim() + '-12-31</ogc:Literal></ogc:PropertyIsLessThanOrEqualTo>';
    }
    var scaleFilter='';
    if($.trim($("#input-csw-scale").val()).length>0) { // not zero-length string AFTER a trim
        cswFilters+=1;    	
    	var scaleOper=$("#csw-sel-scale-oper").val();
    	scaleFilter+='<ogc:'+scaleOper+'><ogc:PropertyName>apiso:Denominator</ogc:PropertyName><ogc:Literal>' + $("#input-csw-scale").val().trim() + '</ogc:Literal></ogc:'+scaleOper+'>';
    }
    
    
    if (cswFilters>0) data+='<csw:Constraint version="1.1.0"><ogc:Filter>'; //we have at least one filter. Let's add it to the query.
    if (cswFilters>1) data+='<ogc:And>'; //more than one filter, I should use AND logical operator
    data+=qbbox;
    data+=produtTypeFilter;
    data+=freeTextFilter;
    data+=dateFilter1;
    data+=dateFilter2;
    data+=scaleFilter;
    if (cswFilters>1) data+='</ogc:And>';
    if (cswFilters>0) data+='</ogc:Filter></csw:Constraint>';
    data+="<ogc:SortBy>    <ogc:SortProperty>        <ogc:PropertyName>apiso:Title</ogc:PropertyName>        <ogc:SortOrder>ASC</ogc:SortOrder>    </ogc:SortProperty>    </ogc:SortBy>";

    data += '</csw:Query></csw:GetRecords>';

    

    $.ajax({
        type: "post",
        url: csw_url,
        //contentType: "text/xml",
        data: data,
        dataType: "text",
        success: function(xml) {
            $('#table-csw-results').empty();
            //$('#cswProductList').toggle();
            //alert(xml);
            // derive results for paging
            var matched = parseInt($(xml).find(escapeElementName('csw:SearchResults')).attr('numberOfRecordsMatched'));
            var returned = parseInt($(xml).find(escapeElementName('csw:SearchResults')).attr('numberOfRecordsReturned'));
            var nextrecord = parseInt($(xml).find(escapeElementName('csw:SearchResults')).attr('nextRecord'));

            $('#input-startposition').val(startposition);
            $('#input-nextrecord').val(nextrecord);
            $('#input-matched').val(matched);

            if (matched == 0) {
                $('#div-results').html('');
                $('#table-csw-results').html('<tr><td>Nenhum produto atende aos filtros selecionados.</td></tr>');
                return;
            }
            if (nextrecord == 0 || nextrecord >= matched) { // at the end
                $('#li-next').attr('class', 'disabled');
                nextrecord = matched;
            }
            else {
                $('#li-next').attr('class', 'active');
            }
            if (startposition == 1) {
                $('#li-previous').attr('class', 'disabled');
            }
            else {
                $('#li-previous').attr('class', 'active');
            }

            $('#cswProductListControls').show();
            results = '<strong>Listando ' + startposition + '-' + (nextrecord-1) + ' de ' + matched + ' produtos(s) encontrados(s)</strong>';
            $('#div-results').html(results);

            if (! featureOverlay) {
            	featureOverlay= new ol.layer.Vector({
	                source: new ol.source.Vector(),
	                map: map,
	                style: new ol.style.Style({
	                  stroke: new ol.style.Stroke({
	                    color: '#f00',
	                    width: 1
	                  }),
	                  fill: new ol.style.Fill({
	                    color: 'rgba(50,0,0,0.1)'
	                  }),
	                  text: new ol.style.Text({
	                      font: '12px Calibri,sans-serif',
	                      fill: new ol.style.Fill({
	                        color: '#000'
	                      }),
	                      stroke: new ol.style.Stroke({
	                        color: '#fff',
	                        width: 3
	                      })
	                   })
	                })
            	});
            }
            featureOverlay.getSource().clear();
            
            $(escapeElementName('gmd:MD_Metadata'),xml).each(function(record) {
                var rec = new CswRecord($(this));
                $("#table-csw-results").append(style_record(rec));
                polygon = bbox2polygon(rec.bbox, rec.title+' '+rec.date);
                featureOverlay.getSource().addFeature(polygon);
            })
            map.addLayer(featureOverlay);
            
            $("#table-csw-results .btn").on('click', function(event) {
                if ($(this).attr("title")=='WWW:DOWNLOAD-1.0-http--download' && isMobile()) {
                    event.preventDefault();
                    var downloadModal = new mobileModal('mobileModal');
                    downloadModal.clear();
                    downloadModal.setHeader('Download de Produtos');
                    downloadModal.setText('Realizar downloads em dispositivo móvel poderá consumir uma quantidade significativa de dados. Deseja continuar?');
                    downloadModal.addCloseButton();
                    downloadModal.setLinkButton('Continuar', 'btn-primary', 'confirmDownload', $(this).attr("href"));
                    sidebar.close();
                    downloadModal.showModal();
                }
            });
            
        },
        error:  function( jqXHR, textStatus, errorThrown ) {
        	$("#div-results").html("Erro ao processar requisição: "+ errorThrown);
        }
    });
      

}
$(document).ready(function(){
    // init the map
    polygon_layer = null;
    // handle CSW searches
    $("#input-csw-search").keypress(function (e) {
        if (e.keyCode == 13) { // Enter key pressed, but not submitting the form to a page refresh
            search();
            return false;
        }
    });
    $('#btn-csw-search').click(function(event){
    	search();
    });
    
    $('#inputMoreFilters').click(function(event) {
    	$("#moreFiltersDiv").toggle();
    });
    
    $('#btn-csw-previous').click(function(event){
        event.preventDefault(); 
        startposition2 = $('#input-startposition').val()-pagesize;
        if (startposition2 < 1) {
            return;
        }
        search(startposition2);
    }); 
    $('#btn-csw-next').click(function(event){
        event.preventDefault(); 
        nextrecord2 = parseInt($('#input-nextrecord').val());
        matched2 = parseInt($('#input-matched').val());
        if (nextrecord2 == 0 || nextrecord2>=matched2) {
            return;
        }
        search(nextrecord2);
    }); 
    $("table").on("click", "span", function(event) { //this is not doing anything. I'm saving this code for the time that we will need to load a wms layer for the clicked product.
        var tokens = $(this).attr('id').split('##');
        var getmap = tokens[0].split('?');
        var url = getmap[0];
        var getmap_kvp = getmap[1].split('&');;
        for (var i = 0; i < getmap_kvp.length; i++) {
            var temp = getmap_kvp[i].toLowerCase();
            if (temp.search('layers') != -1) {
                var kvp = getmap_kvp[i].split('=');
                var layer_name = kvp[1];
            }
        }

        for (var prop in map_layers_control._layers) {
            if (url == map_layers_control._layers[prop].layer._url && tokens[1] == map_layers_control._layers[prop].name) {
                return;
            }
        }

        var layer = L.tileLayer.wms(url, {
            layers: layer_name,
            format: 'image/png',
            transparent: true,
        });
        map_layers_control.addOverlay(layer, tokens[1]);
        map.addLayer(layer);
    }); 
    $("table").on("mouseenter", "td", function(event) {
        bbox = $(this).find('[id]').attr('id');
        if (polygon_layer != null && map.hasLayer(polygon_layer)) {
            map.removeLayer(polygon_layer);
        }
        if ($('#input-footprints').is(':checked')) {
            if (bbox != undefined) {
                polygon_layer = bbox2polygon(bbox);
                map.addLayer(polygon_layer);
            }
        }
    });
    
    $("#btn-csw-clear-search").click(function(event){
    	clearCSWSearch();
    	featureOverlay.getSource().clear();
    	featureOverlay=null;
    	map.removeLayer(featureOverlay);
    });

});
