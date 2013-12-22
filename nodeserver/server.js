var appUtils = require('./appUtils.js');
var strava = require('./strava.js');
var stravaUtils = require('./stravaUtils.js');
var request = require('request');
var _ = require('underscore');

var express = require("express");
var app = express();
app.use(express.static(process.cwd() + '/app'));
app.use(express.logger());
app.use(express.cookieParser());
app.use(express.json());
app.use(express.urlencoded());
app.use(express.compress());

var args = process.argv.splice(2);
var stravaConfigFile = args[0];
var stravaAuth = appUtils.readConfigFile(stravaConfigFile);

var getAccessToken = function(req, res, token) {
	var accessToken = req.cookies.access_token;
	if (_.isUndefined(accessToken) || accessToken === null ) {
		res.send(401, 'Not authorized by Strava.')
		return false;
	} 
	token.value = accessToken;
	return true;
};

var handleError = function(res, err, statusCode) {
	console.log('in handleError:' + statusCode);
	res.send(statusCode);
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
	
	var accessToken = {};
	if ( getAccessToken(req, res, accessToken)) {
		strava.activities(accessToken.value, stravaUtils.activityParerDowner, function(results) {
			stravaUtils.addDisplayTimes(results);
			res.send(results);
		},function(err, statusCode){
			handleError(res, err, statusCode);
		});
	}
});

app.put('/activities/*', function(req, res) {

	var accessToken = {};
	if ( getAccessToken(req, res, accessToken)) {
		var id = req.params[0];
		var private = req.body.private;
		strava.setPrivate(accessToken.value, id, private, function(data) {
			res.send(data);
		},function(err, statusCode){
			handleError(res, err, statusCode);
		});
	}
});

app.listen(8080);
