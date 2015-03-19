'use strict';

/* Controllers */

angular.module('myApp.controllers', [])
	.controller('MyCtrl1', [function() {
	
	}])
	.controller('monthlyTotals', function ($scope, $http, activities) {
		$scope.groupBy = 'month';
		$scope.activityType = 'rideAndHike'
		$scope.getTotals = function() {
			console.log('in controller');
			activities.getTotals($scope.groupBy, $scope.activityType).then( function(totals) {
				$scope.totals = totals;
				$scope.sortOrder = '-groupBy';
			});
		}
		$scope.getTotals($scope.groupBy, $scope.activityType);
	})
	.controller('allActivities', function($scope, $http, activities){
		activities.getAll().then(function(allActivities){
			$scope.activities = allActivities;
			$scope.sortOrder = '-start_date_local';
			$scope.toggleAccess = function(activity) {
				activities.toggleActivityAccess(activity).then(function(data){
					activity.private = data.private;
				});
			};
		});
	})
	.controller('findDupes', function ($scope, $http, activities) {
		$scope.searchCriteria = { "startDate" : null, "endDate" : null };
		$scope.doSearch = function() {
			activities.getDuplicates().then(function(duplicates){
				$scope.dupes = duplicates;
			});
		};
		$scope.doSearch();
	})
	.controller('reloadActivities', function ($scope, $http, $location) {
		localStorage.removeItem('activities');
		$scope.activities = null;
		$location.path('/all-activities');
	});

