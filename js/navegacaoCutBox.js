

function CutBoxTool(buttonTagId, map, modalTag) {
    //Chama a heranca do pai
    NavTool.call(this, buttonTagId, map);
    
    this.dragBox = new ol.interaction.DragBox();
    this.modalTag = modalTag;
    this.featureLimit=10000;
    this.metersPerDegree=111320.;
    this.pixelsPerImage=24576.;
    this.wcsCRS = "EPSG:4674";
    this.downloadWFSFileName = "Recorte.gml";
    this.downloadWCSFileName = "Recorte.tif";
    var cutboxtool=this;    
    this.firstTimeInSession = true;
    this.flag=false;
    this.activeTool = false;
    this.abortController = null;
    //Quando clicado no botão, inicia-se a função abaixo
    $(buttonTagId).click(function () { 
        cutboxtool.runTool('copy');        
    });
    
    //Ativa a função de cancelar a cutbox quando a sidebar é aberta
    $('.sidebar-tabs ul li a').on('click', function(event) {
        if ('#'+event.delegateTarget.id!=cutboxtool.buttonId && event.delegateTarget.attributes['role'].value!='button') {
            cutboxtool.cleanUp();
        } else if ('#'+event.delegateTarget.id!=cutboxtool.buttonId && event.delegateTarget.attributes['role'].value=='button') {
            cutboxtool.map.removeInteraction(cutboxtool.dragBox);
            $(cutboxtool.buttonId).parent().removeClass('active');
            $("#"+cutboxtool.modalTag).off();
        }
    });
}


CutBoxTool.prototype.boxend= function(evt) {
    // features that intersect the box are added to the collection of selected features
    //Armazena a extensão da dragbox
    var cutbox=this;
    var extent = cutbox.dragBox.getGeometry().getExtent();
    // Variáveis para controlar o tamanho máximo do request
    // Receber futuramente do GetCapabilities
    //Inicializa a variável de número limite de feições
    var maxWFSFeatures;
    //var maxWCSSize;
    
    //Cria o modal de fim de seleção
    var modal2 = new mobileModal(cutbox.modalTag);
    //Insere os comboboxes de seleção de camada e a opção de texto de aviso
    var text = '<select class="form-control" id="cutToolDropdownLayers"><option>Escolha a camada</option>';        
    text += '</select></br><p id="layerInfo"></p><p class="text-danger" id="sizeLimitWarning"></p>';//<p>A área selecionada da camada '+layerName+' possui '+chosenLayerCount+' feições.</p>S</br></br>';
    // Adiciona ao modal outro combobox para as resoluções
    text += '<select class="form-control" id="cutToolDropdownResolutions"><option>Escolha a resolução</option></select>';        

    //Limpa o modal antigo
    modal2.clear();
    //Reescreve os parâmetros 
    modal2.setHeader("Ferramenta de Corte");
    modal2.setText(text);//++extent)


    //Esconde as resoluções
    $('#cutToolDropdownResolutions').hide();
    
    //Para cada camada fazer:
    $.each( nodeLayermap, function( layerIndex, layer ) {
        //Armazena os dados das camadas dos nós árvore na variável layerNode
        var layerNode = $('#treeview-selectable').treeview('getNode', layerIndex);
        //Recebe da layerNode os nomes das camadas e urls dos serviços conforme configuração da árvore
        var wfsLayer = layerNode.layerwfs;
        var wfsUrl = layerNode.urlwfs;
        var wcsLayer = layerNode.layerwcs;
        var wcsUrl = layerNode.urlwcs;
        
        //Testa a presença dos dados da árvore para wfs ou wcs
        if (wfsLayer != '' && wfsUrl != '') {
            //Processa o request do WFS e armazena a quantidade de feições e o link para download na tag
            cutbox.wfsRequestProcessing(maxWFSFeatures, wfsLayer, wfsUrl, extent, layerIndex);
        }
        
        if (wcsLayer != '' && wcsUrl != '') {
            cutbox.wcsRequestProcessing(wcsLayer, wcsUrl, extent, layerIndex);                
        }            
                    
        });          

    //Ao se alterar a opção selecionada da combobox fazer:
    $("#cutToolDropdownLayers").change(function() {
        //Adquirir o Id da camada selecionada
        var layerID = $(this).children(":selected").attr("id");
        var layerName = $("#"+layerID).text();
        
        //Testar se a camada selecionada é WCS ou WFS a partir do nome dela na seleção
        if (layerName.split(":")[0]=="Vetorial") {
            //Esconde as resoluções
            $('#cutToolDropdownResolutions').hide();
            //Armazena na variável count o atributo da tag daquela camada com a quantidade de feições
            var count = $("#"+layerID).attr("count");
            //Adiciona na parte de informação do modal o número de feições selecionadas
            $("#layerInfo").html('Quantidade de Feições Selecionadas: '+count);
            $('#layerInfo').show();
            //Testa se a variável maxWFSFeatures foi preenchido previamente
            if (maxWFSFeatures) {                
            } else {
                //Se não estiver preenchido, copia para ele o valor limite definido na classe
                maxWFSFeatures = cutbox.featureLimit;                
            }
            //Se a contagem de feições for maior que esse limite, avisa ao usuário e o permite fazer nova seleção
            if (Number(count)>maxWFSFeatures) {
                $("#sizeLimitWarning").html('Acima do limite de feições. Favor escolher menos feições.');
                $("#cutboxDownloadButton").html('Refazer'); 
                $("#cutboxDownloadButton").attr('href', "#");
                $("#cutboxDownloadButton").removeAttr('target');
                $("#cutboxDownloadButton").off();                    
                $("#cutboxDownloadButton").on('click', function() {
                    cutbox.cleanUp();
                    $(modal2.tagId).modal('hide');
                    cutbox.startDragBox();
                });
            } else {
                //Sugere download ao navegador
                $("#cutboxDownloadButton").attr('download', cutbox.downloadWFSFileName);
                //Adiciona ao botão o link para download das feições da camada selecionada
                downloadLink = $("#"+layerID).attr("downLink");
                fixIfHttps(downloadLink);
                $("#cutboxDownloadButton").attr('href', downloadLink);   
                //$("#cutboxDownloadButton").on('click', function() {
                //    cutbox.fetchCutResponse();
                //});
            }
            
            
        } else {
            //Cria o combobox de resoluções
            var index= layerID.substring("selectLayer".length);
            cutbox.createResolutionsBox(index);
            //Esconde informações de camadas vetoriais
            $('#layerInfo').hide();
            //Esconde as resoluções
            $('#cutToolDropdownResolutions').show();
            //Testa se existe pelo menos a opção de 2000 metros por pixel, se não, permite refazer a seleção
            if ($("#cutToolDropdownResolutions").has('option').length == 0) {
                $("#sizeLimitWarning").html('Acima do limite de tamanho. Favor escolher uma área menor.');
                $("#cutboxDownloadButton").html('Refazer');
                $("#cutboxDownloadButton").attr('href', "javascript:void(0)");
                $("#cutboxDownloadButton").removeAttr('target');                    
                $("#cutboxDownloadButton").off();
                $("#cutboxDownloadButton").on('click', function() {
                    cutbox.cleanUp();
                    $(modal2.tagId).modal('hide');
                    cutbox.startDragBox();
                    $('#map').css('cursor', 'copy');
                });
            } else {
                //Sugere download ao navegador
                $("#cutboxDownloadButton").attr('download', cutbox.downloadWCSFileName);
                //Adiciona ao botão o link para download das feições da camada selecionada
                downloadLink = $("#"+layerID).attr("downLink");
                $('a#someID').attr({target: '_blank', 
                    href  : 'http://localhost/directory/file.pdf'});
                $("#cutboxDownloadButton").attr({target: '_blank','href': 'downloadLink'});
                /*$("#cutboxDownloadButton").on('click', function() {
                    downloadLink = $("#"+layerID).attr("downLink");
                    cutbox.fetchCutResponse(downloadLink);
                });*/
            }
            //Ao alterar a resolução selecionada, fazer:
            $("#cutToolDropdownResolutions").change(function() {
                var res = $(this).children(":selected").attr("res");
                var downloadLink = $("#"+layerID).attr("downLink");
                fixIfHttps(downloadLink);
                var dl= downloadLink.replace(/resx.+&resy/, "resx="+res+"&resy").replace(/resy.+&format/, "resy="+res+"&format")
                $("#"+layerID).attr("downLink",dl);
                $("#cutboxDownloadButton").attr('href', dl);                
            });  
            
        }       
        
    });
    

    
    //Ativa a função de limpar o modal quando ele é escondido
    $("#"+cutbox.modalTag).on('hidden.bs.modal', function (){
        if (cutbox.abortController!=null){
            cutbox.abortController.abort();
        }
        cutbox.cleanUp();
    });  

    
    modal2.setLinkButton('Baixar', "btn-primary", "cutboxDownloadButton", $("#cutboxDownloadButton").attr('href'), function () { 
        //$(modal2.tagId).modal('hide');            
    });
    modal2.addCloseButton(); 
    $("#cutboxDownloadButton").attr('target', '_blank');
    modal2.showModal(); 
}

//Função iniciada ao se clicar continuar no modal de início da ferreamenta  
CutBoxTool.prototype.startDragBox= function() {
    // a DragBox interaction used to select features by drawing boxes

    //Verifica se a ferramenta já está ativa
    if (this.activeTool) return;
    
    //Inicializa a interação do dragbox
    this.map.addInteraction(this.dragBox);
    this.activeTool = true;
    //Armazena o objeto na variável cutbox
    var cutbox=this;
    //Ao finalizar a dragbox fazer:
    this.dragBox.on('boxend', cutbox.boxend, this);
    
}


//Função para fechar o modal e limpar seus eventos
CutBoxTool.prototype.cleanUp  = function() {
    //Chama a funcao do pai
    NavTool.prototype.cleanUp.call(this);
    var cutbox=this;
    cutbox.dragBox.un('boxend', cutbox.boxend, this);
    this.activeTool = false;
    this.map.removeInteraction(this.dragBox);
    delete this.dragbox;
    this.dragbox = new ol.interaction.DragBox();
    $(this.buttonId).parent().removeClass('active');
    $("#"+this.modalTag).off();
    cutbox.abortController=null;
}

//Funcao que inicia a ferramenta após clique no botao
CutBoxTool.prototype.runTool = function(pointer) {
    //Chama a funcao do pai
    NavTool.prototype.runTool.call(this, pointer);
    
    //Armazena o objeto na variável
    var cutbox = this;
    
    //Torna o botão ativo
    $(this.buttonId).parent().addClass('active');
    //Cria o modal de início da ferramenta se for a primeira vez
    if (this.firstTimeInSession == true) {
        this.firstTimeInSession = false;
        var modal1 = new mobileModal(this.modalTag);   
        modal1.clear();
        modal1.setHeader("Ferramenta de Corte");
        modal1.setText("Clique e arraste sobre a área de interesse.");
        modal1.setButton("Continuar", "btn-primary", "cutboxCutButton", function () {
            //Removendo o evento de limpar ao fechar antes de continuar
            $("#"+cutbox.modalTag).off('hidden.bs.modal');
            //fechando a janela
            $(modal1.tagId).modal('hide');
            cutbox.startDragBox();
        });
        modal1.setButton("Cancelar", "btn-secondary", "cancelButton", function() {
            $(modal1.tagId).modal('hide');
            $(this.buttonId).parent().removeClass('active');
        });
        //Ativa a função de limpar o modal quando ele é escondido
        $("#"+cutbox.modalTag).on('hidden.bs.modal', function (){
            cutbox.cleanUp();
        });  
        
        //Apresenta o modal gerado acima
        modal1.showModal();
    } else {
        this.startDragBox(); //Apenas inicia a dragbox caso não seja a primeira vez
    }
    
}


CutBoxTool.prototype.wfsRequestProcessing = function(maxWFSFeatures, wfsLayer, wfsUrl, extent, layerIndex) {
    var layerName = getNameByLayerNumber(layerIndex);
    var countUrl = wfsUrl+'?service=wfs&request=GetFeature&typeName='+wfsLayer+'&version=1.1.0&resultType=hits&bbox='; //'http://localhost/cgi-bin/geoportal
    countUrl += extent[0]+','+extent[1]+','+extent[2]+','+extent[3];
    fixIfHttps(countUrl);

    if (countUrl) {
        $.ajax({
            url: countUrl, 
            type: "GET",
            dataType: "xml",
            success: function( data, textStatus, jqXHR) {
                if (jqXHR.getResponseHeader('Content-Type').includes("text/xml")) {                                
                    var featureCount=$(data).find('wfs\\:FeatureCollection').first().attr("numberOfFeatures");
                    if (Number(featureCount)>0) {
                        $("#cutToolDropdownLayers").append('<option id="selectLayer'+layerIndex+'">Vetorial: '+layerName+'</option>');
                        $("#selectLayer"+layerIndex).attr({"count": featureCount, "downLink": countUrl.replace('hits', 'results')});
                    }                                                        
                }
            },
            error: function( data, textStatus, jqXHR) {
                //Caso seja extrapolado o tempo de resposta, a mensagem a seguir aparecerá
                $("#layerInfo").html("Devido à grande extensão solicitada, algumas camadas vetoriais podem estar indisponíveis.");                    
            },
            //timeout : 1000 //Um segundo para desistir de contar
        });
    }                  
           

}

CutBoxTool.prototype.wcsRequestProcessing = function(wcsLayer, wcsUrl, extent, layerIndex) {
    var layerName = getNameByLayerNumber(layerIndex);
    $("#cutToolDropdownLayers").append('<option id="selectLayer'+layerIndex+'">Matricial: '+layerName+'</option>');
                    
    var maxDegreeSize;
    //var responseHeight;
    //var responseWidth;
    if ((extent[3] - extent[1]) >= (extent[2] - extent[0])) {
        maxDegreeSize = extent[3] - extent[1];
        //responseHeight = 4096;
        //responseWidth = Math.round(4096*(extent[2] - extent[0])/(extent[3] - extent[1]));
    } else {
        maxDegreeSize = extent[2] - extent[0];
        //responseWidth = 4096;
        //responseHeight = Math.round(4096*(extent[3] - extent[1])/(extent[2] - extent[0]));            
    }
    var maxResolution = maxDegreeSize*this.metersPerDegree/this.pixelsPerImage; //110km por grau, 32768 pixels: metros por pixel
    
    $("#selectLayer"+layerIndex).attr("maxResolution", maxResolution);
    
    var downUrl = wcsUrl+'?service=wcs&request=GetCoverage&coverage='+wcsLayer+'&version=1.0.0&crs='+this.wcsCRS+'&bbox=';
    downUrl += extent[0]+','+extent[1]+','+extent[2]+','+extent[3]+'&resx=0.02&resy=0.02&format=GTiff';
    fixIfHttps(downUrl);
    $("#selectLayer"+layerIndex).attr({"downLink": downUrl});

}

CutBoxTool.prototype.createResolutionsBox = function(layerIndex) {
    //Salva o escopo
    var tool = this;
    //Cria array de resoluções possíveis
    var resolutions = [2000, 1000, 500, 250, 100, 50, 25, 10, 5, 2.5, 1, 0.5];
    //Pega o valor max de resolução armazenado no id
    var maxResolution = $("#selectLayer"+layerIndex).attr("maxResolution");
    //Limpa as resoluções
    $("#cutToolDropdownResolutions").empty();
    $("#cutToolDropdownResolutions").append('<option res="'+(2000/tool.metersPerDegree).toFixed(10)+'">Escolha a resolução</option>');
    //Testa dentro da array quais resoluções devem aparecer de acordo com a área selecionada
    resolutions.forEach ( function(res) {            
        if (res > maxResolution) {
            var degRes = res/tool.metersPerDegree;            
            $("#cutToolDropdownResolutions").append('<option res="'+degRes.toFixed(10)+'">'+res+' metros</option>');
            //$("#selectResolution"+stringRes).attr("res", res);
        } 
    });
}

CutBoxTool.prototype.fetchCutResponse = function(url) {
    
    var cutbox = this;
    
    //Cria modal que avisa de processamento
    var modalProc = new mobileModal(cutbox.modalTag);
    modalProc.clear();
    modalProc.setHeader("Ferramenta de recorte");
    modalProc.setText("Recorte sendo processado. Este processo pode demorar alguns minutos. Favor aguardar.");
    modalProc.showModal();
    cutbox.abortController=new AbortController();
    fetch(url, {
        credentials: 'same-origin',
        method: 'GET',
        signal: cutbox.abortController.signal,
    })
        .then(function(response) {
            if(response.ok) {            
                return response;
            } else {
                return None;
            }
        })
        .then(response => response.blob())
        .then(blob => {
            var a = document.createElement("a");
            document.body.appendChild(a);
            a.style = "display: none";
            var url = window.URL.createObjectURL(blob);
            a.href = url;
            if(blob.type == 'image/tiff') {
                a.download = cutbox.downloadWCSFileName;
            } else {
                a.download = cutbox.downloadWFSFileName;
            }
            a.click();
            
            //Fecha modal do processamento ao fim do mesmo
            $(modalProc.tagId).modal('hide');
            modalProc.clear();
            
        });       
        
    
        
}

 
  
//Inicializa um objeto da classe
cutBoxObj = new CutBoxTool('#cutToolButton', map, 'mobileModal');
