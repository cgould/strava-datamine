'use strict';

var ONE_HOUR = 1000 * 60 * 60;

var services = angular.module('myApp.services', []).
  value('version', '0.1');

services.factory('activities', function($http, $q) {
	console.log('step 1a');
	var activities = {
		getAll : function() {
			console.log('in getAll');
			var promise = $q.defer();
			var allActivities = null;
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
	
	