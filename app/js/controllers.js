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
		monthlyTotals[month].footies += activity.total_elevation_gain;
		monthlyTotals[month].miles += activity.distance;
		monthlyTotals[month].time += activity.elapsed_time;
	}

	var results = [];

	for ( var m in monthlyTotals) {
		results.push(monthlyTotals[m]);
	}
	
	return results;
};

var ONE_HOUR = 1000 * 60 * 60;

var findDupes = function(activities) {
	// This assumes activities are ordered
	console.log('in find Dupes');
	var dupes = [];
	var current = activities[0];
	var currentTime = (new Date(current.start_date)).getTime();
	var currentAlreadyAdded = false;
	for ( var i = 1; i < activities.length; i++ ) {
		var next = activities[i];
		var nextTime = (new Date(next.start_date)).getTime();
		console.log( 'next:' + nextTime + "- current:" + currentTime + " - (" + (nextTime - currentTime) + ')');
		if ( Math.abs(currentTime - nextTime < ONE_HOUR )) {
			if (currentAlreadyAdded == false) {
				dupes.push(current);
				console.log( 'adding current:' + current.start_date);
			}
			
			dupes.push(next);
			console.log( 'adding next:' + next.start_date);
			currentAlreadyAdded = true;
		} else {
			currentAlreadyAdded = false;
		} 
		current = next;
		currentTime = nextTime;
	}
	return dupes;
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
	})
	.controller('findDupes', function ($scope, $http) {
		var activities = getActivities($http);
		$scope.activities = findDupes(activities);
	});

