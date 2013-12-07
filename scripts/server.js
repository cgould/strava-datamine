var appUtils = require('./appUtils.js');
var strava = require('./strava.js');
var request = require('request');
var _ = require('underscore');

var express = require("express");
var app = express();
app.use(express.logger());
app.use(express.cookieParser());
app.use(express.compress());
app.use(express.static(process.cwd() + '/app'));

var args = process.argv.splice(2);
var stravaConfigFile = args[0];
var stravaAuth = appUtils.readConfigFile(stravaConfigFile);

var activitiesHtmlLink = '<html><head></head><body><a href="/activities">See activities</a></body></html>'

var activityParerDowner = function(k, v) {

	if ( k == "distance" ) { 
		return v * 0.000621371;
	} else if (  k=="total_elevation_gain") {
		return v * 3.28084;
	} 		
	return v;

};

app.get('/token_exchange', function(req, res){
	
	console.log( req.path + ":" + req.query.code);
	strava.setConfig(stravaAuth);
	strava.oauthToken( req.query.code, function(access_token){
		console.log('token_exchange: got token:' + access_token);
		res.cookie('access_token', access_token, { maxAge: 5 * 365 * 24 * 60 * 60 * 1000 });
		res.redirect('index.html');
		res.send(activitiesHtmlLink);
	});
});

app.get('/activities', function(req, res) {
	
	var accessToken = req.cookies.access_token;
	if (_.isUndefined(accessToken) || accessToken === null ) {
		res.send(401, 'Not authorized by Strava.')
	} else {
		strava.activities(accessToken, activityParerDowner, function(results) {
			res.send(results);
		});
	}
});


app.listen(8080);
