sap.ui.define(
    [
        "com/sap/build/leonardo/votingApp/controller/BaseController",
        "sap/m/MessageToast",
        "./dialogs/NomineeDialog",
        "./utilities",
        "sap/ui/core/routing/History",
        "sap/ui/model/json/JSONModel",
        "com/sap/build/leonardo/votingApp/service/formatter",
        "com/sap/build/leonardo/votingApp/service/MVPApi",
        "sap/m/MessageBox",
        "com/sap/build/leonardo/votingApp/model/models"
    ],
    function(BaseController, MessageToast, NomineeDialog, Utilities, History, JSONModel, formatter, MVPApi, MessageBox,constants) {
        "use strict";
        return BaseController.extend("com.sap.build.leonardo.votingApp.controller.Page", {
            formatter: formatter,
            // charts
            _constants: {
                chartContainerId: "chartContainer",
                vizFrames: {
                    config: {
                        height: "700px",
                        width: "90%",
                        uiConfig: {
                            applicationSet: "fiori"
                        }
                    },
                    result: {
                        icon: "sap-icon://vertical-bar-chart",
                        title: {
                            text: "MVP Votes"
                        },
                        dataset: {
                            dimensions: [{
                                name: "Nominees",
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
                            values: ["Votes"]
                        }, {
                            uid: "axisLabels",
                            type: "Dimension",
                            values: []
                        }],
                        analysisObjectProps: {
                            uid: "Nominees",
                            type: "Dimension",
                            name: "Nominees"
                        },
                        vizType: "bar"
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

            onRefresh: function() {


                //location.reload() 
                MVPApi.get("/mvp-ui/",null).then(function(data){
                    console.log(data);
                })
                if (this.getModel("CategoryModel").getProperty("/category") == null) {
                    var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;

                    MessageBox.error(
                        "Sorry, there was an error. Please refresh the app.", {
                            styleClass: bCompact ? "sapUiSizeCompact" : ""
                        });
                } else {

                    var mvpCategoryId = this.getModel("CategoryModel").getProperty("/category").MVPCategoryId;
                    this.bus = sap.ui.getCore().getEventBus();
                    this.bus.publish("Master", "loadData", {
                        refresh: true
                    });
                    this.refreshCategory(mvpCategoryId);
                }

            },

            onSetFullScreen: function() {
                //  this.setFCLFullScreenMode(true);
                sap.ui.getCore().getEventBus().publish("flexible", "setColumnFullScreen", {
                    id: this.getView().getId()
                });
                this.byId("setFullScreen").setVisible(false);
                this.byId("exitFullScreen").setVisible(true);
            },

            onExitFullScreen: function() {
                //   this.setFCLFullScreenMode(false);
                // var oI18n = this.getResourceBundle();
                sap.ui.getCore().getEventBus().publish("flexible", "setColumnExitScreen");

                this.byId("setFullScreen").setVisible(true);
                this.byId("exitFullScreen").setVisible(false);
            },

            _loadData: function(sChannel, sEvent, oData) {
                //console.log(oData);
                this.showBusyDialog();
                var categoryData = oData.Category;
                var userInfo = oData.UserInfo;
                var nominationMode=false;
                if ((userInfo.userRole == constants.SUPER||userInfo.userRole==constants.CHIEF)&&categoryData.MVPCategoryNominationStatus=="OPEN_FOR_NOMINATION") {
                    nominationMode=true;
                }
                this._setModel("/category", categoryData, "CategoryModel");
                this._setModel("/nominationMode", nominationMode, "CategoryModel");

                this.refreshData(oData.Category.MVPCategoryId);
            },

            refreshData: function(mvpCategoryId) {
                var oView = this.getView();
                var nomineeLayout = this.byId("NomineeCarouselLayout");
                nomineeLayout.removeAllPages();
                var getCategoryURL = this.getOwnerComponent().getManifestEntry("/sap.app/dataSources/Nominee");
                var serviceURL = getCategoryURL + "?ACTIONID=GET_NOMINEE&MVPCategoryId=" + mvpCategoryId;
                var oControl = this;

                //diable all vote if the status is  not open

                var votingMode = this.getModel("CategoryModel").getData().category.MVPCategoryVotingStatus;
                var nominationMode = this.getModel("CategoryModel").getData().category.MVPCategoryNominationStatus;
                var votingSMMode = this.getModel("CategoryModel").getData().category.MVPCategoryVoteMode;
                //get nominees
                MVPApi.get(serviceURL, null)
                    .fail(function(data) {
                        var categories = JSON.parse(data.responseText);
                        var bCompact = !!oControl.getView().$().closest(".sapUiSizeCompact").length;

                        //console.log(categories)
                        MessageBox.error(
                            categories.Response.Text, {
                                styleClass: bCompact ? "sapUiSizeCompact" : ""
                            });
                    })
                    .then(function(data) {
                        var nominees = JSON.parse(data).MVPNominees;
                        var userInfo = JSON.parse(data).Userid;

                        oControl._setModel("/nominees", nominees, "NomineeModel");
                        oControl._setModel("/nomineescount", nominees.length, "NomineeModel");
                        oControl._setModel("/nomineeLabel", nominees.length, "NomineeModel");
                        oControl._setModel("/state", false, "NomineeModel");
                        // super has everything see result any time
                        // chief  see results only after closed_for_voting
                        // teamlead only vote

					// got the data 
					/* var voteString = data.MVPVotesNumber[0] + "Of " + data.TotalNUmber;
					                         oControl._setModel("/voteStatus", voteString, "NomineeModel");
*/
					

                        var showResultsValue= false 
                        oControl._setModel("/userInfo", userInfo, "NomineeModel");

                        if (votingMode === "CLOSED_FOR_VOTING"&&userInfo.userRole==constants.CHIEF) {
                            showResultsValue=true
                        } else {
                            showResultsValue=false
                        }
                        if(userInfo.userRole==constants.SUPER)
                        {
                         showResultsValue=true
                        }
                         oControl._setModel("/showResults", showResultsValue, "NomineeModel");


                        //get nominee
                        if (nominees.length > 0) {
                            for (var i = 0; i < nominees.length; i++) {
                                var cardFragment = sap.ui.xmlfragment("com.sap.build.leonardo.votingApp.fragment.Card", oControl);
                                if (nominees[i].MVPNomineeAvatarFileData === "" || nominees[i].MVPNomineeAvatarFileData === null || nominees[i].MVPNomineeAvatarFileData ===
                                    "null" || nominees[i].MVPNomineeAvatarFileData === "[object Object]") {
                                    nominees[i].MVPNomineeAvatarFileData = "https://assets0-jam4.sapjam.com/images/personShadow330x330.png?412166170dd5ef6b7f4c6dfdf2c5ac57230";
                                }

                                var editMode =nominees[i].MVPNominatedBy.toUpperCase() === userInfo.userEmailId.toUpperCase();
                                if(userInfo.userRole==constants.SUPER)
                                {
                                    editMode=true
                                }
                                var visibleMode = false;
                                
                                if (votingMode === "CLOSED_FOR_VOTING") {
                                    visibleMode = nominees[i].HAS_VOTED;
                                }
                                else if(votingMode === "OPEN_FOR_VOTING")
                                {
                                    visibleMode = true;
                                     if(votingSMMode=="SINGLE")
                                    {
                                        for(var j=0;j<nominees.length;j++)
                                        {
                                            if(nominees[j].HAS_VOTED==true&&i!=j)
                                            {
                                                visibleMode=false;
                                                break;
                                            }
                                        }

                                    }
                                }
                                cardFragment.setModel(new JSONModel({
                                    "Nominee": nominees[i],
                                    //edit or not
                                    "mode": editMode,
                                    "voted": votingMode === "OPEN_FOR_VOTING" ? nominees[i].HAS_VOTED : true,
                                    "visible": visibleMode,
                                    "categoryNominationStatus": nominationMode,
                                    "userRole":userInfo.userRole
                                }), "Nominee");

                                oView.addDependent(cardFragment);
                                nomineeLayout.addPage(cardFragment);
                            }
                        }
                        oControl.hideBusyDialog();
                    });
                //get Results;Voting Data
                serviceURL = this.getOwnerComponent().getManifestEntry("/sap.app/dataSources/NomineeResults") + "?MVPCategoryId=" + mvpCategoryId;
                MVPApi.get(serviceURL, null).then(function(data) {
                    var nomineeResults = JSON.parse(data);
                    oControl._setModel("/", nomineeResults, "NomineeResultModel");
                    oControl.initViz();
		var newData = {"totalVotingNumber":nomineeResults.MVPVotingData[0],"votedNumber":nomineeResults.MVPVotingData[1]};
                    oControl._setModel("/votingData",newData,"NomineeResultModel");


                });

            },
            initViz: function() {
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
            vizSelected:function(oEvent)
            {	
            	
            },
            
            _createVizFrame: function(vizFrameConfig) {
                var oVizFrame = new sap.viz.ui5.controls.VizFrame(this._constants.vizFrames.config);
                var oModel = this.getModel("NomineeResultModel");
                var oDataSet = new sap.viz.ui5.data.FlattenedDataset(vizFrameConfig.dataset);
                oVizFrame.setDataset(oDataSet);
                oVizFrame.setModel(oModel);
                var oControl =this;
                oVizFrame.attachSelectData(function(oEvent){
                	oControl.vizSelected(oEvent);
                });

                oVizFrame.setVizProperties({
                    plotArea: {
                        dataLabel: {
                            visible: true
                        }
                    },
                    title: {
                        visible: false,
                        text: "MVP Votes"
                    }
                });

	                this._addFeedItems(oVizFrame, vizFrameConfig.feedItems);
                oVizFrame.setVizType(vizFrameConfig.vizType);
                this.oVizFrame = oVizFrame;
                return oVizFrame;
            },
            _addFeedItems: function(vizFrame, feedItems) {
                for (var i = 0; i < feedItems.length; i++) {
                    vizFrame.addFeed(new sap.viz.ui5.controls.common.feeds.FeedItem(feedItems[i]));
                }
            },
            onAddNominee: function() {
                if (this.addDialog) {
                    this.addDialog.destroy();
                }
                // new one 
                var EditNomineeModel = new JSONModel({
                    "MVPNomineeId": null,
                    "MVPNomineeName": null,
                    "MVPNomineeAvatarFileName": "",
                    "MVPNomineeAvatarFileNameExtn": "",
                    "MVPNomineeAvatarFileData": "https://assets0-jam4.sapjam.com/images/personShadow330x330.png?412166170dd5ef6b7f4c6dfdf2c5ac57230",
                    "MVPNomineeAbstract": " ",
                    "MVPNomineeKeyAchievements": null,
                    "MVPNomineeCustomerQuotes": null,
                    "MVPNominatedBy": null,
                    "MVPNominatedOn": null,
                    "MVPNomineeChangedBy": null,
                    "MVPNomineeChangedOn": null,
                    "valueState": "None"
                });
                this.setModel(EditNomineeModel, "EditNomineeModel");
                var editNominate = this.getModel("EditNomineeModel").getData();
                editNominate.mode = "Add";
                var oView = this.getView();
                var dialog = oView.byId("addDialog");
                if (!dialog) {
                    // create dialog via fragment factory
                    dialog = sap.ui.xmlfragment(oView.getId(), "com.sap.build.leonardo.votingApp.fragment.EditPage", this);
                    this.addDialog = dialog;
                    oView.addDependent(dialog);
                }
                dialog.open();
                this.initUpload();

            },
            onSubmitNominee: function() {
                //validation

                if (this.getModel("EditNomineeModel").getProperty("/MVPNomineeName") === null || this.getModel("EditNomineeModel").getProperty(
                        "/MVPNomineeName") === "") {

                    this.getModel("EditNomineeModel").setProperty("/valueState", "Error");

                } else {
                    if (this.getModel("EditNomineeModel").getProperty("/mode") === "Add") {
                        this._saveNominee(this.getModel("EditNomineeModel").getData());
                    } else {
                        this._updateNominee(this.getModel("EditNomineeModel").getData());
                    }

                }

            },

            onNameChange: function(oEvent) {
                if (oEvent.getParameter("newValue") === null || oEvent.getParameter("newValue") === "") {
                    this.getModel("EditNomineeModel").setProperty("/valueState", "Error");
                } else if (oEvent.getParameter("newValue").length > 0) {
                    this.getModel("EditNomineeModel").setProperty("/valueState", "None");
                }
            },
            _updateNominee: function(editNominee) {
                var NomineeURL = this.getOwnerComponent().getManifestEntry("/sap.app/dataSources/Nominee");
                var serviceURL = NomineeURL + "?ACTIONID=UPDATE_NOMINEE&MVPCategoryId=" + editNominee.MVPCategoryId;
                var oControl = this;
                oControl.showBusyDialog();
                MVPApi.put(serviceURL, editNominee)
                    .fail(function(data) {
                        oControl.addDialog.close();
                        oControl.hideBusyDialog();
                        var errorText = JSON.parse(data.responseText);
                        var bCompact = !!oControl.getView().$().closest(".sapUiSizeCompact").length;
                        MessageBox.error(
                            errorText.Response.Text, {
                                styleClass: bCompact ? "sapUiSizeCompact" : ""
                            }
                        );
                    })
                    .done(function(data) {
                        data = JSON.parse(data);
                        oControl.addDialog.close();
                        oControl.showMessageToast(data.Response.Text);
                        oControl.refreshData(editNominee.MVPCategoryId);
                        oControl.hideBusyDialog();

                    });
            },
            refreshCategory: function(categoryId) {
                var getCategoryURL = this.getOwnerComponent().getManifestEntry("/sap.app/dataSources/Category");
                //init Model

                getCategoryURL = getCategoryURL + "&MVPCategoryId=" + categoryId;
                var CategoryModel = new JSONModel({});
                this.setModel(CategoryModel, "CategoryModel");
                var oControl = this;
                MVPApi.get(getCategoryURL, null).then(function(data) {
                    var categories = JSON.parse(data);
                    if (categories.Response.CODE == "SUCCESS") {
                        //console.log(categories);
                        var nominationMode=false;
                        if (categories.MVPCategories[0].MVPCategoryNominationStatus == 'OPEN_FOR_NOMINATION'&&(categories.Userid.userRole==constants.SUPER||categories.Userid.userRole==constants.CHIEF)) {
                                nominationMode=true;
                        }
                        oControl._setModel("/category", categories.MVPCategories[0], "CategoryModel");
                        oControl._setModel("/nominationMode", nominationMode, "CategoryModel");
                        oControl.refreshData(categoryId);

                    }
                });

            },

            _saveNominee: function(newNominee) {
                newNominee.MVPCategoryId = this.getModel("CategoryModel").getData().category.MVPCategoryId;
                newNominee.MVPNominatedOn = new Date();
                newNominee.MVPNominatedBy = this.getModel("NomineeModel").getProperty("/userInfo").userEmailId;
                newNominee.MVPNomineeChangedOn = new Date();
                newNominee.MVPNomineeChangedBy = this.getModel("NomineeModel").getProperty("/userInfo").userEmailId;
                if (newNominee.MVPNomineeCustomerQuotes == "" || newNominee.MVPNomineeCustomerQuotes == null) {
                    newNominee.MVPNomineeCustomerQuotes = " ";
                }

                if (newNominee.MVPNomineeKeyAchievements == "" || newNominee.MVPNomineeKeyAchievements == null) {
                    newNominee.MVPNomineeKeyAchievements = " ";
                }

                if (newNominee.MVPNomineeAbstract == "" || newNominee.MVPNomineeAbstract == null) {
                    newNominee.MVPNomineeAbstract = " ";
                }

                var NomineeURL = this.getOwnerComponent().getManifestEntry("/sap.app/dataSources/Nominee")
                var serviceURL = NomineeURL + "?ACTIONID=CREATE_NOMINEE&MVPCategoryId=" + newNominee.MVPCategoryId;

                var oControl = this;
                oControl.showBusyDialog();
                MVPApi.post(serviceURL, newNominee).done(function(data) {
                    data = JSON.parse(data);
                    oControl.addDialog.close();
                    oControl.showMessageToast(data.Response.Text)
                    oControl.refreshData(newNominee.MVPCategoryId);
                });

            },
            showMessageToast: function(messageText) {
                MessageToast.show(messageText, {
                    duration: 1000,
                    onClose: function() {}
                });
            },

            onEditNominee: function(oEvent) {
                if (this.addDialog) {
                    this.addDialog.destroy();
                }
                var editNominate = this.getModel("EditNomineeModel").getProperty("/");
                editNominate.mode = "Edit";
                var targetNomineeId = oEvent.getSource().data("NomineeId");
                var nominees = this.getModel("NomineeModel").getProperty("/nominees");
                if (nominees.length > 0) {
                    $.map(nominees, function(value) {
                        if (value.MVPNomineeId == targetNomineeId) {
                            editNominate = value;
                            editNominate.mode = "Edit";
                        }
                    })
                }
                this.getModel("EditNomineeModel").setProperty("/", editNominate);
                var oView = this.getView();
                var dialog = oView.byId("addDialog");
                if (!dialog) {
                    // create dialog via fragment factory
                    dialog = sap.ui.xmlfragment(oView.getId(), "com.sap.build.leonardo.votingApp.fragment.EditPage", this);
                    this.addDialog = dialog;
                    oView.addDependent(dialog);
                }
                dialog.open();
                this.initUpload();
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
                this.setModel(new JSONModel({
                    NomineeId: targetNomineeId,
                    NomineeName: targetNomineeName
                }), "TargetNominee");
                dialog.setModel(new JSONModel({
                    NomineeId: targetNomineeId,
                    NomineeName: targetNomineeName
                }), "Nominee");
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

                this.voteDialog.oKevinEvent = oEvent.getSource();
                dialog.setModel(new JSONModel({
                    NomineeId: targetNomineeId,
                    NomineeName: targetNomineeName
                }), "Nominee");

                this.setModel(new JSONModel({
                    NomineeId: targetNomineeId,
                    NomineeName: targetNomineeName
                }), "TargetNominee");
                dialog.open();

            },
            onVoteConfirm: function() {

                var mvpCategoryId = this.getModel("CategoryModel").getData().category.MVPCategoryId;
                var NomineeURL = this.getOwnerComponent().getManifestEntry("/sap.app/dataSources/Nominee")
                var serviceURL = NomineeURL + "?ACTIONID=VOTE_NOMINEE&MVPCategoryId=" + mvpCategoryId;

                var postData = {
                    MVPNomineeId: this.getModel("TargetNominee").getProperty("/NomineeId")
                }
                var oControl = this;
                oControl.showBusyDialog();
                MVPApi.post(serviceURL, postData).fail(function(data) {
                    console.log(data);

                    oControl.voteDialog.oKevinEvent.setPressed(false);

                    oControl.voteDialog.close();

                    var errorText = JSON.parse(data.responseText);
                    oControl.hideBusyDialog();
                    var bCompact = !!oControl.getView().$().closest(".sapUiSizeCompact").length;
                    MessageBox.error(
                        errorText.Response.Text, {
                            styleClass: bCompact ? "sapUiSizeCompact" : ""
                        }
                    );
                }).done(function(data) {
                    data = JSON.parse(data);
                    oControl.voteDialog.close();

                    oControl.showMessageToast(data.Response.Text)
                    oControl.refreshData(mvpCategoryId);
                    oControl.hideBusyDialog();
                });

            },
        
            onVoteCancel: function() {
                //console.log();
                this.voteDialog.oKevinEvent.setPressed(false);

                this.voteDialog.close();
            },
            onDeleteNomineeConfirm: function() {
                var mvpCategoryId = this.getModel("CategoryModel").getData().category.MVPCategoryId;
                var NomineeURL = this.getOwnerComponent().getManifestEntry("/sap.app/dataSources/Nominee")
                var serviceURL = NomineeURL + "?ACTIONID=DELETE_NOMINEE&MVPCategoryId=" + mvpCategoryId;

                var postData = {
                    MVPNomineeId: this.getModel("TargetNominee").getProperty("/NomineeId")
                }
                var oControl = this;
                oControl.showBusyDialog();
                MVPApi.post(serviceURL, postData).fail(function(data) {
                    oControl.deleteDialog.close();
                    oControl.hideBusyDialog();
                    var errorText = JSON.parse(data.responseText);
                    var bCompact = !!oControl.getView().$().closest(".sapUiSizeCompact").length;
                    MessageBox.error(
                        errorText.Response.Text, {
                            styleClass: bCompact ? "sapUiSizeCompact" : ""
                        }
                    );
                }).done(function(data) {
                    oControl.deleteDialog.close();
                    data = JSON.parse(data);
                    oControl.showMessageToast(data.Response.Text)
                    oControl.refreshData(mvpCategoryId);
                    oControl.hideBusyDialog();
                });
                this.deleteDialog.close();
            },
            onCloseDeleteDialog: function() {
                this.deleteDialog.close();
            },

            onCloseNominee: function() {
                this.addDialog.close()

            },
            initModels: function() {
                var CategoryModel = new JSONModel({});
                this.setModel(CategoryModel, "CategoryModel");
                var NomineeModel = new JSONModel({});
                this.setModel(NomineeModel, "NomineeModel");

                var EditNomineeModel = new JSONModel({
                    "MVPNomineeId": null,
                    "MVPNomineeName": null,
                    "MVPNomineeAvatarFileName": "",
                    "MVPNomineeAvatarFileNameExtn": "",
                    "MVPNomineeAvatarFileData": "https://assets0-jam4.sapjam.com/images/personShadow330x330.png?412166170dd5ef6b7f4c6dfdf2c5ac57230",
                    "MVPNomineeAbstract": "New",
                    "MVPNomineeKeyAchievements": null,
                    "MVPNomineeCustomerQuotes": null,
                    "MVPNominatedBy": null,
                    "MVPNominatedOn": null,
                    "MVPNomineeChangedBy": null,
                    "MVPNomineeChangedOn": null
                });
                this.setModel(EditNomineeModel, "EditNomineeModel");
            },
            //init upload
            initUpload: function() {
                //init upload 

                var oControl = this;
                var uploadControl = this.byId("fileUploader");
                uploadControl.attachBrowserEvent("change", function(oEvent) {
                    var reader = new FileReader();
                    if (!!(window.File) && !!(window.FileReader) && !!(window.FileList) && !!(window.Blob)) {
                        var files = oEvent.target.files;
                        if (files !== undefined) {
                            var fileExtn = files[0].name.substr(files[0].name.indexOf('.') + 1, files[0].name.length);
                            if (fileExtn.toUpperCase() === 'JPG' || fileExtn.toUpperCase() === 'PNG' || fileExtn.toUpperCase() === 'JPEG') {
                                if (files[0].size / 1024 / 1024 < 0.6) {
                                    reader.onload = function(oEvent) {
                                        oControl.byId("image_preview").setSrc(oEvent.target.result);
                                        var image = oControl.byId("image_preview").getSrc();
                                        oControl.getModel("EditNomineeModel").setProperty("/MVPNomineeAvatarFileData", image);
                                        // console.log(oControl.getModel("EditNomineeModel").getData());
                                        // MessageToast.show("Image Uploaded");
                                        //document.getElementById("midView--image_preview").src = oEvent.target.result;
                                    };
                                } else {
                                    MessageToast.show("Please select a file less than 0.5 MB size.");
                                }
                            } else {
                                MessageToast.show("The file type *." + fileExtn + " is not supported. Choose one of the following types: JPG, PNG, JPEG.");
                            }
                            reader.readAsDataURL(oEvent.target.files.item(0));
                        }
                    }
                });
            },
            onInit: function() {
                //init Model
                this.initModels();
                sap.ui.getCore().getEventBus().subscribe("Page", "loadData", this._loadData, this);
                this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                this.oRouter.getTarget("Page").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));

            },
            onHelp: function() {
                window.open("mailto:kevin.yang02@sap.com;ashok.kumar.m01@sap.com?subject=CoE MVP App | Help/Feedback","_self");

            }
        });
    }, /* bExport= */ true);