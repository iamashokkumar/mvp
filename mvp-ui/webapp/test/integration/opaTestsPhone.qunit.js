/* global QUnit */

QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function() {
	"use strict";

	sap.ui.require([
		"com/sap/dbs/mvp/mvp-ui/test/integration/PhoneJourneys"
	], function() {
		QUnit.start();
	});
});