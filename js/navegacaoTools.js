// Ferramentas da navegação

function NavTool(buttonTagId, map) {
    this.map = map;
    this.buttonId = buttonTagId;    
}

NavTool.prototype.cleanUp = function () {
    $('#map').css('cursor', 'default');
}

NavTool.prototype.runTool = function (pointer) {
    sidebar.close();    
    $('#map').css('cursor', pointer);
}
