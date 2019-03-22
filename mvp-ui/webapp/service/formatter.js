sap.ui.define([
    "sap/ui/core/ValueState",
], function(ValueState) {
    "use strict";

    return {
        formatDate:function(fValue){

                    jQuery.sap.require("sap.ui.core.format.DateFormat");

                    var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({pattern: "yyyy-MM-dd"}); 
                    if(fValue)
                    {
                    return oDateFormat.format(new Date(parseInt(fValue.substr(6))));    
                    }
                    
                    }


    };
});