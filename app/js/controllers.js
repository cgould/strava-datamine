'use strict';

/* Controllers */

var getActivities = function($scope, $http) {
	var activities;
	if ( localStorage.activities ) {
		activities = JSON.parse(localStorage.activities);
	} else {
		$http.get('/activities').success(function(data) {
			$scope.activities = data;
			localStorage.activities = JSON.stringify(data);
			$scope.loading = false;
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


var findDupes = function($scope, $http) {
	var activities = getActivities($scope, $http);

	// This assumes activities are ordered
	//console.log('searchCriteria:' + $scope.searchCriteria.startDate + '-' + $scope.searchCriteria.endDate);
	console.log('in findDupes');
	var dupes = [];
	var current = activities[0];
	var currentTime = (new Date(current.start_date)).getTime();
	var currentAlreadyAdded = false;
	for ( var i = 1; i < activities.length; i++ ) {
		var next = activities[i];
		var nextTime = (new Date(next.start_date)).getTime();
		if ( Math.abs(currentTime - nextTime < ONE_HOUR )) {
			if (currentAlreadyAdded == false) {
				dupes.push(current);
			}
			
			dupes.push(next);
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
		$scope.activities = getActivities($scope, $http);
		$scope.monthlyTotals = getMonthlyTotals($scope.activities);
		$scope.sortOrder = '-month';
	})
	.controller('allActivities', function($scope, $http){
		console.log('in allActivities');
		$scope.loading = true;
		getActivities($scope, $http);
		$scope.loading = false;
		$scope.sortOrder = '-date';
	})
	.controller('findDupes', function ($scope, $http) {
		$scope.searchCriteria = { "startDate" : null, "endDate" : null };
		$scope.activities = findDupes($scope, $http);
		$scope.doSearch = function() {
			if ( typeof $scope.searchCriteria !== 'undefined')
				console.log( $scope.searchCriteria );
			else
				console.log('search criteria undefined');
		}
	});

