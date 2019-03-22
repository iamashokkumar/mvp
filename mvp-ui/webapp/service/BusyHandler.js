"use strict";

sap.ui.define([
    "sap/ui/core/BusyIndicator"
], function (BusyIndicator) {

    return {

        busy: function (promise) {
                BusyIndicator.show();
                promise.always(function () {
                        BusyIndicator.hide();                
                });

            return promise;
        }
    };

});
