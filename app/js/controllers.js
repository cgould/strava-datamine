'use strict';

/* Controllers */

angular.module('myApp.controllers', [])
	.controller('MyCtrl1', [function() {
	
	}])
	.controller('monthlyTotals', function ($scope, $http, activities) {
		activities.getMonthlyTotals().then(function(monthlyTotals){
			$scope.monthlyTotals = monthlyTotals;
			$scope.sortOrder = '-month';
		});
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
		activities.getDuplicates().then(function(duplicates){
			$scope.dupes = duplicates;
		});
		$scope.searchCriteria = { "startDate" : null, "endDate" : null };
		$scope.doSearch = function() {
			activities.getDuplicates().then(function(duplicates){
				$scope.dupes = duplicates;
			});
		};
	})
	.controller('reloadActivities', function ($scope, $http, $location) {
		localStorage.removeItem('activities');
		$scope.activities = null;
		$location.path('/all-activities');
	});

