/*global history */
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "sap/m/BusyDialog",
    "sap/ui/model/json/JSONModel"
], function(Controller, History,BusyDialog,JSONModel) {
    "use strict";

    return Controller.extend("com.sap.build.leonardo.mvpNomination.controller.BaseController", {
        /**
         * Convenience method for accessing the router in every controller of the application.
         * @public
         * @returns {sap.ui.core.routing.Router} the router for this component
         */


        _busyDialog: new BusyDialog(),

        showBusyDialog: function() {
            this._busyDialog.open();
        },
        getRouter: function() {
            return this.getOwnerComponent().getRouter();
        },

        /**
         * Convenience method for getting the view model by name in every controller of the application.
         * @public
         * @param {string} sName the model name
         * @returns {sap.ui.model.Model} the model instance
         */
        getModel: function(sName) {
            return this.getView().getModel(sName);
        },

        /**
         * Convenience method for setting the view model in every controller of the application.
         * @public
         * @param {sap.ui.model.Model} oModel the model instance
         * @param {string} sName the model name
         * @returns {sap.ui.mvc.View} the view instance
         */
        setModel: function(oModel, sName) {
            return this.getView().setModel(oModel, sName);
        },

        _setModel: function(sPath, data, modelName) {
            if (modelName == null) {
                var oModel = this.getModel();
            } else {
                var oModel = this.getModel(modelName)
                if (!oModel) {
                    oModel = new JSONModel();
                    this.setModel(oModel, modelName);
                }
            }
            oModel.setProperty(sPath, data);
        },
        /**
         * Convenience method for getting the resource bundle.
         * @public
         * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
         */
        getResourceBundle: function() {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },

        /**
         * Event handler  for navigating back.
         * It checks if there is a history entry. If yes, history.go(-1) will happen.
         * If not, it will replace the current entry of the browser history with the master route.
         * @public
         */
        onNavBack: function() {
            var sPreviousHash = History.getInstance().getPreviousHash();

            if (sPreviousHash !== undefined) {
                // The history contains a previous entry
                history.go(-1);
            } else {
                // Otherwise we go backwards with a forward history
                var bReplace = true;
                this.getRouter().navTo("master", {}, bReplace);
            }
        }

    });

});