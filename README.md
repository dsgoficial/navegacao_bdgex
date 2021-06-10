# navegacao_bdgex
Stand alone page for map navigation from BDGEx

The page works based on a JSON file containing layers info.
There is a example json named arvore-exemplo.json showing how it must be filled.
This file name needs to be changed to 'arvore.json' in order to be used. 

The CSW service URI is defined at the very beggining of files 'loadFromIso.js' and 'navegacaoCSW.js'.
DECEA aerodromes weather data acquisition needs an api key to be inserted at 'navegacaoGetFeatureInfo.js'.
Information on how to get a DECEA API key can be obtained at 'https://ajuda.decea.mil.br/base-de-conhecimento/api-redemet-o-que-e/'.
Locations search also needs a URI definition at 'navegacaoMobile.js'.

For a better running in the page, we recommend copying the entire folder, or creating a symbolic link,
at /var/www/html or similars.

**About the Meteorological data:**
BDGEx uses Meteorological data from the following providers:
- For images:
  - CPTEC/INPE (https://www.cptec.inpe.br)
  - OpenWeatherMap (TM) (https://openweathermap.org)
- For current weather and forecast:
  - INMET (https://portal.inmet.gov.br)
  - OpenWeatherMap (TM) (https://openweathermap.org)
