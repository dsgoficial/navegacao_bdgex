

function escapeNamespace(pathtext) {
    //return pathtext;
    return pathtext.replace(new RegExp(':', 'g'), '\\:');
}

function setIsoTagOnInput(xml, tagPath, inputId) {
	//get the input object and set it to readonly, because we're just showing data.
	var inputObj=$("[id='"+inputId+"']");
	inputObj.prop("readonly", true);
	//get the possible values from XML
    var tagValues=$(xml).find(escapeNamespace(tagPath));
    if ((tagValues.length>0) && (tagValues[0].firstChild)) {
        var tagValue=tagValues[0].firstChild.data.trim();
        //fill the tag properly
        if (inputObj.prop("type")=='text') {
        	inputObj.val(tagValue);
        } else if (inputObj.prop("tagName").toLowerCase()=='textarea')  {
        	inputObj.html(tagValue);
        }
    } else { //nothing was found for that tag on the XML. 
    	//hide it
    	inputObj.parent().addClass("hidden");
    	$('label[for="' + inputId + '"]').addClass("hidden");
    	
    }
}


function readFromCSWGetRecords(isoXmlUrl) {
    var nm;
    $.ajax({
        type: "GET" ,
        url: isoXmlUrl,
        dataType: "xml" ,
        success: function(xml) {
            $("input, textarea").each(function(index,value) {
                setIsoTagOnInput(xml, $(this).attr('id'), $(this).attr('id'));
            });

        }
    });
}

function readUUIDFromInput(inputId) {
    var uuidXML=$("[id='"+inputId+"']").val();
    if (uuidXML) {
        readFromCSWGetRecords(location.protocol+'//'+location.hostname+"/csw?service=CSW&version=2.0.2&request=GetRecordById&elementsetname=full&id="+uuidXML+"&typeName=gmd:MD_Metadata&outputSchema=http://www.isotc211.org/2005/gmd");
    }
}

$( document ).ready(function() {
    readUUIDFromInput('gmd:fileIdentifier gco:CharacterString');
});


