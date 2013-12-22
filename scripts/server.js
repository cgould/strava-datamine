var appUtils = require('./appUtils.js');
var strava = require('./strava.js');
var request = require('request');
var _ = require('underscore');

var express = require("express");
var app = express();
app.use(express.static(process.cwd() + '/app'));
app.use(express.logger());
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.compress());

var args = process.argv.splice(2);
var stravaConfigFile = args[0];
var stravaAuth = appUtils.readConfigFile(stravaConfigFile);

var propsToIgnore = [
	'resource_state',
	'external_id',
	'upload_id',
	'athlete',
	'timezone',
	'start_latlng',
	'end_latlng',
	'location_city',
	'location_state',
	'start_latitude',
	'start_longitude',
	'achievement_count',
	'kudos_count',
	'comment_count',
	'athlete_count',
	'photo_count',
	'map',
	'trainer',
	'commute',
	'manual',
	'flagged',
	'gear_id',
	'average_temp',
	'average_watts',
	'kilojoules',
	'calories',
	'truncated',
	'has_kudoed'
];
var activityParerDowner = function(k, v) {

	if ( k === 'distance' ) {
		return parseFloat((v *0.000621371).toFixed(2));
	} else if (  k ==='total_elevation_gain') {
		return parseFloat((v *3.28084).toFixed(0));
	} else if ( k === 'max_speed' || k === 'average_speed') {
		return parseFloat((v*2.23694).toFixed(2));
	} else if ( propsToIgnore.indexOf(k) != -1 ) {
		return undefined;
	}		
	return v;

};

var zeroPad = function(d) {
	return (d<10?'0'+d:d);	
};

var displayTimeFromSeconds = function(totalSec) {
	var hours = parseInt( totalSec / 3600 ) % 24;
	if ( hours > 10 ) {
		console.log( "big hours:   " + totalSec + '-' + hours);
	}
	var minutes = parseInt( totalSec / 60 ) % 60;
	var seconds = parseInt(totalSec % 60);
	return hours + ':'  + zeroPad(minutes) + ':' + zeroPad(seconds);
};


var addDisplayTimes = function(activities) {
	for (var i = 0; i < activities.length; i++) {
		var activity = activities[i];
		activity.moving_time_display = displayTimeFromSeconds( activity.moving_time);
		activity.elapsed_time_display = displayTimeFromSeconds( activity.elapsed_time);
	}
	
};

app.get('/token_exchange', function(req, res){
	
	console.log( req.path + ":" + req.query.code);
	strava.setConfig(stravaAuth);
	strava.oauthToken( req.query.code, function(access_token){
		res.cookie('access_token', access_token, { maxAge: 5 * 365 * 24 * 60 * 60 * 1000 });
		res.redirect('index.html');
	});
});

app.get('/activities', function(req, res) {
	
	var accessToken = req.cookies.access_token;
	if (_.isUndefined(accessToken) || accessToken === null ) {
		res.send(401, 'Not authorized by Strava.')
	} else {
		strava.activities(accessToken, activityParerDowner, function(results) {
			addDisplayTimes(results);
			res.send(results);
		});
	}
});

app.put('/activities/*', function(req, res) {

	var accessToken = req.cookies.access_token;
	var id = req.params[0];
	var private = req.body.private;
	strava.setPrivate(accessToken, id, private, function(data) {
		res.send(data);
	});
});

app.listen(8080);
