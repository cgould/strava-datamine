'use strict';

/* Controllers */

var getActivities = function($http) {
	var activities;
	if ( localStorage.activities ) {
		activities = JSON.parse(localStorage.activities);
	} else {
		$http.get('/activities').success(function(data) {
			activities = data;
			localStorage.activities = JSON.stringify(data);
		}).error(function(data) {
			
		});
	}
	return activities;
};

var getPaddedMonth = function(d) {
	var unpaddedMonth = d.getMonth() + 1;
	return unpaddedMonth < 10 ? "0" + unpaddedMonth : unpaddedMonth;
};

var getBucketMonth = function( activity) {
	var dt = activity.start_date_local;
	var d = new Date(Date.parse(dt));
	var paddedMonth = getPaddedMonth(d);
	var bucketMonth = new Date(Date.parse(d.getFullYear() + "-" + paddedMonth + "-01T00:00:00-0800"));
	return bucketMonth.getFullYear() + "-" + getPaddedMonth(bucketMonth); 
};

var getMonthlyTotals = function(activities) {
	
	var monthlyTotals = [];

	for ( var i = 0; i < activities.length; i++ ) {
		var activity = activities[i];
		var month = getBucketMonth(activity);
		if (!(month in monthlyTotals)) {
			var totals = {};
			totals.month = month;
			totals.footies = 0;
			totals.miles = 0;
			totals.time = 0;
			monthlyTotals[month] = totals;
		}
		monthlyTotals[month].footies += activity.total_elevation_gain * 3.28084;
		monthlyTotals[month].miles += activity.distance * 0.000621371;
		monthlyTotals[month].time += activity.elapsed_time;
	}

	var results = [];

	for ( var m in monthlyTotals) {
		console.log(m)
		monthlyTotals[m].footies = parseFloat(monthlyTotals[m].footies.toFixed(0));
		monthlyTotals[m].miles = parseFloat(monthlyTotals[m].miles.toFixed(2));
		results.push(monthlyTotals[m]);
	}
	
	return results;
};

angular.module('myApp.controllers', [])
	.controller('MyCtrl1', [function() {
	
	}])
	.controller('monthlyTotals', function ($scope, $http) {
		var activities = getActivities($http);
		$scope.monthlyTotals = getMonthlyTotals(activities);
		$scope.sortOrder = '-month';
	})
	.controller('allActivities', function($scope, $http){
		$scope.activities = getActivities($http);
		$scope.sortOrder = '-date';
	}) ;

