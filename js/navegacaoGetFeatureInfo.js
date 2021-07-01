//GetFeatureInfo

function GetFeatureInfoTool (buttonTagId, map, infoId) {
    //Chamar funcao pai
    NavTool.call(this, buttonTagId, map);
    
    this.singleClickEvent=null;
    this.infoId = infoId;
    this.sidebarCall = "getfeatureinfo";
    
    var infoTool = this;

    $(this.buttonId).click(function () {        
        infoTool.runTool('help');
    });
    
}

GetFeatureInfoTool.prototype.cleanUp = function() {
    //Chama a funcao do pai
    NavTool.prototype.cleanUp.call(this);
    //clean up getfeatureinfo event
    this.singleClickEvent=null;
    cleanPrevisao();
}

GetFeatureInfoTool.prototype.runTool = function(pointer) {
    //Chama a funcao do pai
    NavTool.prototype.runTool.call(this, pointer);
    
    //Armazena o objeto em variavel
    var infoTool = this;
    
    $(infoTool.buttonId).parent().addClass('active');
    if (infoTool.singleClickEvent==null) {
        infoTool.singleClickEvent=map.once('singleclick', function(evt) {
            $(infoTool.infoId).html('');
            var view = map.getView();
            var viewResolution = /** @type {number} */ (view.getResolution());
            var layerList=map.getLayers();
            var nRequestedLayers=0;
            $.each( nodeLayermap, function( layerIndex, layer ) {
            //nodeLayermap.forEach(function (layerItem, i) {
                var layerSource=layer.getSource();
                var layerName=getNameByLayerNumber(layerIndex);
                //var url=getLayerNode(layerIndex);
                var layerNode = $('#treeview-selectable').treeview('getNode', layerIndex);
                if (layerNode.getFeatureInfoURL!='') {
                    var url = layerSource.getGetFeatureInfoUrl(
                        evt.coordinate, viewResolution, 'EPSG:4326',
                        {'INFO_FORMAT': 'text/html'});
                    
                    if (url) {
                        var url=url.replace(fixIfHttps(layerNode.url),fixIfHttps(layerNode.getFeatureInfoURL));
                        $.ajax({
                            url: url, 
                            type: "GET",
                            dataType: "html",
                            success: function( data, textStatus, jqXHR) {
                                if ( jqXHR.getResponseHeader('Content-Type')=="text/html"  ) {
                                    $(infoTool.infoId).append("Camada:"+layerName+'<br><table class="getfeatureinfo-table">'+data+"</table><br>");
                                }
                            }
                            
                        });
                        nRequestedLayers+=1;
                    }     
                }
            });
            sidebar.open(infoTool.sidebarCall); //#window.location.href = ";
            //There were no layers with getFeatureInfoURL defined on the server.
            if (nRequestedLayers==0) {
                $(infoTool.infoId).append("Nenhuma camada habilitada para obter informações.");
            }
            infoTool.cleanUp();
        });
    } else {
        infoTool.cleanUp();
    }
}

getFeatureInfoObj = new GetFeatureInfoTool('#getFeatureInfoButton', map, '#GetFeatureInfoResult');

function getMetarTaf(code, option) {
    let url = null;
    let id = null;
    if (option){
        url = "https://api-redemet.decea.mil.br/mensagens/"+option+"/"+code+"?api_key=qYPX2ISDRkKauphMyxlYbN8sQQwGyh4RII7R248S";
        id = '#'+option+'Msg';
    }
    
    $.getJSON(url, function(response){
      if (response['data']['data'].length === 0){
        $(id).text("Mensagem não disponível");
      } else {
        $(id).text(response["data"]["data"][0]["mens"]);
      }
    });
    
}

function getPrevisao(code) {
    let url = "https://apiprevmet3.inmet.gov.br/previsao/"+code;
    let id = '#previsaoResult';
    cleanPrevisao();
        
    $.getJSON(url, function(previsao){
            var dias = ["Atributo", "D (manha)", "D (tarde)", "D (noite)", "D+1 (manha)", "D+1 (tarde)", "D+1 (noite)", "D+2", "D+3", "D+4"]
            var attributes = {
              "Icone": "icone",
              "UF": "uf",
              "Cidade": "entidade",
              "Dia": "",
              "Resumo": "resumo",
              "Temp max": "temp_max",
              "Temp min": "temp_min",
              "Dir vento": "dir_vento",
              "Int vento": "int_vento",
              "Umidade Max": "umidade_max",
              "Umidade Min": "umidade_min",
              "Tendencia Temp Max": "temp_max_tende",
              "Tendencia Temp Min": "temp_min_tende",
              "Nascer": "nascer",
              "Ocaso": "ocaso",
              "Lua": "",
            };

            //Create a HTML Table element for the future weather.
            if (document.getElementById('table_future')) {
                var table_future = document.getElementById('table_future');
                table_future.innerHTML = '';
            } else {                
                var table_future = document.createElement("TABLE");
                table_future.setAttribute("id", "table_future");
                table_future.border = "1";
            }
            
            //Add the header row.
            var row = table_future.insertRow(-1);
            for (var i = 0; i < dias.length; i++) {
              var headerCell = document.createElement("TH");
              headerCell.innerHTML = dias[i];
              row.appendChild(headerCell);
            }
            
            var datas = []

            //Add the data rows.
            for (var key in attributes) {
              row = table_future.insertRow(-1);
              var cell = row.insertCell(-1);
              cell.innerHTML = key;
              cell.innerHTML = '<b>' + cell.innerHTML + '</b>';
              var geocode = Object.keys(previsao)[0];
              for (var i = 0; i < Object.keys(previsao[geocode]).length; i++) {
                var dia = Object.keys(previsao[geocode])[i];
                if (datas.indexOf(dia) === -1){
                  datas.push(dia)
                }
                if (i === 0 || i === 1) {
                  for (var j = 0; j < Object.keys(previsao[geocode][dia]).length; j++) {
                    var turno = Object.keys(previsao[geocode][dia])[j];
                    if (key === "Icone") {
                      var cell = row.insertCell(-1);
                      var img = document.createElement('img');
                      img.src = previsao[geocode][dia][turno][attributes[key]];
                      cell.appendChild(img);
                    } else if (key === 'Dia') {
                      var cell = row.insertCell(-1);
                      cell.innerHTML = dia;
                    } else if (key === 'Lua' && j === 0) {
                      var cell = row.insertCell(-1);
                      cell.colSpan = 3;
                      cell.innerHTML = getMoonPhase(dia);
                    } else if (key === 'Lua' && (j === 1 || j === 2)) {
                      continue;
                    } else {
                      var cell = row.insertCell(-1);
                      cell.innerHTML = previsao[geocode][dia][turno][attributes[key]];
                    }
                  }
                } else {
                  var cell = row.insertCell(-1);
                  if (key === "Icone") {
                    var img = document.createElement('img');
                    img.src = previsao[geocode][dia][attributes[key]];
                    cell.appendChild(img);
                  } else if (key === "Dia") {
                    cell.innerHTML = dia;
                  } else if (key === 'Lua') {
                    cell.innerHTML = getMoonPhase(dia);
                  }else {
                    cell.innerHTML = previsao[geocode][dia][attributes[key]];
                  }
                }
              }
            }
            
            getTwilight(datas, table_future);
            
            var th = document.getElementById('previsaoResult').parentElement;
            var tr = th.parentElement;
            var tbody = tr.parentElement;
            var table = tbody.parentElement;
            table.insertAdjacentElement('afterend', table_future);
            table.insertAdjacentElement('afterend', document.createElement("BR"));
            var exportButton = document.createElement("BUTTON");
            exportButton.id = 'exportButton';
            exportButton.innerHTML = "Exportar";
            exportButton.setAttribute('onclick', 'exportPrevisao()');
            table_future.insertAdjacentElement('beforebegin', exportButton);
            var footerDiv = document.createElement('DIV');
            footerDiv.id = 'footer';
            footerDiv.insertAdjacentHTML('beforeend', 'Fonte: INMET');
            footerDiv.appendChild(document.createElement("BR"));            
            table_future.insertAdjacentElement('afterend', footerDiv);            
    });
    
}

function cleanPrevisao() {
    //Limpa botão e fonte
    if(document.getElementById('exportButton')) {
        document.getElementById('exportButton').remove();
    }
    if(document.getElementById('footer')) {
        document.getElementById('footer').remove();
    }
}

function exportPrevisao() {
    var divToPrint=document.getElementById("table_future");
    var newWin= window.open("");
    newWin.document.write(divToPrint.outerHTML);
    newWin.print();
    newWin.close();
}

function getMoonPhase(date) {
    var split = date.split('/')
    var day = split[0]
    var month = split[1]
    var year = split[2]
    var c = e = jd = b = 0;
    var fase;

    if (month < 3) {
    year--;
    month += 12;
    }

    ++month;
    c = 365.25 * year;
    e = 30.6 * month;
    jd = c + e + day - 694039.09; //jd is total days elapsed
    jd /= 29.5305882; //divide by the moon cycle
    b = parseInt(jd); //int(jd) -> b, take integer part of jd
    jd -= b; //subtract integer part to leave fractional part of original jd
    b = Math.round(jd * 8); //scale fraction from 0-8 and round
    if (b >= 8) {
    b = 0; //0 and 8 are the same so turn 8 into 0
    }
    switch (b) {
    case 0:
        fase = "Lua Nova";
        break;
    case 1:
        fase = "Crescente";
        break;
    case 2:
        fase = "Crescente";
        break;
    case 3:
        fase = "Quarto Crescente";
        break;
    case 4:
        fase = "Lua Cheia";
        break;
    case 5:
        fase = "Minguante";
        break;
    case 6:
        fase = "Quarto Minguante";
        break;
    case 7:
        fase = "Minguante";
        break;
    }
    return fase;
}

function getTwilight(dates, table) {
    
    //set twilight Attributes
    var attributes = {
        "Inicio Cps Civil": "civil_twilight_begin",
        "Fim Cps Civil": "civil_twilight_end",
        "Inicio Cps Nautico": "nautical_twilight_begin",
        "Fim Cps Nautico": "nautical_twilight_end",
    }

    //get twilight data
    var crepusculos = []
    for (var i = 0; i < dates.length; i++) {
        var split = dates[i].split('/')
        var dia = split[0]
        var mes = split[1]
        var ano = split[2]
        var crepusculo = $.ajax({
                            type: 'GET',
                            url: 'https://api.sunrise-sunset.org/json?lat=-15&lng=-45&formatted=0&date='+ano+'-'+mes+'-'+dia,
                            dataType: 'json',
                            success: function() { },
                            data: {},
                            async: false
                        });
        crepusculos.push(crepusculo.responseJSON)
    }
    
    //Add the twilight data rows.
    for (var key in attributes) {
        row = table.insertRow(-1);
        var cell = row.insertCell(-1);
        cell.innerHTML = '<b>' + key + '</b>';
        for (var c = 1; c < table.rows[3].cells.length; c++)
        {
        if (c === 1){
            var cell = row.insertCell(-1);
            cell.colSpan = 3
            data = new Date(crepusculos[0]['results'][attributes[key]]).toLocaleString('pt-BR', {timeZone: 'America/Sao_Paulo'}).split(" ")[1]
            cell.innerHTML = data;
        } else if (c === 2 || c === 3){
            continue;
        } else if (c === 4){
            var cell = row.insertCell(-1);
            cell.colSpan = 3
            data = new Date(crepusculos[1]['results'][attributes[key]]).toLocaleString('pt-BR', {timeZone: 'America/Sao_Paulo'}).split(" ")[1]
            cell.innerHTML = data;
        } else if (c === 5 || c === 6){
            continue;
        } else {
            var cell = row.insertCell(-1);
            data = new Date(crepusculos[c-5]['results'][attributes[key]]).toLocaleString('pt-BR', {timeZone: 'America/Sao_Paulo'}).split(" ")[1]
            cell.innerHTML = data;
        }
        }
    }        
}

