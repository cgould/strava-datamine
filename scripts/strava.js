var request = require('request');
var _ = require('underscore');
var moment = require('moment');

var URL_OAUTH_TOKEN = 'https://www.strava.com/oauth/token';
var URL_ACTIVITIES = 'https://www.strava.com/api/v3/athlete/activities';
var URL_ACTIVITY = 'https://www.strava.com/api/v3/activities';

var stravaAuth;

var strava = {};

var getOldestTimestamp = function(activities) {

	var lastIndex = activities.length - 1;
	var lastRecord = activities[lastIndex];

	var oldest = lastRecord.start_date_local;

	// values are sorted newest to oldest
	return  moment(oldest).valueOf() / 1000;
};

var getOptions = function(accessToken, fullUrl) {

	return { headers : { Authorization: "access_token " + accessToken }, url : fullUrl };
};

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

strava.activities = function(accessToken, reviver, callback) {

	var baseUrl = URL_ACTIVITIES;
//	baseUrl += '?access_token=' + accessToken;
//	baseUrl += '&per_page=200';
	baseUrl += '?per_page=200';

	var finalResults = [];
	
	function fetch(olderThan) {
		var url = baseUrl;
		if (!_.isUndefined(olderThan)) {
			url += '&before=' + olderThan;
		}
		console.log(url);
		var options = getOptions(accessToken, url);
		request.get( options, function(err, response, body) {
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

strava.setPrivate = function( accessToken, activityId, privateValue, callback ) {
	
	var postBody = {private: privateValue ? 1 : 0 };
	var url = URL_ACTIVITY + '/' + activityId;
	var options = getOptions(accessToken, url);
	options.form = postBody;

	request.put(options, function(err, response, body) {
		var results = JSON.parse(body);
		callback(results);
	});
};

module.exports = strava;
