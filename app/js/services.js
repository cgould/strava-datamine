'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
var services = angular.module('myApp.services', []).
  value('version', '0.1');

services.factory('activities', function($http, $q) {
	console.log('step 1a');
	var activities = {
		getAll : function() {
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
		}
	}
	return activities;
});
	
	