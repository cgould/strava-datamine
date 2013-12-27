'use strict';

var ONE_HOUR = 1000 * 60 * 60;

var services = angular.module('myApp.services', []).
  value('version', '0.1');

services.factory('activities', function($http, $q) {
	console.log('step 1a');
	var activities = {

		getPaddedMonth : function(d) {
			var unpaddedMonth = d.getMonth() + 1;
			return unpaddedMonth < 10 ? "0" + unpaddedMonth : unpaddedMonth;
		},

		getBucketMonth : function( activity) {
			var dt = activity.start_date_local;
			var d = new Date(Date.parse(dt));
			var paddedMonth = this.getPaddedMonth(d);
			var bucketMonth = new Date(Date.parse(d.getFullYear() + "-" + paddedMonth + "-01T00:00:00-0800"));
			return bucketMonth.getFullYear() + "-" + this.getPaddedMonth(bucketMonth);
		},

		// This should be shared code with stravaUtils.js.  Need to figure out where to put
		// files shared between client and server
		zeroPad : function(d) {
			return (d<10?'0'+d:d);
		},

		// This should be shared code with stravaUtils.js.  Need to figure out where to put
		// files shared between client and server
		displayTimeFromSeconds : function(totalSec) {
			var hours = parseInt( totalSec / 3600 );
			var minutes = parseInt( totalSec / 60 ) % 60;
			var seconds = parseInt(totalSec % 60);
			return (hours > 0 ? hours + ':' : "") + this.zeroPad(minutes) + ':' + this.zeroPad(seconds);
		},

		getMonthlyTotals : function() {

			var promise = $q.defer();
			var parent = this;
			this.getAll().then(function(allActivities) {
				
				var monthlyTotals = [];

				for ( var i = 0; i < allActivities.length; i++ ) {
					var activity = allActivities[i];
					var month = parent.getBucketMonth(activity);
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
					monthlyTotals[m].elapsed_time_display = parent.displayTimeFromSeconds(monthlyTotals[m].elapsed_time);
					console.log('in:' + monthlyTotals[m].elapsed_time + ' - out:' + monthlyTotals[m].elapsed_time_display )
					monthlyTotals[m].moving_time_display = parent.displayTimeFromSeconds(monthlyTotals[m].moving_time);
					results.push(monthlyTotals[m]);
				}
				promise.resolve(results);
			});
			return promise.promise;
		},

		getAll : function() {
			console.log('in getAll');
			var promise = $q.defer();
			console.log('step 1');
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
		},
		
		getDuplicates : function() {
			console.log('in getDuplicates');
			var promise = $q.defer();
			this.getAll().then(function(allActivities) {
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
		},

		toggleActivityAccess : function(activity) {
			var promise = $q.defer();
			var formData = { private : !activity.private };
			$http.put('/activities/'+ activity.id, formData).success(function(data) {
				promise.resolve(data);
			}).error(function(data) {

			});
			return promise.promise;
		}
		
	};
	return activities;
});
	
	