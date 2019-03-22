sap.ui.define([
    "sap/m/SplitContainer",
    "sap/ui/Device",
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History"
], function(SplitContainer, Device, Controller, History) {
    "use strict";

    return Controller.extend("com.sap.build.leonardo.votingApp.controller.FlexibleColumnLayout", {

        onInit: function() {
            this.bus = sap.ui.getCore().getEventBus();
            if (!this.beginView) {
                this.beginView = sap.ui.view({
                    id: "beginView",
                    viewName: "com.sap.build.leonardo.votingApp.view.MasterPage",
                    type: "XML"
                });
            }

            if (!this.midView) {
                this.midView = sap.ui.view({
                    id: "midView",
                    viewName: "com.sap.build.leonardo.votingApp.view.Page",
                    type: "XML"
                });
            }
            this.oFlexibleColumnLayout = this.getView().byId("fcl");
            this.oFlexibleColumnLayout.addBeginColumnPage(this.beginView);
            this.oFlexibleColumnLayout.addMidColumnPage(this.midView);
             this.oFlexibleColumnLayout.setLayout(sap.f.LayoutType.TwoColumnsMidExpanded);
            this.bus.subscribe("flexible", "setMidPage", this.setMidPage, this);
            this.bus.subscribe("flexible", "setColumnFullScreen", this.setColumnFullScreen, this);
            this.bus.subscribe("flexible", "setColumnExitScreen", this.setColumnExitScreen, this);
            this.bus.subscribe("flexible", "closeColumn", this.onCloseColumn, this);
        },

        onExit: function() {
            this.bus.unsubscribe("flexible", "setMidPage", this.setMidPage, this);
            this.bus.unsubscribe("flexible", "setColumnFullScreen", this.setColumnFullScreen, this);
            this.bus.unsubscribe("flexible", "setColumnExitScreen", this.setColumnExitScreen, this);
            this.bus.unsubscribe("flexible", "closeColumn", this.onCloseColumn, this);
            this.midColumnComponent = null;
            this.midView = null;
        },

        setMidPage: function() {
            this.oFlexibleColumnLayout = this.getView().byId("fcl");
            if (!this.midColumnComponent) {
                this.midColumnComponent = sap.ui.getCore().createComponent({
                    name: "com.sap.build.leonardo.votingApp.creation"
                });
            }
            if (!this.midView) {
                this.midView = this.midColumnComponent.objectView;
            }
            this.midColumnViewId = this.midView.getId();
            this.oFlexibleColumnLayout.addMidColumnPage(this.midView);
            this.oFlexibleColumnLayout.setLayout(sap.f.LayoutType.TwoColumnsMidExpanded);
        },
        setColumnFullScreen: function() {
            this.oFlexibleColumnLayout.setLayout(sap.f.LayoutType.MidColumnFullScreen);
        },
        setColumnExitScreen: function() {
            this.oFlexibleColumnLayout.setLayout(sap.f.LayoutType.TwoColumnsMidExpanded);
        },
        onExitFullScreen: function() {
            // if (!this.beginView) {
            //     this.beginView = sap.ui.view({
            //         id: "beginView",
            //         viewName: "sap.grc.pm.consumer.view.Worklist",
            //         type: "XML"
            //     });
            // }
            // this.oFlexibleColumnLayout.addBeginColumnPage(this.beginView);
        },


        onCloseColumn: function() {
            this.oFlexibleColumnLayout.setLayout(sap.f.LayoutType.OneColumn);

        }
    });

}, true);