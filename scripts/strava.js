var request = require('request');
var _ = require('underscore');
var moment = require('moment');

var URL_OAUTH_TOKEN = 'https://www.strava.com/oauth/token';
var URL_ACTIVITIES = 'https://www.strava.com/api/v3/athlete/activities';


var stravaAuth;

var strava = {};

strava.setConfig = function(config) {
	stravaAuth = config;
};

strava.oauthToken = function(code, callback) {
	
	var postBody = 'client_id=' + stravaAuth.clientId;
	postBody = postBody + '&client_secret=' + stravaAuth.clientSecret;
	postBody = postBody + '&code=' + code;

	console.log( postBody);
	
	var postData = {
		headers: {'content-type' : 'application/x-www-form-urlencoded'},
		uri: URL_OAUTH_TOKEN,
		body: postBody
	};
	
	request.post(postData, function(err, response, body) {
		console.log('oauthToken response:' + response.statusCode);
		console.log(body);
		var results = JSON.parse(body);
		callback(results.access_token);
	});
};

var getOldestTimestamp = function(activities) {

	var lastIndex = activities.length - 1;
	console.log(lastIndex);
	var lastRecord = activities[lastIndex];
	
	console.log(lastRecord);
	var oldest = lastRecord.start_date_local;

	// values are sorted newest to oldest
	return  moment(oldest).valueOf() / 1000;
/*
	var oldest = moment().valueOf();
	for (var i = 0; i < activities.length; i++) {
		var current = moment(activities[i].start_date_local).valueOf();
		if ( current < oldest)
			oldest = current;
	}
	return oldest;
*/	
};

strava.activities = function(accessToken, reviver, callback) {

	var baseUrl = URL_ACTIVITIES;
	baseUrl += '?access_token=' + accessToken;
	baseUrl += '&per_page=200';
	
	var finalResults = [];
	
	function fetch(olderThan) {
		var url = baseUrl;
		if (!_.isUndefined(olderThan)) {
			url += '&before=' + olderThan;
		}
		console.log(url);
		request.get( url, function(err, response, body) {
			var batchResults = JSON.parse(body, reviver);
			if ( batchResults ) {
				finalResults = finalResults.concat(batchResults);
				if ( batchResults.length == 200 ) {
					var oldestTimeStamp = getOldestTimestamp(batchResults);
					return fetch(oldestTimeStamp);
				} else {
					return callback(finalResults);
				}
			}
		});
	}
	
	fetch();
};

module.exports = strava;
