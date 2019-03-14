/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"com/sap/dbs/mvp/mvp-ui/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});