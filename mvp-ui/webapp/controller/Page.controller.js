sap.ui.define(
    [
        "com/sap/build/leonardo/votingApp/controller/BaseController",
        "sap/m/MessageBox",
        "./dialogs/NomineeDialog",
        "./utilities",
        "sap/ui/core/routing/History",
        "sap/ui/model/json/JSONModel",
        "com/sap/build/leonardo/votingApp/service/formatter",
        "com/sap/build/leonardo/votingApp/service/MVPApi"
    ],
    function(BaseController, MessageBox, NomineeDialog, Utilities, History, JSONModel, formatter, MVPApi) {
        "use strict";
        return BaseController.extend("com.sap.build.leonardo.votingApp.controller.Page", {

            formatter: formatter,

// charts
            _constants: {
            chartContainerId: "chartContainer",
            vizFrames: {
                config: {
                    height: "700px",
                    width: "100%",
                    uiConfig: {
                        applicationSet: "fiori"
                    }
                },
                result: {
                    icon: "sap-icon://vertical-bar-chart",
                    title: "Bar Chart",
                    dataset: {
                        dimensions: [{
                            name: "Name",
                            value: "{MVPNomineeName}"
                        }],
                        measures: [{
                            name: "Votes",
                            value: "{MVPVotes}"
                        }],
                        data: {
                            path: "/MVPResults"
                        }
                    },
                    feedItems: [{
                        uid: "primaryValues",
                        type: "Measure",
                        values: [ "Votes" ]
                    }, {
                        uid: "axisLabels",
                        type: "Dimension",
                        values: []
                    }],
                    analysisObjectProps: {
                        uid: "Name",
                        type: "Dimension",
                        name: "Name"
                    },
                    vizType: "column"
                }
            }
        },

//end of charts




            handleRouteMatched: function(oEvent) {
                var sAppId = "App5c40f79c5bdf300110f25772";
                // cards
                var cardManifests = new JSONModel();
                cardManifests.loadData(sap.ui.require.toUrl("com/sap/build/leonardo/mvpNomination/public/manifests.json"));

                this.getView().setModel(cardManifests, "manifests");

                var oParams = {};

                if (oEvent.mParameters.data.context) {
                    this.sContext = oEvent.mParameters.data.context;

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

                        this.sContext = patternConvert(this.getOwnerComponent().getComponentData().startupParameters);

                    }
                }

                var oPath;

                if (this.sContext) {
                    oPath = {
                        path: "/" + this.sContext,
                        parameters: oParams
                    };
                    this.getView().bindObject(oPath);
                }

            },
            _onPageNavButtonPress: function() {
                var oHistory = History.getInstance();
                var sPreviousHash = oHistory.getPreviousHash();
                var oQueryParams = this.getQueryParameters(window.location);

                if (sPreviousHash !== undefined || oQueryParams.navBackToLaunchpad) {
                    window.history.go(-1);
                } else {
                    var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                    oRouter.navTo("default", true);
                }

            },
            getQueryParameters: function(oLocation) {
                var oQuery = {};
                var aParams = oLocation.search.substring(1).split("&");
                for (var i = 0; i < aParams.length; i++) {
                    var aPair = aParams[i].split("=");
                    oQuery[aPair[0]] = decodeURIComponent(aPair[1]);
                }
                return oQuery;

            },
            onVote: function() {

                var sDialogName = "NomineeDialog";
                this.mDialogs = this.mDialogs || {};
                var oDialog = this.mDialogs[sDialogName];

                if (!oDialog) {
                    oDialog = new NomineeDialog(this.getView());
                    this.mDialogs[sDialogName] = oDialog;

                    // For navigation.
                    oDialog.setRouter(this.oRouter);
                }
                oDialog.open();
            },

            onSetFullScreen: function() {
                //  this.setFCLFullScreenMode(true);
                sap.ui.getCore().getEventBus().publish("flexible", "setColumnFullScreen", {
                    id: this.getView().getId()
                });
            },

            onExitFullScreen: function() {
                //   this.setFCLFullScreenMode(false);
                // var oI18n = this.getResourceBundle();
                sap.ui.getCore().getEventBus().publish("flexible", "setColumnExitScreen");

            },

            _loadData: function(sChannel, sEvent, oData) {
                console.log(oData);
                this._setModel("/category", oData.Category, "CategoryModel");
                var oView = this.getView();
                var nomineeLayout = this.byId("NomineeLayout");
                nomineeLayout.removeAllContent();
                var getCategoryURL = this.getOwnerComponent().getManifestEntry("/sap.app/dataSources/Nominee")
                var serviceURL = getCategoryURL + "?ACTIONID=GET_NOMINEE&MVPCategoryId=" + oData.Category.MVPCategoryId;
                var oControl = this;

                //get nominees
                MVPApi.get(serviceURL, null).then(function(data) {
                    var nominees = JSON.parse(data).MVPNominees;
                    var userName = JSON.parse(data).Userid

                    oControl._setModel("/nominees", nominees, "NomineeModel");
                    oControl._setModel("/nomineescount", nominees.length, "NomineeModel");
                    if (nominees.length > 0) {
                        for (var i = 0; i < nominees.length; i++) {
                            var cardFragment = sap.ui.xmlfragment("com.sap.build.leonardo.votingApp.fragment.Card", oControl);
                            cardFragment.setModel(new JSONModel({
                                "Nominee": nominees[i],
                                //edit or not
                                "mode": nominees[i].MVPNominatedBy.toUpperCase() == userName.userEmailId.toUpperCase(),
                                "voted": true
                            }), "Nominee");

                            oView.addDependent(cardFragment);
                            nomineeLayout.addContent(cardFragment);
                        }
                    }
                });
                //get Results;
                serviceURL=this.getOwnerComponent().getManifestEntry("/sap.app/dataSources/NomineeResults")+"?MVPCategoryId="+oData.Category.MVPCategoryId;
                MVPApi.get(serviceURL,null).then(function(data){
                    var nomineeResults = JSON.parse(data);
                    oControl._setModel("/", nomineeResults, "NomineeResultModel");
                    oControl.initViz();
                });
            },
            initViz:function(){
            var oCountryVizFrame = this._constants.vizFrames.result;
            var oAnalysisObject = new sap.viz.ui5.controls.common.feeds.AnalysisObject(oCountryVizFrame.analysisObjectProps);
            var aValues = oCountryVizFrame.feedItems[1].values;
            if (aValues.length === 0) {
                aValues.push(oAnalysisObject);
            }

            var oContent = new sap.suite.ui.commons.ChartContainerContent({
                icon: oCountryVizFrame.icon,
                title: oCountryVizFrame.title
            });
            oContent.setContent(this._createVizFrame(this._constants.vizFrames.result));
            var oChartContainer = this.getView().byId(this._constants.chartContainerId);
            oChartContainer.removeAllContent();
            oChartContainer.addContent(oContent);


            },
            _createVizFrame:function(vizFrameConfig){
             var oVizFrame = new sap.viz.ui5.controls.VizFrame(this._constants.vizFrames.config);
            var oModel = this.getModel("NomineeResultModel");   
            var oDataSet = new sap.viz.ui5.data.FlattenedDataset(vizFrameConfig.dataset);
            oVizFrame.setDataset(oDataSet);
            oVizFrame.setModel(oModel);
            this._addFeedItems(oVizFrame, vizFrameConfig.feedItems);
            oVizFrame.setVizType(vizFrameConfig.vizType);
            return oVizFrame;
            },
            _addFeedItems: function(vizFrame, feedItems) {
            for (var i = 0; i < feedItems.length; i++) {
                vizFrame.addFeed(new sap.viz.ui5.controls.common.feeds.FeedItem(feedItems[i]));
            }
        },
            onAddNominee: function() {
                var oView = this.getView();
                var dialog = oView.byId("addDialog");
                if (!dialog) {
                    // create dialog via fragment factory
                    dialog = sap.ui.xmlfragment(oView.getId(), "com.sap.build.leonardo.votingApp.fragment.EditPage", this);
                    this.addDialog = dialog;
                    oView.addDependent(dialog);
                }
                dialog.open();
            },
            onSubmitNominee: function() {

                //validation



                this._saveNominee(this.getModel("EditNomineeModel").getData());

            },


            _saveNominee: function(newNominee) {
                newNominee.MVPCategoryId = this.getModel("CategoryModel").getData().category.MVPCategoryId; 
                var NomineeURL = this.getOwnerComponent().getManifestEntry("/sap.app/dataSources/Nominee")
                var serviceURL = NomineeURL + "?ACTIONID=CREATE_NOMINEE";
                var oControl = this;
                MVPApi.post(serviceURL,newNominee).done(function(data){
                    console.log(data);
                    oControl.addDialog.close();
                    MessageToast.show("Nominee has been created", {
                        duration: 1000,
                        onClose:function(){
                            oControl.showBusyDialog();
                        }
                    });
                });

            },

            onEditNominee: function(oEvent) {
                var oView = this.getView();
                var dialog = oView.byId("addDialog");
                if (!dialog) {
                    // create dialog via fragment factory
                    dialog = sap.ui.xmlfragment(oView.getId(), "com.sap.build.leonardo.votingApp.fragment.EditPage", this);
                    oView.addDependent(dialog);
                }
                dialog.open();
            },

            onTest: function() {
                alert("test");
            },
            onDeleteNominee: function(oEvent) {
                var targetNomineeId = oEvent.getSource().data("NomineeId");
                var targetNomineeName = oEvent.getSource().data("NomineeName");
                var oView = this.getView();
                var dialog = oView.byId("deleteDialog");
                if (!dialog) {
                    // create dialog via fragment factory
                    dialog = sap.ui.xmlfragment(this.createId("deleteDialog"), "com.sap.build.leonardo.votingApp.fragment.NomineeDelete", this);
                    this.deleteDialog = dialog;
                    oView.addDependent(dialog);
                }

                dialog.setModel(new JSONModel({
                    NomineeId: targetNomineeId,
                    NomineeName: targetNomineeName
                }), "Nominee");

                this.setModel(new JSONModel({
                    NomineeId: targetNomineeId,
                    NomineeName: targetNomineeName
                }), "targetDeleteNominee");

                dialog.open();
            },

            onVoteNominee: function(oEvent) {

                var targetNomineeId = oEvent.getSource().data("NomineeId");
                var targetNomineeName = oEvent.getSource().data("NomineeName");
                var oView = this.getView();
                var dialog = oView.byId("voteDialog");
                if (!dialog) {
                    // create dialog via fragment factory
                    dialog = sap.ui.xmlfragment(this.createId("voteDialog"), "com.sap.build.leonardo.votingApp.fragment.NomineeVote", this);
                    this.voteDialog = dialog;
                    oView.addDependent(dialog);
                }

                dialog.setModel(new JSONModel({
                    NomineeId: targetNomineeId,
                    NomineeName: targetNomineeName
                }), "Nominee");

                this.setModel(new JSONModel({
                    NomineeId: targetNomineeId,
                    NomineeName: targetNomineeName
                }), "targetDeleteNominee");

                dialog.open();

            },
            onVoteConfirm: function() {
                this.voteDialog.close();

            },
            onVoteCancel: function() {

                this.voteDialog.close();
            },
            onDeleteNomineeConfirm: function() {
                var deleteNominee = this.getModel("targetDeleteNominee").getData();
                //MPIApi.delete("")
                this.deleteDialog.close();
            },
            onCloseDeleteDialog: function() {
                this.deleteDialog.close();
            },
            initModels: function() {
                var CategoryModel = new JSONModel({});
                this.setModel(CategoryModel, "CategoryModel");
                var NomineeModel = new JSONModel({});
                this.setModel(NomineeModel, "NomineeModel");

                var EditNomineeModel = new JSONModel({
                    "MVPNomineeId":null,
                    "MVPNomineeName": null,
                    "MVPNomineeAvatarFileName": "",
                    "MVPNomineeAvatarFileNameExtn": "",
                    "MVPNomineeAvatarFileData": null,
                    "MVPNomineeAbstract": "New",
                    "MVPNomineeKeyAchievements": null,
                    "MVPNomineeCustomerQuotes": null,
                    "MVPNominatedBy": null,
                    "MVPNominatedOn": null,
                    "MVPNomineeChangedBy": null,
                    "MVPNomineeChangedOn": null
                });
                this.setModel(EditNomineeModel, "EditNomineeModel")
            },
            onInit: function() {
                //init Model
                this.initModels();
                sap.ui.getCore().getEventBus().subscribe("Page", "loadData", this._loadData, this);
                this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                this.oRouter.getTarget("Page").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));
                var cardManifests = new sap.ui.model.json.JSONModel();
                cardManifests.loadData(sap.ui.require.toUrl("com/sap/build/leonardo/votingApp/public/manifests.json"));
                this.getView().setModel(cardManifests, "manifests");

            }
        });
    }, /* bExport= */ true);