'use strict';


// Declare app level module which depends on filters, and services
angular.module('myApp', [
	'ngRoute',
	'myApp.filters',
	'myApp.services',
	'myApp.directives',
	'myApp.controllers'
]).
config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/view1', {templateUrl: 'partials/partial1.html', controller: 'MyCtrl1'});
	$routeProvider.when('/all-activities', {templateUrl: 'partials/all-activities.html', controller: 'allActivities'});
	$routeProvider.when('/monthly-totals', {templateUrl: 'partials/monthly-totals.html', controller: 'monthlyTotals'});
	$routeProvider.otherwise({redirectTo: '/view1'});
}]);
