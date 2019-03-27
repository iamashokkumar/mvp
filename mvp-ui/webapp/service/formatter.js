sap.ui.define([
	"sap/ui/core/ValueState",
], function (ValueState) {
	"use strict";

	return {
		formatDate: function (fValue) {
			var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
				style: "medium/short"
			});
			if (fValue) {
				return oDateFormat.format(new Date(fValue));
			}
		},

		nominationStatus: function (sNominationStatus) {
			switch (sNominationStatus) {
			case "NOT_OPEN_FOR_NOMINATION":
				return 2;
			case "OPEN_FOR_NOMINATION":
				return 8;
			case "CLOSED_FOR_NOMINATION":
				return 3;
			}
		},

		votingStatus: function (sVotingStatus) {
			switch (sVotingStatus) {
			case "NOT_OPEN_FOR_VOTING":
				return 3;
			case "OPEN_FOR_VOTING":
				return 8;
			case "CLOSED_FOR_VOTING":
				return 2;
			}
		},

		nominationStatusMaster: function (sNominationStatus) {
			switch (sNominationStatus) {
			case "NOT_OPEN_FOR_NOMINATION":
				return "Error";
			case "OPEN_FOR_NOMINATION":
				return "Success"
			case "CLOSED_FOR_NOMINATION":
				return "Warning"
			}
		},

		votingStatusMaster: function (sVotingStatus) {
			switch (sVotingStatus) {
			case "NOT_OPEN_FOR_VOTING":
				return "Error";
			case "OPEN_FOR_VOTING":
				return "Success"
			case "CLOSED_FOR_VOTING":
				return "Warning"
			}
		},

		enableNomineeModification: function (sMVPCategoryNominationStatus, sHasVoted) {
			var isModificationAllowed = false;
			if (sMVPCategoryNominationStatus === 'OPEN_FOR_NOMINATION' && sHasVoted == false) {
				isModificationAllowed = true;
			}
			return isModificationAllowed;
		}
	}

});