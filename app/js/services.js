'use strict';

var ONE_HOUR = 1000 * 60 * 60;

var services = angular.module('myApp.services', []).
  value('version', '0.1');

services.factory('activities', function($http, $q) {

	var dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
	
	var getPaddedMonth = function(d) {
		var unpaddedMonth = d.getMonth() + 1;
		return unpaddedMonth < 10 ? "0" + unpaddedMonth : unpaddedMonth;
	};
	
	var getGroupAll = function(activity){
		return 'all dates';	
	};

	var getGroupYear = function( activity) {
		var dt = activity.start_date_local;
		var d = new Date(Date.parse(dt));
		return d.getFullYear();
	};

	var getGroupMonth = function( activity) {
		var dt = activity.start_date_local;
		var d = new Date(Date.parse(dt));
		var paddedMonth = getPaddedMonth(d);
		var bucketMonth = new Date(Date.parse(d.getFullYear() + "-" + paddedMonth + "-01T00:00:00-0800"));
		return bucketMonth.getFullYear() + "-" + getPaddedMonth(bucketMonth);
	};

	var getGroupDay = function( activity) {
		var dt = activity.start_date_local;
		var d = new Date(Date.parse(dt));
		return dayOfWeek[d.getDay()];
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

	var getGroupFunction = function(groupBy) {
		switch( groupBy ) {
			case 'all':
				return getGroupAll;
			case 'year':
				return getGroupYear;
			case 'month':
				return getGroupMonth;
			case 'week':
				return getGroupWeek;
			case 'day':
				return getGroupDay;
			
		} 	
	};
	
	var getTotals = function(groupBy) {

		var promise = $q.defer();
		var groupFunction = getGroupFunction(groupBy);
		getAll().then(function(allActivities) {
			
			var groupTotals = [];

			for ( var i = 0; i < allActivities.length; i++ ) {
				var activity = allActivities[i];
				var month = groupFunction(activity);
				if (!(month in groupTotals)) {
					var totals = {};
					totals.groupBy = month;
					totals.footies = 0;
					totals.miles = 0;
					totals.elapsed_time = 0;
					totals.moving_time = 0;
					groupTotals[month] = totals;
				}
				groupTotals[month].footies += activity.total_elevation_gain;
				groupTotals[month].miles += activity.distance;
				groupTotals[month].elapsed_time += activity.elapsed_time;
				groupTotals[month].moving_time += activity.moving_time;
			}

			var results = [];

			for ( var m in groupTotals) {
				groupTotals[m].elapsed_time_display = displayTimeFromSeconds(groupTotals[m].elapsed_time);
				groupTotals[m].moving_time_display = displayTimeFromSeconds(groupTotals[m].moving_time);
				results.push(groupTotals[m]);
			}
			promise.resolve(results);
		});
		return promise.promise;
	};

	var getAll = function() {
		var promise = $q.defer();
		if ( localStorage.activities ) {
			promise.resolve(JSON.parse(localStorage.activities));
		} else {
			$http.get('/activities').success(function(data) {
				localStorage.activities = JSON.stringify(data);
				promise.resolve(data);
			}).error(function(data, status) {
				console.log("Error:" + status);				
			});
		}
		return promise.promise;
	};
	
	var getDuplicates = function() {
		console.log('in getDuplicates');
		var promise = $q.defer();
		getAll().then(function(allActivities) {
			// This assumes activities are ordered
			//console.log('searchCriteria:' + $scope.searchCriteria.startDate + '-' + $scope.searchCriteria.endDate);
			var dupes = [];
			var current = allActivities[0];
			var currentTime = (new Date(current.start_date)).getTime();
			var currentAlreadyAdded = false;
			for ( var i = 1; i < allActivities.length; i++ ) {
				var next = allActivities[i];
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
			promise.resolve(dupes);
		});
		return promise.promise;
	};

	var toggleActivityAccess = function(activity) {
		var promise = $q.defer();
		var formData = { private : !activity.private };
		$http.put('/activities/'+ activity.id, formData).success(function(data) {
			promise.resolve(data);
		}).error(function(data) {

		});
		return promise.promise;
	};
	
	return {
		getAll : getAll,
		getDuplicates : getDuplicates,
		getTotals : getTotals
	};
});
	
	