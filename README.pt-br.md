# navegacao_bdgex
Página 'stand alone' de navegação por mapas do BDGEx

Funciona baseada em arquivo JSON que contenha informações das camadas.
O arquivo arvore-exemplo.json demonstra como deve ser preenchido.
Para ser usado, o arquivo deve ter seu nome alterado para apenas 'arvore.json'.

O serviço CSW é definido em URLs nos arquivos 'loadFromIso.js' e 'navegacaoCSW.js'.
A coleta de dados de aeródromos do DECEA necessita uma api key a ser inserida no início do arquivo 'navegacaoGetFeatureInfo.js'.
Informações sobre como obter a api key do DECEA estão em 'https://ajuda.decea.mil.br/base-de-conhecimento/api-redemet-o-que-e/'.
A busca por localidades precisa de definição de URI no início do arquivo 'navegacaoMobile.js'.

Para o funcionamento mais correto da página, recomendamos copiar a pasta inteira,
ou fazer um link simbólico para a /var/www/html ou similares. 
