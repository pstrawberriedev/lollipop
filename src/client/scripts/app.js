import $ from 'wetfish-basic';
import axios from 'axios';
import _ from 'lodash';
const LS = localStorage;

let app = {

  init() {

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

    app.$summonerInfo = $('#summoner .info');
    app.$summonerMatches = $('#summoner .matches');

    console.log('%c Lollipop App Started ', 'background: #ddd; color: #9b1851;font-weight:bold;');
    this.syncLocalData();
    this.anon();

  },

  // Local Summoner Data
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
        console.log('Updated Local Summoner Data for ' + self.currentSummoner.name + ':');
        console.log(self.localData);
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

  // Anonymous Funcs
  anon() {
    const self = this;

    this.$sumName.on('keyup', function(e) {
      self.sumName = $(this).value().replace(/\s/g,'');
      if(e.which === 13) {
        self.getSummoner(self.sumName, self.sumRegion);
      }
    });
    this.$sumRegion.on('change', function() {
      self.sumRegion = $(this).value().toLowerCase();
      if(self.$sumName.value().replace(/\s/g,'') != '') {
        self.getSummoner(self.sumName + '', self.sumRegion + '');
      }
    });

    // Anon Resets (page load)
    self.$summonerInfo.removeClass('active');
    self.$summonerMatches.removeClass('active');
  },

  // loader
  showLoader(message) {
    this.$loader.style({'display':'block'});
    if(message) {
      this.$loading.style({'display':'block'});
      this.$loading.html(message);
    }
  },
  hideLoader() {
    this.$loading.style({'display':'none'});
    this.$loader.style({'display':'none'});
  },

  // Error Display
  showError(message) {
    const self = this;
    this.$error.html(message);
    this.$error.style({'display':'block'});
    setTimeout(function() {
      self.$error.html('');
      self.$error.style({'display':'none'});
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
      console.log('Searching for ' + sumName + ' @ ' + sumRegion);
      axios.post('/api/summoner', {
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
            self.showError('Something went wrong - please try again or submit an issue on Github');
          }
        }
      })
      .catch(function (error) {
        self.hideLoader();
        console.log(error);
      });
    }

  },

  // Get Current Summoner Stats
  getCurrentSummonerStats() {
    const self = this;
    self.showLoader('Getting Summoner Stats');

    console.log('Getting stats for ' + self.currentSummoner.name + ' @ ' + self.currentSummoner.region + ' (' + self.currentSummoner.id + ')')
    axios.post('/api/summoner-stats', {
      summonerID: self.currentSummoner.id,
      region: self.currentSummoner.region
    })
    .then(function (response) {
      self.hideLoader();
      if(!response.data.error) {
        self.currentSummoner.stats = response.data;
        self.updateCurrentSummoner();
        self.getCurrentSummonerMatches();
      } else {
        self.showError('Error getting summoner stats');
      }
    })
    .catch(function (error) {
      self.hideLoader();
      console.log(error);
    });

  },

  // Display Current Summoner
  displaySummoner() {
    const self = this;
    self.$summonerInfo.addClass('active');
    self.$summonerInfo.html('');

    // Name
    if(self.currentSummoner.name) {
      self.$summonerInfo.append(
        '<div class="name">' + self.currentSummoner.name + '</div>'
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
    axios.post('/api/matches', {
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
        var noMatches = response.data.totalGames === 0 ? ' ' + self.currentSummoner.name + ' has 0 matches (or is banned?)' : '';
        self.showError('Error getting matches' + noMatches);
      }
    })
    .catch(function (error) {
      self.hideLoader();
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

  // Get More Current Summoner Matches
  getMoreSummonerMatches() {
    const self = this;
    self.showLoader('Getting Matches');
    self.currentSummoner.matchPullAmount = 25;

    //check for stored matches
    var indexPos = self.extraMatches.length;
    console.log(indexPos);

    // console.log('Getting matches for ' + self.currentSummoner.name + ' @ ' + self.currentSummoner.region + ' (' + self.currentSummoner.id + ')')
    // axios.post('/api/matches', {
    //   summonerID: self.currentSummoner.id,
    //   region: self.currentSummoner.region,
    //   start: self.currentSummoner.matchIndexPosition,
    //   end: self.currentSummoner.matchIndexPosition + self.currentSummoner.matchPullAmount,
    //   amount: self.currentSummoner.matchPullAmount
    // })
    // .then(function (response) {
    //   self.hideLoader();
    //   if(!response.data.error) {
    //     var newArr = [...response.data.matches];
    //     var currentArr = self.currentSummoner.matches;
    //     if(!currentArr) {
    //       self.currentSummoner.matches = newArr;
    //     } else {
    //       self.currentSummoner.matches = [...currentArr, ...newArr];
    //     }
    //
    //     self.currentSummoner.matchTotal = response.data.totalGames;
    //     self.currentSummoner.matchIndexPosition = self.currentSummoner.matchIndexPosition + self.currentSummoner.matchPullAmount;
    //     self.updateCurrentSummoner();
    //   } else {
    //     self.showError('Error getting matches');
    //   }
    // })
    // .catch(function (error) {
    //   self.hideLoader();
    //   console.log(error);
    // });

  },

}

app.init();
