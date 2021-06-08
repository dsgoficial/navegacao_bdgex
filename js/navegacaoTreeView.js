
/*! Returns the tree structure (json) to create the layer tree on javascript. Every object should have text, layerName and url properties.*/

/*! This is the tree object with it's events. Data is defined on getTree() */
var $layerTree;
var simplifiedId="1";
const treeUrl = "arvore.json";


/*!Selecting default layers, the order here should represent the drawing order.*/
//var defaultVisibleLayers=['Mapa mundi', 'Estados', 'Capitais', 'Mosaico de cartas topográficas de várias escalas'];

function setDefaultVisibleLayers(){
	var enabledNodes=$('#treeview-selectable').treeview('getEnabled');
    enabledNodes.forEach(function (enabledNode, i) {
        if (enabledNode.beginSelected==true){
        	$('#treeview-selectable').treeview('selectNode', enabledNode.nodeId);
        }
    });
    /*defaultVisibleLayers.forEach(function (nodeText) {
        var visibleLayer=$layerTree.treeview('search', [nodeText, {revealResults: false}]);
        $layerTree.treeview('selectNode',visibleLayer[0].nodeId);
        $layerTree.treeview('revealNode',visibleLayer[0].nodeId);
    });*/
}

var removeTreeView= function() {
    $.each(nodeLayermap, function (nodeId, val) {
        $('#treeview-selectable').treeview('unselectNode', Number(nodeId));
    });
    $('#treeview-selectable').treeview('remove');    
    nodeLayermap={};
    map.removeEventListener('moveend');
}

var reloadTreeView= function(treeJsonData) {
    removeTreeView();
    onGetTreeResponse(treeJsonData);
}



function onGetTreeResponse(treeJsonData) {
	//I must save the current URL variables because I'm going to ruin them when I change the tree
    var urlVars=getUrlVars();
    $layerTree=$('#treeview-selectable').treeview({
    data: treeJsonData,
    multiSelect: true,
    selectedBackColor: "rgba(1,66,11, 0.2)",
    selectedColor: "rgba(1,66,11, 1)",                                              
    emptyIcon: "glyphicon glyphicon-eye-open",
    searchResultColor: "#6b9bea",
    collapseIcon: "glyphicon glyphicon-folder-open",
    expandIcon: "glyphicon glyphicon-folder-close",
    onNodeSelected: function(event, node) {
        app.newMapLayer(node.text, node.layerName, node.url, node.nodeId, node.type);
        getTreeStateString();
    },
    onNodeUnselected: function (event, node) {
        app.removeMapLayer(node.nodeId);
        getTreeStateString();
    }

    });
    setDefaultVisibleLayers();
    //urlVars ruined
    //now if there was something usefull on the vars, use it
    setTreeStateString(urlVars); 
    map.on('moveend', function(e) {
        getTreeStateString();
    });
    
};

function loadTreeFromJSONURL(jsonURL) {
	$.getJSON(jsonURL, function(result){
		loadTreeFromJSON(result);
	});
}

function loadTreeFromJSON(treeJSON) {
	onGetTreeResponse(treeJSON);
}


function toggleSimplified(urlVars='') {
    var fromPermalink=true;
    if (urlVars==''){
        urlVars=getUrlVars();
        fromPermalink=false;
    }
    if (!$("#adv-button").hasClass("active")) {
        var subTree=null;
        var layersIDCG
        if (!('l' in urlVars)) {
            layersIDCG=[];
        } else {
            layersIDCG=urlVars['l'].split(',');
        }
        for (var i=0; i< treeJson.length;i++){
            if (treeJson[i].idcg_arvore==simplifiedId){ //the tree was found in our json
                //let's see if every layer from urlVars is available on the tree
                subTree=treeJson[i];
                var deepSearch=function(node) {
                    if (node.nodes) {
                        for (var j=0; j<node.nodes.length;j+=1) {
                            deepSearch(node.nodes[j]);
                        }
                    } else {
                        var itemIndex=layersIDCG.indexOf(node.idcg_arvore.toString());
                        if (itemIndex>=0) {
                            layersIDCG.splice(itemIndex,1);
                        }
                    };
                }
                deepSearch(subTree);
            }
        }
        if (subTree==null) { //if i didn't find the default simplified folder, let's use the first one.
            subTree=treeJson[0];
        }
        if ((layersIDCG.length>0) && (fromPermalink==true) ) { //I couldn't load every layer on the URL using the simplified tree
        } else {
            reloadTreeView([subTree]);
            if (fromPermalink==true){
                $('#advCheckBox').prop('checked', true);
                $('#advCheckBox').trigger("change");        
            }
        }
    } else {
        reloadTreeView(treeJson);
    }
    $("#search-layers").toggle();
    setTreeStateString(urlVars); 
}

/*! Search function to collapse the tree and highlight searched layers.*/
var treeSearch = function(e) {
	
	var pattern = $('#input-search').val();
	if (pattern.length>2) { //begin search with 3 digits
		var options = {
			ignoreCase: true,
		    exactMatch: false,
		    revealResults: true
		};
		var results = $layerTree.treeview('search', [ pattern, options ]);
		$layerTree.treeview('collapseAll');
        //$layerTree.treeview('disableAll', { silent: true });
		$.each(results, function (index, result) {
			$layerTree.treeview('revealNode',result.nodeId);
		});
	} else {
		$layerTree.treeview('clearSearch');
	}
}



function clearSearch() {
    $layerTree.treeview('clearSearch');
    $('#input-search').val('');
    $('#search-output').html('');
}

//Aba de ordenação de camadas

function syncMapWithDrawingOrder() {
    var nlayers=$('#layerDrawingOrder  li').length;
	$('#layerDrawingOrder  li').each(function(i, obj) {
        layerIndex=getLayerIndexFromId(obj.id);
        nodeLayermap[layerIndex].setZIndex(nlayers-i);
	});
}

var sortable = Sortable.create(document.getElementById('layerDrawingOrder'), 
{animation: 150, // ms, animation speed moving items when sorting, `0` — without animation
	onSort: function(evt) {
        syncMapWithDrawingOrder();
    },
    filter: '.transparencySliders',
    preventOnFilter: false
});



function getTreeStateString() {
    var enabledNodes=$('#treeview-selectable').treeview('getSelected');
    //Creating the array of enabled layers
    var l="";
    //enabledNodes.forEach(function (enabledNode, i) {
        //if (l.length>0){ l+=','}        
        //l+=enabledNode.idcg_arvore;
        //'idcg_arvore'
    //});
    var nlayers=$('#layerDrawingOrder  li').length;
	$('#layerDrawingOrder  li').each(function(i, obj) {
        layerIndex=getLayerIndexFromId(obj.id);
        var layerNode = $('#treeview-selectable').treeview('getNode', layerIndex);
        if (l.length>0){ 
            l+=',';
        };        
        l+=layerNode.idcg_arvore;
	});    
    if (l) {l="l="+l;};
    center='c='+map.getView().getCenter()[0].toFixed(6)+','+map.getView().getCenter()[1].toFixed(6);
    zoom='z='+map.getView().getZoom();
    var baseUrl=getBaseURL();
    
    if (history.pushState) {
    	window.history.pushState({}, 'BDGEx Mobile', baseUrl+"?"+l+'&'+center+'&'+zoom);
    } 
    //window.location.href=baseUrl+"?"+l+'&'+center+'&'+zoom;
    return baseUrl+"?"+l+'&'+center+'&'+zoom;
    //window.prompt("Link permanente",);
}

function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(window.location.hash,"").replace(/[?&]+([^=&]+)=([^&]*)/gi,    
    function(m,key,value) {
      vars[key] = value;
    });
    return vars;
}

function setTreeStateString(urlVars) {
    //reads parameters on the url
    //setting the center if it was passed
    if ('c' in urlVars) {
        center=urlVars['c'].split(',');
        map.getView().setCenter([parseFloat(center[0]), parseFloat(center[1]) ]);
    }
    //setting zoom level if it was passed
    if ('z' in urlVars) {
        zoomLevel=urlVars['z'];
        map.getView().setZoom(zoomLevel);
    }
    //setting layers if they were passed
    if ('l' in urlVars) {
        var layersIDCG=urlVars['l'].split(',');
        if (layersIDCG.length==0) return;
        var igcgToNodeMap=getLayerIndexFromIDCGArvore();
        var layersIndexes=layersIDCG.map(function(e) {
            return igcgToNodeMap[e];
        } );
        layersIndexes=layersIndexes.reverse();
        //deselecting everything
        var enabledNodes=$('#treeview-selectable').treeview('getSelected');
        enabledNodes.forEach(function (enabledNode, i) {
            $('#treeview-selectable').treeview('unselectNode', enabledNode);
        });
        //selecting what was requested
        layersIndexes.forEach(function(layerIndex,i) {
            if (typeof layerIndex !== 'undefined'){
                $('#treeview-selectable').treeview('selectNode', layerIndex);
            }
        });
    }
}

var treeJson;
function fetchTreeJSON(url) {
    var urlVars=getUrlVars();
    var head = new Headers();
    head.append('pragma', 'no-cache');
    head.append('cache-control', 'no-cache');
    fetch(url, {
        credentials: 'same-origin',        
        method: 'GET',
        headers: head,
        cache: 'reload',
    })
    .then(function(response){
        response.json().then(function(data){
            treeJson = data;
            loadTreeFromJSON(treeJson);
            toggleSimplified(urlVars); //passing urlvars so the function can detect if I received any layers on the URL
        });
    });
}


$(document).ready(function() { 

	$('#permalinkButton').click(function () {
	    $("#permalinkInput").val(getTreeStateString());
	});
	
	/*! Search button events. */
	$('#btn-search').on('click', treeSearch);
	$('#input-search').on('keyup', treeSearch);
	
	$('#btn-clear-search').on('click', function (e) {
		clearSearch();
	});
    
    $('#adv-button').on('click', function (e) {
		toggleSimplified();
        sidebar.openLast();
	});
    
    //treeJson=JSON.parse($('#treeJsonDiv').html());
    fetchTreeJSON(treeUrl);
    //subtree=treeJson.find(
	
        
});
//setTreeStateString([15,14,11,10],[-47.47096010859324,-15.655421797022008],6);
