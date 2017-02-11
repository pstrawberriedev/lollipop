var express = require('express');
var axios = require('axios');
var riotCall = axios.create({ timeout: 3000 });
var _ = require('lodash');
var router = express.Router();
var apiKey = require('./secret.js');
var payload = {};

function buildRegionUrl(region) {
  return 'https://' + region.toLowerCase() + '.api.pvp.net/api/lol/';
}
function buildSummonerUrl(region, summoner) {
  var newUrl = buildRegionUrl(region) +
      region + '/v1.4/summoner/by-name/' +
      summoner + apiKey;
  return newUrl;
}
function buildStatsUrl(region, summonerID) {
  var newUrl = buildRegionUrl(region) +
      region + '/v1.3/stats/by-summoner/' +
      summonerID + '/summary' + apiKey;
  return newUrl;
}
function buildMatchesUrl(region, summonerID) {
  var newUrl = buildRegionUrl(region) +
      region + '/v2.2/matchlist/by-summoner/' +
      summonerID + apiKey;
  return newUrl;
}
function buildRecentUrl(region, summonerID) {
  var newUrl = buildRegionUrl(region) +
      region + '/v1.3/game/by-summoner/' +
      summonerID + '/recent' + apiKey;
  return newUrl;
}

// ++ API POSTS
router.post('/summoner', function(req, res) {
  var region = req.body.region + '';
  var summoner = req.body.name + '';
  var queryUrl = buildSummonerUrl(region, summoner);

  console.log('------');
  console.log('Searching Summoner ' + summoner + ' @ ' + region);
  console.log(queryUrl);

  riotCall.get(queryUrl)
  .then(function (response) {
    console.log(response.data[summoner]);
    var date = new Date();
    response.data[summoner].checked = date.toUTCString();
    response.data[summoner].region = region;
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

router.post('/summoner-stats', function(req, res) {
  var region = req.body.region + '';
  var summonerID = req.body.summonerID + '';
  var queryUrl = buildStatsUrl(region, summonerID);

  console.log('------');
  console.log('Searching Summoner Stats ' + summonerID + ' @ ' + region);
  riotCall.get(queryUrl)
  .then(function (response) {
    var newObj = {};
    _.forEach(response.data.playerStatSummaries, function(val, index) {
      newObj[val.playerStatSummaryType] = val;
    });
    res.json(newObj);
  })
  .catch(function (error) {
    console.log(error);
    if(error.response.status === 404) {
      res.json({error: 404});
    }
    res.send('Couldn\'t Get Summoner Stats');
  });
});

router.post('/matches', function(req, res) {
  var summonerID = req.body.summonerID + '';
  var region = req.body.region + '';
  var start = req.body.start + '';
  var end = req.body.end;
  var queryUrl = buildMatchesUrl(region, summonerID);
  var queryUrl = queryUrl + '&beginIndex=' + start + '&endIndex=' + end;

  console.log('------');
  console.log('Searching SummonerID Matches' + summonerID + ' @ ' + region);
  console.log(queryUrl);

  riotCall.get(queryUrl)
  .then(function (response) {
    res.json(response.data);
  })
  .catch(function (error) {
    console.log(error);
    if(error.response.status === 404) {
      res.json({error: 404});
    }
    res.send('Couldn\'t Get Summoner Matches');
  });

});

router.post('/recent', function(req, res) {
  var summonerID = req.body.summonerID + '';
  var region = req.body.region + '';
  var queryUrl = buildRecentUrl(region, summonerID);

  console.log('------');
  console.log('Searching SummonerID Recent Games' + summonerID + ' @ ' + region);
  console.log(queryUrl);

  riotCall.get(queryUrl)
  .then(function (response) {
    res.json(response.data);
  })
  .catch(function (error) {
    console.log(error);
    if(error.response.status === 404) {
      res.json({error: 404});
    }
    res.send('Couldn\'t Get Summoner Matches');
  });

});


module.exports = router;
