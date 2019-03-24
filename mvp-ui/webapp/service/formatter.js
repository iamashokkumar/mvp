sap.ui.define([
    "sap/ui/core/ValueState",
], function(ValueState) {
    "use strict";

    return {
        formatDate: function(fValue) {
            var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
                style: "medium/short"
            });
            if (fValue) {
                return oDateFormat.format(new Date(fValue));
            }

        }


    };
});