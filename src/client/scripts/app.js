import $ from 'jquery';
import TweenMax from 'gsap';
import axios from 'axios';
import _ from 'lodash';
import moment from 'moment';
const LS = localStorage;
const apiRoot = 'http://localhost:3000'
import champions from '../data/champions.json';
import sumSpells from '../data/summoner_spells.json';

let app = {

  init() {

    app.$logLocalData = $('#logLocalData');
    app.$dumpLocalData = $('#dumpLocalData');
    app.$loader = $('#loader');
    app.$loading = $('#loading');
    app.$error = $('#error');
    app.$sumName = $('#name');
    app.$sumRegion = $('#region');
    app.sumName = '';
    app.sumRegion = 'na';
    app.localData = [];
    app.autocompleteSummoners = [];
    app.currentSummoner = {};
    app.extraMatches = [];

    app.$nav = $('nav#nav');
    app.$navIcons = $('nav#nav .nav-icon');
    app.$devButton = $('#dev-button');
    app.$devMenu = $('#dev-menu');
    app.$search = $('#search');
    app.$searchBar = $('#search-wrap');
    app.$searchTitle = $('#search #title');
    app.$summoner = $('#summoner');
    app.$summonerInfo = $('#summoner-info');
    app.$summonerInfoWrap = $('#info-wrap');
    app.$summonerMatches = $('#matches');
    app.$summonerMatchesWrap = $('#matches-wrap');
    app.$summonerRecent = $('#recent-games');
    app.$summonerRecentWrap = $('#recent-wrap');

    console.log('%c Lollipop App Started ', 'background: #ddd; color: #9b1851;font-weight:bold;');
    this.syncLocalData();
    this.anon();

  },

  // Local Summoner Data Functions
  storeLocalSummoner(data) {
    this.localData.push(data);
    this.autocompleteSummoners.push(data.name.toLowerCase());
    this.currentSummoner = data;
    if(this.localData.length === 5) {
      this.localData.splice(1,1);
    }
    if(this.autocompleteSummoners.length === 5) {
      this.autocompleteSummoners.splice(0,1);
    }
    LS.setItem('summoners', JSON.stringify(this.localData));
  },
  getLocalSummoner(name) {
    const self = this;
    self.showLoader('Getting Summoner Data');
    self.$summoner.fadeOut(30);
    _.forEach(this.localData, function(key) {
      if(key.name.toLowerCase() === name) {
        self.currentSummoner = key;
        self.displaySummoner();
        if(self.summonerIsRanked()) {
          self.displayLeague();
          self.displaySummonerMatches();
        }
        self.displaySummonerRecentGames();
        self.hideLoader();
        self.$summoner.fadeIn();
      }
    })
  },
  updateCurrentSummoner() {
    const self = this;
    self.showLoader('Updating Summoner Data');

    _.forEach(this.localData, function(key, index) {
      if(key.name === self.currentSummoner.name) {
        self.localData[index] = self.currentSummoner;
        LS.setItem('summoners', JSON.stringify(self.localData));
        self.hideLoader();
      }
    })
  },
  syncLocalData() {
    const self = this;
    const queryLocal = LS.getItem('summoners');
    if(queryLocal != null) {
      this.localData = JSON.parse(queryLocal);
      _.forEach(this.localData, function(key) {
        self.autocompleteSummoners.push(key.name.toLowerCase());
      })
      console.log('%c Welcome back! Loaded ' + this.localData.length + ' Summoners from Lollipop Local Data ', 'background: #ddd; color: #135e35;');
    } else {
      console.log('%c No Lollipop Local Data Found ', 'background: #ddd; color: #5e4013;');
    }
  },

  // Convert: Champion ID -> Champion Name
  championIdToName(champID) {
    var champ = '';
    _.forEach(champions.data, function(key) {
      if(parseInt(key['key']) === champID) {
        champ = key.id;
        return false;
      }
    })
    return champ;
  },

  // Convert: Summoner Spell ID -> Summoner Spell Name
  championSumSpellsToName(spellkey) {
    var name = '';
    _.forEach(sumSpells.data, function(key) {
      if(parseInt(key['key']) === spellkey) {
        name = key.id;
        return false;
      }
    })
    return name;
  },

  // Anonymous UI Funcs
  anon() {
    const self = this;
    var nav = document.getElementById('search');
    var searchBox = document.getElementById('search-wrap');
    var title = document.getElementById('title');
    var devMenu = document.getElementById('dev-menu');

    // Nav Debug Menu
    self.$devButton.off('click').on('click', function() {
      if(!self.$devMenu.hasClass('on')) {
        TweenMax.to(devMenu, .25, { height:'95px', autoAlpha:1, ease:Sine.easeInOut });
        self.$devMenu.addClass('on');
      } else {
        TweenMax.to(devMenu, .25, { height:0, autoAlpha:0, ease:Sine.easeInOut });
        self.$devMenu.removeClass('on');
      }
      $(document).off('click').on('click', function(e) {
        if(!$(e.target).closest(self.$devButton).length && self.$devMenu.hasClass('on')) {
          TweenMax.to(devMenu, .25, { height:0, autoAlpha:0, ease:Sine.easeInOut });
          self.$devMenu.removeClass('on');
        }
      })
    })

    // Search Handlers
    this.$sumName.on('keyup', function(e) {
      self.sumName = $(this).val().replace(/\s/g,'');
      if(e.which === 13) {
        self.getSummoner(self.sumName, self.sumRegion);
        self.searchShrink();
      }
    });
    this.$sumRegion.on('change', function() {
      self.sumRegion = $(this).value().toLowerCase();
      if(self.$sumName.value().replace(/\s/g,'') != '') {
        self.getSummoner(self.sumName + '', self.sumRegion + '');
        self.searchShrink();
      }
    });

    // Debug Buttons
    self.$logLocalData.on('click', function() {
      console.log('%c Logging localStorage.summoners ', 'background: #ddd; color: #5e4013;');
      console.log(self.localData);
    })
    self.$dumpLocalData.on('click', function() {
      console.log('%c Garboed localStorage.summoners ', 'background: #ddd; color: #5e4013;');
      LS.removeItem('summoners');
      location.reload();
    })

    // Anon Resets (page load)
    self.$summonerInfo.removeClass('active');
  },

  // Search Shrink/Expand
  searchShrink() {
    const self = this;
    TweenMax.to(self.$searchTitle, .2, { y:'50px', autoAlpha:0, ease:Sine.easeInOut });
    TweenMax.to(self.$search, .35, { padding:0, height:0, ease:Sine.easeInOut });
    if(!self.$searchBar.hasClass('on')) {
      TweenMax.to(self.$searchBar, .35, { y:'-50px', marginRight:10, autoAlpha:0, ease:Sine.easeInOut, onComplete:cloneSearch });
    }
    TweenMax.to(self.$nav, .35, { backgroundColor:'#FF3D7F', ease:Sine.easeInOut });
    TweenMax.to(self.$navIcons, .35, { color:'#f0f0f0', ease:Sine.easeInOut });
    self.$devMenu.addClass('swap');
    TweenMax.to($('body'), .35, { backgroundColor:'#f0f0f0', ease:Sine.easeInOut });
    TweenMax.to($('#nav-main .link'), .35, { color:'#f0f0f0', ease:Sine.easeInOut});
    function cloneSearch() {
      TweenMax.to($('#nav-main .left .search'), .35, { width:250, autoAlpha:1, ease:Sine.easeInOut});
      self.$searchBar.detach().appendTo($('#nav-main .left .search'));
      $('#logo').fadeIn();
      TweenMax.to($('#logo'), .35, { x:0, autoAlpha:1, ease:Sine.easeInOut});
      TweenMax.to(self.$searchBar, .35, { y:0, autoAlpha:1, ease:Sine.easeInOut});
      self.$searchBar.addClass('on');
    }
  },

  // loader Show/Hide
  showLoader(message) {
    this.$loader.show();
    if(message) {
      this.$loading.show();
      this.$loading.html(message);
    }
  },
  hideLoader() {
    this.$loading.hide();
    this.$loader.hide();
  },

  // Error Display
  showError(message) {
    const self = this;
    this.$error.html(message);
    this.$error.show();
    setTimeout(function() {
      self.$error.html('');
      self.$error.hide();
    },3500)
  },

  // Check if Summoner is Ranked
  summonerIsRanked() {
    if(this.currentSummoner.stats.RankedSolo5x5.losses != 0 || this.currentSummoner.stats.RankedSolo5x5.wins != 0) {
      return true;
    } else {
      return false;
    }
  },

  // Get New Summoner -> Make Current
  getSummoner(sumName, sumRegion) {
    const self = this;
    self.showLoader('Getting Summoner Data');
    if(self.$summonerInfo.hasClass('on')) {
      self.$summoner.fadeOut(300);
    }

    //check local data first, if not present, call API
    if(self.autocompleteSummoners.indexOf(sumName) > -1) {
      console.log(sumName + ' in Local Data');
      self.getLocalSummoner(sumName);
    } else {
      console.log('---------------------');
      console.log('Searching for ' + sumName + ' @ ' + sumRegion);
      axios.post(apiRoot + '/api/summoner', {
        name: sumName,
        region: sumRegion
      })
      .then(function (response) {
        self.hideLoader();
        if(response.data && !response.data.error) {
          self.storeLocalSummoner(response.data);
          self.currentSummoner = response.data;
          self.displaySummoner();
          self.getCurrentSummonerStats();
        } else {
          if(response.data.error === 404) {
            self.showError('Summoner ' + sumName + ' @ ' + sumRegion.toUpperCase() + ' was not found');
          } else {
            self.showError('Something went wrong with the summoner lookup');
          }
        }
      })
      .catch(function (error) {
        self.hideLoader();
        self.showError('Something error happened when getting summoner');
        console.log(error);
      });
    }

  },

  // Display Current Summoner
  displaySummoner() {
    const self = this;
    self.$summonerInfoWrap.html('');

    function wrapUp() {
      self.$summonerInfo.addClass('on');
      TweenMax.set(self.$summonerInfoWrap, {height:"auto"})
      TweenMax.from(self.$summonerInfoWrap, 0.35, {height:0})
      self.$summoner.fadeIn();
    }
    if(!self.$summonerInfo.hasClass('on')) {
      TweenMax.to(self.$summonerInfoWrap, 0.35, {autoAlpha:1, ease:Sine.easeInOut});
      TweenMax.to(self.$summonerInfo, .35, { padding:'2rem 0px', ease:Sine.easeInOut,onComplete:wrapUp });
    } else {
      self.$summoner.fadeIn();
    }

    // Profile Icon
    var profileIcon = '';
    if(self.currentSummoner.profileIconId != '-1') {
      profileIcon = '<img src="https://ddragon.leagueoflegends.com/cdn/7.2.1/img/profileicon/' + self.currentSummoner.profileIconId + '.png" />'
    }

    self.$summonerInfoWrap.append(
      '<div class="inline-block">' +
        '<div class="vertical center">' +
          '<div class="icon">' + profileIcon + '</div>' +
        '</div>' +
        '<div class="vertical" id="info-basic">' +
          '<div class="name">' + self.currentSummoner.name + '</div>' +
          '<div class="level small-body font-body"><span class="icon-star"></span> Level ' + self.currentSummoner.summonerLevel + '</div>' +
          '<div class="relative bottom-inset" style="height:5px;"></div>' +
          '<div id="solo-league"><img src="images/rank_none.png" /><div class="rank small-body tiny"><span>Solo Rank</span><span>Unranked</span></div></div>' +
        '</div>' +
      '</div>'
    );

  },

  // Get Current Summoner Stats
  getCurrentSummonerStats() {
    const self = this;
    self.showLoader('Getting Summoner Stats');

    console.log('Getting stats for ' + self.currentSummoner.name + ' @ ' + self.currentSummoner.region + ' (' + self.currentSummoner.id + ')')
    axios.post(apiRoot + '/api/summoner-stats', {
      summonerID: self.currentSummoner.id,
      region: self.currentSummoner.region
    })
    .then(function (response) {
      self.hideLoader();
      if(!response.data.error) {
        self.currentSummoner.stats = response.data;
        self.updateCurrentSummoner();
        if(self.summonerIsRanked()) {
          self.getCurrentSummonerLeague();
        } else {
          self.getCurrentSummonerRecentGames();
        }
      } else {
        self.showError('Error getting summoner stats');
      }
    })
    .catch(function (error) {
      self.hideLoader();
      self.showError('Something error happened when getting summoner stats');
      console.log(error);
    });

  },

  // Get Current Summoner League
  getCurrentSummonerLeague() {
    const self = this;
    self.showLoader('Getting Summoner League');

    console.log('Getting league for ' + self.currentSummoner.name + ' @ ' + self.currentSummoner.region + ' (' + self.currentSummoner.id + ')')
    axios.post(apiRoot + '/api/league', {
      summonerName: self.currentSummoner.name,
      summonerID: self.currentSummoner.id,
      region: self.currentSummoner.region
    })
    .then(function (response) {
      self.hideLoader();
      if(!response.data.error) {
        self.currentSummoner.league = response.data;
        self.updateCurrentSummoner();
        self.displayLeague();
        self.getCurrentSummonerRecentGames();
      } else {
        self.showError('Error getting summoner league');
      }
    })
    .catch(function (error) {
      self.hideLoader();
      self.showError('Something error happened when getting summoner stats');
      console.log(error);
    });

  },

  // Display Current Summoner
  displayLeague() {
    const self = this;
    $('#solo-league').html('');

    //if(!self.currentSummoner.league || !self.currentSummoner.league.RANKED_SOLO_5x5) {return false;}
    const soloTier = self.currentSummoner.league.RANKED_SOLO_5x5.tier.toLowerCase();
    const soloWins = self.currentSummoner.league.RANKED_SOLO_5x5.wins;
    const soloLosses = self.currentSummoner.league.RANKED_SOLO_5x5.losses;
    let soloDivision = '';
    if(self.currentSummoner.league.RANKED_SOLO_5x5.division.toLowerCase() != 'challenger' || 'master') {
      soloDivision = self.currentSummoner.league.RANKED_SOLO_5x5.division;
    }

    // Insert League info into already-rendered Summoner Info placeholder
    $('#solo-league').append(
      '<img src="images/rank_' + soloTier + '.png" />' + '<div class="rank small-body tiny"><span>Solo Rank</span><span>' +
      soloTier + ' ' + soloDivision + '</span><span>' + soloWins + 'W / ' + soloLosses + 'L</span></div>'
    );

  },

  // Get Current Summoner Matches
  getCurrentSummonerMatches() {
    const self = this;
    self.showLoader('Getting Matches');

    console.log('Getting matches for ' + self.currentSummoner.name + ' @ ' + self.currentSummoner.region + ' (' + self.currentSummoner.id + ')')
    axios.post(apiRoot + '/api/matches', {
      summonerID: self.currentSummoner.id,
      region: self.currentSummoner.region,
      start: 0,
      end: 25
    })
    .then(function (response) {
      self.hideLoader();
      if(!response.data.error && response.data.totalGames > 0) {
        var newArr = [...response.data.matches];
        self.currentSummoner.matches = newArr;
        self.currentSummoner.matchTotal = response.data.totalGames;
        self.updateCurrentSummoner();
      } else {
        // if no matches, throw an 'unranked' flag
        var noMatches = response.data.totalGames === 0 ? ' ' + self.currentSummoner.name + ' - no matches found' : '';
        if(noMatches != '') {
          self.currentSummoner.unranked = 1;
          self.updateCurrentSummoner();
        }
        self.showError('Error getting matches' + noMatches);
      }
    })
    .catch(function (error) {
      self.currentSummoner.unranked = 1;
      self.updateCurrentSummoner();
      self.hideLoader();
      self.showError('Something error happened when getting matches');
      console.log(error);
    });

  },

  // Display Current Summoner Matches
  displaySummonerMatches() {
    const self = this;
    self.$summonerMatches.html('');


  },

  // Get Summoner Recent Games
  getCurrentSummonerRecentGames() {
    const self = this;
    self.showLoader('Getting Recent Games');

    console.log('Getting recent games for ' + self.currentSummoner.name + ' @ ' + self.currentSummoner.region + ' (' + self.currentSummoner.id + ')')
    axios.post(apiRoot + '/api/recent', {
      summonerID: self.currentSummoner.id,
      region: self.currentSummoner.region
    })
    .then(function (response) {
      self.hideLoader();
      if(!response.data.error && response.data.games.length > -1) {
        var newArr = [...response.data.games];
        self.currentSummoner.recent = newArr;
        self.updateCurrentSummoner();
        self.displaySummonerRecentGames();

        //check if summoner is ranked before trying to get matches
        if(self.summonerIsRanked()) {
          self.getCurrentSummonerMatches();
        }
      } else {
        // if no matches, throw an 'unranked' flag
        var noMatches = !response.data.games.length > -1 ? ' ' + self.currentSummoner.name + ' - no recent games found' : '';
        self.showError('Error getting recent games' + noMatches);
      }
    })
    .catch(function (error) {
      self.hideLoader();
      self.showError('Something error happened when getting recent games');
      console.log(error);
    });

  },

  // Display Current Summoner Recent Games
  displaySummonerRecentGames() {
    const self = this;
    let uid = 1;
    self.$summonerRecentWrap.html('');
    self.$summonerRecentWrap.append('<h2 class="recent">Recent Games</h2>');

    // Recent Games loop
    for(let value of self.currentSummoner.recent) {
      let gameType = function() {
        if(value.gameMode === 'ARAM') {return 'ARAM';}
        else if(value.gameMode === 'CLASSIC' && value.subType === 'NORMAL') {return 'Normal'}
        else if(value.gameMode === 'CLASSIC' && value.subType.includes('RANKED')) {return 'Ranked'}
        else if(value.subType.includes('BOT')) {return 'AI'}
        else {return '';}
      }
      let minionKills = function() {
        var neutral = 0;
        var lane = 0;
        if(value.stats.neutralMinionsKilled != undefined || 0) {
          neutral = value.stats.neutralMinionsKilled;
        }
        if(value.stats.minionsKilled != undefined || 0) {
          lane = value.stats.minionsKilled;
        }
        return neutral + lane;
      }
      let itemHtml = function() {
        var emptyItem = '<div class="item"><img src="images/empty_item.png" /></div>';
        var itemStart = '<div class="item"><img src="http://ddragon.leagueoflegends.com/cdn/7.3.1/img/item/';
        var itemEnd = '.png" /></div>';
        var item0 = value.stats.item0 ? itemStart + value.stats.item0 + itemEnd : emptyItem;
        var item1 = value.stats.item1 ? itemStart + value.stats.item1 + itemEnd : emptyItem;
        var item2 = value.stats.item2 ? itemStart + value.stats.item2 + itemEnd : emptyItem;
        var item3 = value.stats.item3 ? itemStart + value.stats.item3 + itemEnd : emptyItem;
        var item4 = value.stats.item4 ? itemStart + value.stats.item4 + itemEnd : emptyItem;
        var item5 = value.stats.item5 ? itemStart + value.stats.item5 + itemEnd : emptyItem;
        var item6 = value.stats.item6 ? itemStart + value.stats.item6 + itemEnd : emptyItem;
        return '<div class="items"><div class="left"><div class="top">' + item0 + item1 + item2 + '</div><div class="bottom">' + item3 + item4 + item5 + '</div></div><div class="right">' + item6 + '</div></div>';
      }
      let win = value.stats.win ? 'win' : 'loss';
      let kills = value.stats.championsKilled == undefined ? '<span class="kills">0</span>' : '<span class="kills">' + value.stats.championsKilled + '</span>';
      let deaths = value.stats.numDeaths == undefined ? '<span class="deaths">0</span>' : '<span class="deaths">' + value.stats.numDeaths + '</span>';
      let assists = value.stats.assists == undefined ? '<span class="assists">0</span>' : '<span class="assists">' + value.stats.assists + '</span>';;
      let perfect = value.stats.numDeaths == undefined ? '<div class="award small-body tiny"><span class="icon-man"></span> No Deaths</div>' : '';
      let gameDate = moment(value.createDate);
      let fromDate = gameDate.fromNow();
      gameDate = gameDate.format('MMM D hh:mm A');
      let timePlayed = Math.floor(value.stats.timePlayed / 60);
      let winLoss = value.stats.win == true ? 'win' : 'loss';
      let winLossEle = value.stats.win == true ? '<span class="icon-thumbs-up"></span> game won' : '<span class="icon-thumbs-down"></span> game lost';
      let doubleKills = value.stats.doubleKills ? '<div class="award small-body tiny"><span class="icon-hair-cross"></span> Double Kill: ' + value.stats.doubleKills + '</div>' : '';
      let tripleKills = value.stats.tripleKills ? '<div class="award small-body tiny"><span class="icon-hair-cross"></span> Triple Kill: ' + value.stats.tripleKills + '</div>' : '';
      let quadraKills = value.stats.quadraKills ? '<div class="award small-body tiny"><span class="icon-hair-cross"></span> Quadra Kill: ' + value.stats.quadraKills + '</div>' : '';
      let pentaKills = value.stats.pentaKills ? '<div class="award small-body tiny"><span class="icon-hair-cross"></span> Pentakill: ' + value.stats.pentaKills + '</div>' : '';
      let wardsPlaced;
      if(gameType() === 'Normal' || gameType() === 'Ranked') {
        wardsPlaced = value.stats.wardPlaced && value.stats.wardPlaced != undefined ? '<div class="award small-body tiny"><span class="icon-eye"></span> Wards Placed: ' + value.stats.wardPlaced + '</div>' : '<div class="small-body tiny text-error"><span class="icon-eye"></span> Wards Placed: 0</div>';
      } else {
        wardsPlaced = '';
      }
      let wardsKilled = value.stats.wardKilled && value.stats.wardKilled != undefined ? '<div class="award small-body tiny"><span class="icon-eye-with-line"></span> Wards Cleared: ' + value.stats.wardKilled + '</div>' : '';
      var sum1 = '<div class="spell"><img src="http://ddragon.leagueoflegends.com/cdn/7.3.1/img/spell/' + self.championSumSpellsToName(value.spell1) + '.png" /></div>';
      var sum2 = '<div class="spell"><img src="http://ddragon.leagueoflegends.com/cdn/7.3.1/img/spell/' + self.championSumSpellsToName(value.spell2) + '.png" /></div>';

      self.$summonerRecentWrap.append(
      '<div class="game">' +
        '<div class="vertical">' +
          '<div class="small-body tiny text-center">' + gameType() + '</div>' +
          '<img class="icon" src="http://ddragon.leagueoflegends.com/cdn/7.3.1/img/champion/' + self.championIdToName(value.championId) + '.png" />' + //hero portrait
          '<div class="sum-spells">' + sum1 + sum2 + '</div>' + //sum spells
        '</div>' +
        '<div class="vertical">' +
          '<div class="wl ' + winLoss + ' small-body tiny caps">' + winLossEle + '</div>' + //win loss
          perfect + doubleKills + tripleKills + quadraKills + pentaKills + wardsPlaced + wardsKilled +
          '<div class="small-body tiny text-dark"><span class="icon-stopwatch"></span> ' + timePlayed + ' min.</div>' + //game duration
        '</div>' +
        '<div class="vertical right">' +
          '<div class="kda text-bold text-right">' + kills + '/' + deaths + '/' + assists + '</div>' + //kda
          '<div class="cs small-body tiny text-right"><span>' + minionKills() + '</span><img src="images/cs.png" /></div>' + //cs
          '<div class="gold small-body tiny text-right"><span>' + value.stats.goldEarned.toLocaleString() + '</span><img src="images/gold.png" /></div>' + //gold
          '<div class="small-body tiny text-right">' + fromDate + '</div>' + //time played from now ("2 hours ago")
        '</div>' +
        '<div class="vertical right">' +
          '<div class="small-body tiny">Final Build - Lv. ' + value.stats.level + '</div>' +
          itemHtml() +
        '</div>' +
      '</div>'
      );

    }
  }

}

window.lollipop = app;
app.init();
