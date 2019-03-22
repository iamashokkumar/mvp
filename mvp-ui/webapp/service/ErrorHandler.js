"use strict";

sap.ui.define([
  //  "sap/ma/platform/service/Notification"
   "sap/ui/model/resource/ResourceModel",
   	"sap/m/MessageToast"
], function (ResourceModel,MessageToast) {
    var ErrorHandler = {};
    var oResourceModel = new ResourceModel({
        bundleName: "com.sap.build.leonardo.votingApp.i18n.i18n",
        bundleUrl:"i18n/i18n.properties"
    });

    sap.ui.getCore().setModel(oResourceModel, "i18n");
    var oI18n = sap.ui.getCore().getModel("i18n");
    ErrorHandler.ResponseStatus = {
        401: "access_denied",
        403: "authorization_error",
        500: "internal_error"
    };

    ErrorHandler.enableErrorMessages = function (requestPromise) {
        return requestPromise
            .fail(function (jqXHR) {
                if(jqXHR.responseJSON&&jqXHR.responseJSON.message){
                            var sErrorMSg = jqXHR.responseJSON.message;   
                            jQuery.sap.log.error(sErrorMSg);                         
                            MessageToast.show(sErrorMSg,{duration:2000});
                }
            })
            .done(function (data, textStatus, jqXHR) {

            });
    };
    /*function getErrorMsg(sErrorMSg){
        var sErrorCode,sErrorType,arrayOfStrings,sMessage;
        if(sErrorMSg){
                arrayOfStrings = sErrorMSg.split(":");
                if(arrayOfStrings&&arrayOfStrings.length===2){
                    sErrorCode = arrayOfStrings[0];
                    sErrorType = arrayOfStrings[1].trim();
                    sMessage = oI18n.getText("MSG_"+sErrorType);
                }
                                
        }
        if(sMessage){
            return sMessage;
        }else{
            return oI18n.getText("MSG_OTHER_ERROR");
        }
               
    }
*/
    return ErrorHandler;
}, true);
