var express = require('express');
var axios = require('axios');
var router = express.Router();
var apiKey = require('./secret.js');
var payload = {};

function buildRegionUrl(region) {
  return 'https://' + region.toLowerCase() + '.api.pvp.net/api/lol/';
}
function buildSummonerUrl(region, summoner) {
  return queryUrl = buildRegionUrl(region) +
      region + '/v1.4/summoner/by-name/' +
      summoner + apiKey;
}

function lolQueryById(region, type) {
  console.log('Region: ' + region + '\nType: ' + type)
}

router.get('/summoner', function(req, res) {
  res.end();
});

router.post('/summoner', function(req, res) {
  var region = req.body.region + '';
  var summoner = req.body.name + '';
  var queryUrl = buildSummonerUrl(region, summoner);

  console.log('------');
  console.log('Searching ' + summoner + ' @ ' + region);
  console.log(queryUrl);

  axios.get(queryUrl)
  .then(function (response) {
    console.log(response.data[summoner]);
    res.json(response.data[summoner]);
  })
  .catch(function (error) {
    console.log(error);
    if(error.response.status === 404) {
      res.json({error: 404});
    }
    res.send('Couldn\'t Get Summoner');
  });

});


module.exports = router;
