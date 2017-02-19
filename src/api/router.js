var express = require('express');
var axios = require('axios');
var riotCall = axios.create({ timeout: 3000 });
var _ = require('lodash');
var router = express.Router();
var apiKey = require('./secret.js');
var payload = {};

// URL CONSTRUCTORS
//
function buildRegionUrl(region, opt) {
  if(!opt) {
    return 'https://' + region.toLowerCase() + '.api.pvp.net/api/lol/';
  }
  if(opt === 'baseOnly') {
    return 'https://' + region.toLowerCase() + '.api.pvp.net/'
  }
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
function buildLeagueUrl(region, summonerID) {
  var newUrl = buildRegionUrl(region) +
      region + '/v2.5/league/by-summoner/' +
      summonerID + apiKey;
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
function buildMasteryUrl(region, summonerID) {
  var newUrl = buildRegionUrl(region, 'baseOnly') +
      '/championmastery/location/' + region.toUpperCase() + '1/' +
      'player/' + summonerID + '/topchampions' + apiKey + '&count=25';
  return newUrl;
}
function buildSpellMasteryUrl(region, summonerID) {
  var newUrl = buildRegionUrl(region) +
      region.toLowerCase() + '/v1.4/summoner/' +
      summonerID + '/masteries' + apiKey;
  return newUrl;
}
function buildSpellRunesUrl(region, summonerID) {
  var newUrl = buildRegionUrl(region) +
      region.toLowerCase() + '/v1.4/summoner/' +
      summonerID + '/runes' + apiKey;
  return newUrl;
}

// SUMMONER NAME
//
router.post('/summoner', function(req, res) {
  var region = req.body.region + '';
  var summoner = req.body.name + '';
  summoner = summoner.toLowerCase();
  var queryUrl = buildSummonerUrl(region, summoner);

  console.log('------');
  console.log('Searching Summoner ' + summoner + ' @ ' + region);
  console.log(queryUrl);

  riotCall.get(queryUrl)
  .then(function (response) {
    console.log('>> API Rate Limit: ' + response.headers['x-rate-limit-count']);
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

// SUMMONER STATS
//
router.post('/summoner-stats', function(req, res) {
  var region = req.body.region + '';
  var summonerID = req.body.summonerID + '';
  var queryUrl = buildStatsUrl(region, summonerID);

  console.log('------');
  console.log('Searching Summoner Stats ' + summonerID + ' @ ' + region);
  riotCall.get(queryUrl)
  .then(function (response) {
    console.log('>> API Rate Limit: ' + response.headers['x-rate-limit-count']);
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

// SUMMONER LEAGUE
//
router.post('/league', function(req, res) {
  var region = req.body.region + '';
  var summonerID = req.body.summonerID + '';
  var summonerName = req.body.summonerName + '';
  var queryUrl = buildLeagueUrl(region, summonerID);

  console.log('------');
  console.log('Searching Summoner League ' + summonerID + ' @ ' + region);
  riotCall.get(queryUrl)
  .then(function (response) {
    console.log('>> API Rate Limit: ' + response.headers['x-rate-limit-count']);
    var newObj = {};
    _.forEach(response.data[summonerID], function(val, index) {
      newObj[val.queue] = {};
      newObj[val.queue].tier = response.data[summonerID][index].tier;
      for(var i = 0; i < response.data[summonerID][index]['entries'].length; i++) {
        if(response.data[summonerID][index]['entries'][i].playerOrTeamName === summonerName) {
          newObj[val.queue].division = response.data[summonerID][index]['entries'][i].division;
          newObj[val.queue].wins = response.data[summonerID][index]['entries'][i].wins;
          newObj[val.queue].losses = response.data[summonerID][index]['entries'][i].losses;
          return false;
        }
      }
    });
    res.json(newObj);
  })
  .catch(function (error) {
    console.log(error);
    if(error.response.status === 404) {
      res.json({error: 404});
    }
    res.send('Couldn\'t Get Summoner League');
  });
});

// SUMMONER MATCHES
//
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
    console.log('>> API Rate Limit: ' + response.headers['x-rate-limit-count']);
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

// SUMMONER RECENT GAMES
//
router.post('/recent', function(req, res) {
  var summonerID = req.body.summonerID + '';
  var region = req.body.region + '';
  var queryUrl = buildRecentUrl(region, summonerID);

  console.log('------');
  console.log('Searching SummonerID Recent Games' + summonerID + ' @ ' + region);
  console.log(queryUrl);

  riotCall.get(queryUrl)
  .then(function (response) {
    console.log('>> API Rate Limit: ' + response.headers['x-rate-limit-count']);
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

// SUMMONER CHAMPION MASTERY
//
router.post('/mastery', function(req, res) {
  var summonerID = req.body.summonerID + '';
  var region = req.body.region + '';
  var queryUrl = buildMasteryUrl(region, summonerID);

  console.log('------');
  console.log('Searching SummonerID Champ Mastery' + summonerID + ' @ ' + region);
  console.log(queryUrl);

  riotCall.get(queryUrl)
  .then(function (response) {
    console.log('>> API Rate Limit: ' + response.headers['x-rate-limit-count']);
    res.json(response.data);
  })
  .catch(function (error) {
    console.log(error);
    if(error.response.status === 404) {
      res.json({error: 404});
    }
    res.send('Couldn\'t Get Summoner Mastery');
  });

});

// SUMMONER CHAMPION SPELL MASTERY
//
router.post('/spell-mastery', function(req, res) {
  var summonerID = req.body.summonerID + '';
  var region = req.body.region + '';
  var queryUrl = buildSpellMasteryUrl(region, summonerID);

  console.log('------');
  console.log('Searching SummonerID Spell Mastery' + summonerID + ' @ ' + region);
  console.log(queryUrl);

  riotCall.get(queryUrl)
  .then(function (response) {
    console.log('>> API Rate Limit: ' + response.headers['x-rate-limit-count']);
    res.json(response.data[summonerID].pages);
  })
  .catch(function (error) {
    console.log(error);
    if(error.response.status === 404) {
      res.json({error: 404});
    }
    res.send('Couldn\'t Get Summoner Spell Mastery');
  });

});

// SUMMONER CHAMPION SPELL RUNES
//
router.post('/spell-runes', function(req, res) {
  var summonerID = req.body.summonerID + '';
  var region = req.body.region + '';
  var queryUrl = buildSpellRunesUrl(region, summonerID);

  console.log('------');
  console.log('Searching SummonerID Spell Runes' + summonerID + ' @ ' + region);
  console.log(queryUrl);

  riotCall.get(queryUrl)
  .then(function (response) {
    console.log('>> API Rate Limit: ' + response.headers['x-rate-limit-count']);
    res.json(response.data[summonerID].pages);
  })
  .catch(function (error) {
    console.log(error);
    if(error.response.status === 404) {
      res.json({error: 404});
    }
    res.send('Couldn\'t Get Summoner Runes');
  });

});

module.exports = router;
