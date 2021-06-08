# navegacao_bdgex
Stand alone page for map navigation from BDGEx

The page works based on a JSON file containing layers info.
There is a example json named arvore-exemplo.json showing how it must be filled.
This file name needs to be changed to 'arvore.json' in order to be used. 

CSW service URI is defined at the very beggining of files 'loadFromIso.js' and 'navegacaoCSW.js'.
DECEA aerodromes weather data acquisition needs an api key to be inserted at 'navegacaoGetFeatureInfo.js'.
Locations search also needs a URI definition at 'navegacaoMobile.js'.

For a better running in the page, we recommend copying the entire folder, or creating a symbolic link,
at /var/www/html or similars.

