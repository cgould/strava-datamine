var fs = require('fs');

exports.readConfigFile = function (fileName) {
	var data = fs.readFileSync( fileName );
	if (data) {
		config = JSON.parse(data);
	}
	return config;
};
