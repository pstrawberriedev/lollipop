import $ from 'wetfish-basic';
import axios from 'axios';

let app = {

  init() {

    app.$loader = $('#loader');
    app.$sumName = $('#name');
    app.$sumRegion = $('#region');
    app.sumName = '';
    app.sumRegion = 'na';

    this.anon();
    console.log('-> App Started');

  },

  // Anonymous Funcs
  anon() {
    const self = this;

    this.$sumName.on('keyup', function(e) {
      self.sumName = $(this).value().replace(/\s/g,'');
      if(e.which === 13) {
        self.showLoader();
        self.getSummoner(self.sumName, self.sumRegion);
      }
    });
    this.$sumRegion.on('change', function() {
      self.sumRegion = $(this).value().toLowerCase();
      if(self.$sumName.value().replace(/\s/g,'') != '') {
        self.showLoader();
        self.getSummoner(self.sumName + '', self.sumRegion + '');
      }
    });
  },

  // loader
  showLoader() {
    this.$loader.style({'display':'block'});
  },
  hideLoader() {
    this.$loader.style({'display':'none'});
  },

  // Get Summoner
  getSummoner(sumName, sumRegion) {
    const self = this;

    console.log('Searching for ' + sumName + ' @ ' + sumRegion);
    axios.post('/api/summoner', {
      name: sumName,
      region: sumRegion
    })
    .then(function (response) {
      self.hideLoader();
      console.log(response);
    })
    .catch(function (error) {
      self.hideLoader();
      console.log(error);
    });

  }

}

app.init();
