import $ from 'jquery';
import TweenMax from 'gsap';
import axios from 'axios';
import _ from 'lodash';
const LS = localStorage;
const apiRoot = 'http://localhost:3000'
import champions from '../data/champions.json';

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

    app.$nav = $('#search');
    app.$devButton = $('#dev-button');
    app.$devMenu = $('#dev-menu');
    app.$search = $('#search');
    app.$searchBar = $('#search-wrap');
    app.$searchTitle = $('#search #title');
    app.$summonerArea = $('#summoner');
    app.$summonerInfo = $('#summoner .info');
    app.$summonerMatches = $('#summoner .matches');
    app.$summonerRecent = $('#summoner .recent');

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
    _.forEach(this.localData, function(key) {
      if(key.name.toLowerCase() === name) {
        self.currentSummoner = key;
        self.displaySummoner();
        self.displaySummonerRecentGames();
        self.hideLoader();
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

  // Anonymous Funcs
  anon() {
    const self = this;
    var nav = document.getElementById('search');
    var searchBox = document.getElementById('search-wrap');
    var title = document.getElementById('title');
    var devMenu = document.getElementById('dev-menu');

    // Nav Debug Menu
    self.$devButton.off('click').on('click', function() {
      if(!self.$devMenu.hasClass('on')) {
        TweenMax.to(devMenu, .25, { height:'65px', autoAlpha:1, ease:Sine.easeInOut });
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
    self.$summonerMatches.removeClass('active');
  },

  // Search Shrink/Expand
  searchShrink() {
    const self = this;
    TweenMax.to(self.$searchTitle, .2, { y:'50px', autoAlpha:0, ease:Sine.easeInOut });
    TweenMax.to(self.$search, .35, { padding:0, height:0, ease:Sine.easeInOut });
    TweenMax.to(self.$searchBar, .35, { y:'-50px', autoAlpha:0, ease:Sine.easeInOut, onComplete:cloneSearch });
    function cloneSearch() {
      self.$searchBar.detach().appendTo($('#nav-main .left .search'));
      $('#logo').fadeIn();
      TweenMax.to($('#logo'), .35, { x:0, autoAlpha:1, ease:Sine.easeInOut});
      TweenMax.to(self.$searchBar, .35, { y:0, autoAlpha:1, ease:Sine.easeInOut});
    }
  },

  // loader
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

  // Get New Summoner -> Make Current
  getSummoner(sumName, sumRegion) {
    const self = this;
    self.showLoader('Getting Summoner Data');

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
        self.getCurrentSummonerRecentGames();
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

  // Display Current Summoner
  displaySummoner() {
    const self = this;
    self.$summonerArea.show();
    self.$summonerInfo.html('');

    // Name
    if(self.currentSummoner.name) {
      self.$summonerInfo.append(
        '<h3 class="name">' + self.currentSummoner.name + '</h3>'
      );
    }
    // Profile Icon
    if(self.currentSummoner.profileIconId && self.currentSummoner.profileIconId != '-1') {
      self.$summonerInfo.append(
        '<img class="icon" src="https://ddragon.leagueoflegends.com/cdn/7.2.1/img/profileicon/' + self.currentSummoner.profileIconId + '.png" />'
      );
    }
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

    // Total Matches
    if(self.currentSummoner.name) {
      self.$summonerInfo.append(
        '<div class="name">' + self.currentSummoner.name + '</div>'
      );
    }
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
        self.getCurrentSummonerMatches();
        self.displaySummonerRecentGames();
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
    self.$summonerRecent.html('');
    self.$summonerRecent.append('<h3>Recent Games</h3>');

    // Recent Games loop
    for(let value of self.currentSummoner.recent) {
      let win = value.stats.win ? 'win' : 'loss';
      self.$summonerRecent.append(
      '<div class="game ' + win +'">' + // open
      '<img class="icon" src="http://ddragon.leagueoflegends.com/cdn/7.3.1/img/champion/' + self.championIdToName(value.championId) + '.png" />' + //hero portrait

      '</div>' // close
      );
    }
  }

}

window.lollipop = app;
app.init();
