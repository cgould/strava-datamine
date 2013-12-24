'use strict';

/* Controllers */

var getActivities = function($scope, $http, callback) {
	if ( localStorage.activities ) {
		var activities = JSON.parse(localStorage.activities);
		callback(activities);
	} else {
		$http.get('/activities').success(function(data) {
			localStorage.activities = JSON.stringify(data);
			callback(data);
		}).error(function(data, status) {
			console.log("Error:" + status);
		});
	}
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

// This should be shared code with stravaUtils.js.  Need to figure out where to put
// files shared between client and server
var zeroPad = function(d) {
	return (d<10?'0'+d:d);
};

// This should be shared code with stravaUtils.js.  Need to figure out where to put
// files shared between client and server
var displayTimeFromSeconds = function(totalSec) {
	var hours = parseInt( totalSec / 3600 );
	var minutes = parseInt( totalSec / 60 ) % 60;
	var seconds = parseInt(totalSec % 60);
	return (hours > 0 ? hours + ':' : "") + zeroPad(minutes) + ':' + zeroPad(seconds);
};

var getMonthlyTotals = function($scope, $http, callback) {

	getActivities($scope, $http, function(activities) {

		var monthlyTotals = [];
	
		for ( var i = 0; i < activities.length; i++ ) {
			var activity = activities[i];
			var month = getBucketMonth(activity);
			if (!(month in monthlyTotals)) {
				var totals = {};
				totals.month = month;
				totals.footies = 0;
				totals.miles = 0;
				totals.elapsed_time = 0;
				totals.moving_time = 0;
				monthlyTotals[month] = totals;
			}
			monthlyTotals[month].footies += activity.total_elevation_gain;
			monthlyTotals[month].miles += activity.distance;
			monthlyTotals[month].elapsed_time += activity.elapsed_time;
			monthlyTotals[month].moving_time += activity.moving_time;
		}
	
		var results = [];
	
		for ( var m in monthlyTotals) {
			monthlyTotals[m].elapsed_time_display = displayTimeFromSeconds(monthlyTotals[m].elapsed_time);
			console.log('in:' + monthlyTotals[m].elapsed_time + ' - out:' + monthlyTotals[m].elapsed_time_display )
			monthlyTotals[m].moving_time_display = displayTimeFromSeconds(monthlyTotals[m].moving_time);
			results.push(monthlyTotals[m]);
		}
		callback(results);
	});	
};

var ONE_HOUR = 1000 * 60 * 60;

var getDuplicateRecords = function($scope, $http, callback) {

	getActivities($scope, $http, function(activities) {
		
		// This assumes activities are ordered
		//console.log('searchCriteria:' + $scope.searchCriteria.startDate + '-' + $scope.searchCriteria.endDate);
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
		callback(dupes);
	});
};

var toggleActivityAccess = function($http, activity, callback) {

	var formData = { private : !activity.private };
	$http.put('/activities/'+ activity.id, formData).success(function(data) {
		callback(data);
	}).error(function(data) {

	});
};

angular.module('myApp.controllers', [])
	.controller('MyCtrl1', [function() {
	
	}])
	.controller('monthlyTotals', function ($scope, $http) {
		 getMonthlyTotals($scope, $http, function(monthlyTotals){
			$scope.monthlyTotals = monthlyTotals;
			$scope.sortOrder = '-month';
			
		});
	})
	.controller('allActivities', function($scope, $http){
		getActivities($scope, $http, function(activities) {
			$scope.activities = activities;
			$scope.sortOrder = '-start_date_local';
		});
		$scope.toggleAccess = function(activity) {
			toggleActivityAccess($http, activity, function(data){
				activity.private = data.private;
			});
		};
	})
	.controller('findDupes', function ($scope, $http) {

		$scope.searchCriteria = { "startDate" : null, "endDate" : null };
		$scope.doSearch = function() {
			getDuplicateRecords($scope, $http, function(dupes) {
				$scope.dupes = dupes;
			});
		}
	})
	.controller('reloadActivities', function ($scope, $http, $location) {
		localStorage.removeItem('activities');
		localStorage.clear();
		$scope.activities = null;
		$location.path('/all-activities');
	});

