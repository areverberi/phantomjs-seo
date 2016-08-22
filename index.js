var phantom = require('phantom'),
  sitePage = null,
  phInstance = null,
  requestArray = [];

var prerenderPage = function(req, res, next) {
  if(req.query._escaped_fragment_) {
    var relUrl= req.query._escaped_fragment_;
    phantom.create()
      .then(function(instance) {
        phInstance = instance;
        return instance.createPage();
      })
      .then(function(page) {
        sitePage = page;
        var url = 'http://'+req.headers.host+relUrl;
        console.log('url to open', url);
        sitePage.on('onResourceRequested', function(requestData, networkRequest) {
          //console.log('requestData', requestData);
          //console.log('networkRequest', networkRequest);
          requestArray.push(requestData.id);
        });
        sitePage.on('onResourceReceived', function(response) {
          //console.log('response', response);
          var index = requestArray.indexOf(response.id);
          requestArray.splice(index, 1);
        });
        sitePage.on('onConsoleMessage', function(msg) {
          console.log('onConsoleMessage', msg);
        });
        sitePage.on('onError', function(err) {
          console.log('onError', err);
        });
        return page.open(url);
      })
      .then(function(status) {
        var interval = setInterval(function() {
          if(requestArray.length === 0) {
            clearInterval(interval);
            return sitePage.property('content');
          }
        }, 500);
      })
      .then(function(content) {
        res.status(200).body(content).end();
      })
      .catch(function(err) {
        console.log('error', err);
        res.status(500).end();
      }); 
  }
  else {
    next();
  }
};

module.exports = prerenderPage;