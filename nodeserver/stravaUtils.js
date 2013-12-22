var stravaUtils = {};

var propsToIgnore = [
	'resource_state',
	'external_id',
	'upload_id',
	'athlete',
	'timezone',
	'start_latlng',
	'end_latlng',
	'location_city',
	'location_state',
	'start_latitude',
	'start_longitude',
	'achievement_count',
	'kudos_count',
	'comment_count',
	'athlete_count',
	'photo_count',
	'map',
	'trainer',
	'commute',
	'manual',
	'flagged',
	'gear_id',
	'average_temp',
	'average_watts',
	'kilojoules',
	'calories',
	'truncated',
	'has_kudoed'
];

var zeroPad = function(d) {
	return (d<10?'0'+d:d);
};

var displayTimeFromSeconds = function(totalSec) {
	var hours = parseInt( totalSec / 3600 ) % 24;
	var minutes = parseInt( totalSec / 60 ) % 60;
	var seconds = parseInt(totalSec % 60);
	return hours + ':'  + zeroPad(minutes) + ':' + zeroPad(seconds);
};

stravaUtils.activityParerDowner = function(k, v) {

	if ( k === 'distance' ) {
		return parseFloat((v *0.000621371).toFixed(2));
	} else if (  k ==='total_elevation_gain') {
		return parseFloat((v *3.28084).toFixed(0));
	} else if ( k === 'max_speed' || k === 'average_speed') {
		return parseFloat((v*2.23694).toFixed(2));
	} else if ( propsToIgnore.indexOf(k) != -1 ) {
		return undefined;
	}
	return v;

};

stravaUtils.addDisplayTimes = function(activities) {
	for (var i = 0; i < activities.length; i++) {
		var activity = activities[i];
		activity.moving_time_display = displayTimeFromSeconds( activity.moving_time);
		activity.elapsed_time_display = displayTimeFromSeconds( activity.elapsed_time);
	}

};

module.exports = stravaUtils;