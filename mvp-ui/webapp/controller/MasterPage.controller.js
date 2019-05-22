sap.ui.define([
    "com/sap/build/leonardo/votingApp/controller/BaseController",
    "sap/m/MessageBox",
    "./utilities",
    "sap/ui/core/routing/History",
    "com/sap/build/leonardo/votingApp/service/MVPApi",
    "sap/ui/model/json/JSONModel",
            "com/sap/build/leonardo/votingApp/service/formatter"
], function(BaseController, MessageBox, Utilities, History, MVPApi, JSONModel,formatter) {
    "use strict";

    return BaseController.extend("com.sap.build.leonardo.votingApp.controller.MasterPage", {
        formatter:formatter,
        onClick: function(oEvent) {
            this._oBusyDialog = null;
            if (!this._oBusyDialog) {
                this._oBusyDialog = new sap.m.BusyDialog();
            }
            this._oBusyDialog.open();
            var oSelectedItem = oEvent.getSource();
            this._showObject(oSelectedItem.getSelectedItem());
            this._oBusyDialog.close();


        },
        _showObject: function(oItem) {
            var oCategory = oItem.oBindingContexts.CategoryModel.getObject();
            this.bus = sap.ui.getCore().getEventBus();
            if (oCategory) {
                this.bus.publish("Page", "loadData", {
                    Category: oCategory,
                    UserInfo:this.getModel("UserModel").getProperty("/userInfo")
                });
            }
        },
        handleRouteMatched: function(oEvent) {
            var sAppId = "App5c40a5222068ac0110876890";

            var oParams = {};
            var oView = this.getView();
            var bSelectFirstListItem = true;
            if (oEvent.mParameters.data.context || oEvent.mParameters.data.masterContext) {
                this.sContext = oEvent.mParameters.data.context;

                this.sMasterContext = oEvent.mParameters.data.masterContext;

            } else {
                if (this.getOwnerComponent().getComponentData()) {
                    var patternConvert = function(oParam) {
                        if (Object.keys(oParam).length !== 0) {
                            for (var prop in oParam) {
                                if (prop !== "sourcePrototype") {
                                    return prop + "(" + oParam[prop][0] + ")";
                                }
                            }
                        }
                    };

                    this.sMasterContext = patternConvert(this.getOwnerComponent().getComponentData().startupParameters);

                }
            }

            var oPath;

            if (this.sMasterContext) {
                oPath = {
                    path: "/" + this.sMasterContext,
                    parameters: oParams
                };
                this.getView().bindObject(oPath);
            } else if (this.sContext) {
                var sCurrentContextPath = "/" + this.sContext;

                bSelectFirstListItem = false;
            }

            if (bSelectFirstListItem) {
                oView.addEventDelegate({
                    onBeforeShow: function() {
                        var oContent = this.getView().getContent();
                        if (oContent) {
                            if (!sap.ui.Device.system.phone) {
                                var oList = oContent[0].getContent() ? oContent[0].getContent()[0] : undefined;
                                if (oList) {
                                    var sContentName = oList.getMetadata().getName();
                                    if (sContentName.indexOf("List") > -1) {
                                        oList.attachEventOnce("updateFinished", function() {
                                            var oFirstListItem = this.getItems()[0];
                                            if (oFirstListItem) {
                                                oList.setSelectedItem(oFirstListItem);
                                                oList.fireItemPress({
                                                    listItem: oFirstListItem
                                                });
                                            }
                                        }.bind(oList));
                                    }
                                }
                            }
                        }
                    }.bind(this)
                });
            }

        },
        _attachSelectListItemWithContextPath: function(sContextPath) {
            var oView = this.getView();
            var oContent = this.getView().getContent();
            if (oContent) {
                if (!sap.ui.Device.system.phone) {
                    var oList = oContent[0].getContent() ? oContent[0].getContent()[0] : undefined;
                    if (oList && sContextPath) {
                        var sContentName = oList.getMetadata().getName();
                        var oItemToSelect, oItem, oContext, aItems, i;
                        if (sContentName.indexOf("List") > -1) {
                            if (oList.getItems().length) {
                                oItemToSelect = null;
                                aItems = oList.getItems();
                                for (i = 0; i < aItems.length; i++) {
                                    oItem = aItems[i];
                                    oContext = oItem.getBindingContext();
                                    if (oContext && oContext.getPath() === sContextPath) {
                                        oItemToSelect = oItem;
                                    }
                                }
                                if (oItemToSelect) {
                                    oList.setSelectedItem(oItemToSelect);
                                }
                            } else {
                                oView.addEventDelegate({
                                    onBeforeShow: function() {
                                        oList.attachEventOnce("updateFinished", function() {
                                            oItemToSelect = null;
                                            aItems = oList.getItems();
                                            for (i = 0; i < aItems.length; i++) {
                                                oItem = aItems[i];
                                                oContext = oItem.getBindingContext();
                                                if (oContext && oContext.getPath() === sContextPath) {
                                                    oItemToSelect = oItem;
                                                }
                                            }
                                            if (oItemToSelect) {
                                                oList.setSelectedItem(oItemToSelect);
                                            }
                                        });
                                    }
                                });
                            }
                        }

                    }
                }
            }

        },
        _loadData: function(request) {
            var getCategoryURL = this.getOwnerComponent().getManifestEntry("/sap.app/dataSources/Category");

            //init Model
            var CategoryModel = new JSONModel({});
            this.setModel(CategoryModel, "CategoryModel");
            var oControl = this;
            MVPApi.get(getCategoryURL, null)
                .fail(function(data) {
                    var categories = JSON.parse(data.responseText);
                    var bCompact = !!oControl.getView().$().closest(".sapUiSizeCompact").length;

                    console.log(categories)
                    MessageBox.error(
                        categories.Response.Text, {
                            styleClass: bCompact ? "sapUiSizeCompact" : ""
                        }
                    );
                })
                .then(function(data) {
                    var categories = JSON.parse(data);
                    if (categories.Response.CODE == "SUCCESS") {

                        oControl._setModel("/userInfo",categories.Userid,"UserModel")
                        oControl._setModel("/category", categories.MVPCategories, "CategoryModel");
                        if (categories.MVPCategories.length > 0 && request == null)
                            sap.ui.getCore().getEventBus().publish("Page", "loadData", {
                                Category: categories.MVPCategories[0],
                                UserInfo: categories.Userid
                            });
                    } else {
                        console.log(categories);
                        //  MessageBox.error(categories)
                    }
                });
        },

        onInit: function() {

            sap.ui.getCore().getEventBus().subscribe("MasterPage", "loadData", this._loadData, this);
            this._loadData();
            this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);

            sap.ui.getCore().getEventBus().subscribe("Master", "loadData", this._loadData, this);
            if(this.byId("__component0---fcl--fcl-midForward"))
            {
                this.byId("__component0---fcl--fcl-midForward").setVisible(false);
            }
            // sap.ui.getCore().byId("__component0---fcl--fcl-midForward").setVisible(false);
            //this.oRouter.getTarget("MasterPage1").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));
        }
    });
}, /* bExport= */ true);