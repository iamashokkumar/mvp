sap.ui.define([], function () {
	"use strict";

	return {
		/**
		 * Rounds the currency value to 2 digits
		 *
		 * @public
		 * @param {string} sValue value to be formatted
		 * @returns {string} formatted currency value with 2 digits
		 */
		currencyValue: function (sValue) {
			if (!sValue) {
				return "";
			}

			return parseFloat(sValue).toFixed(2);
		},

		nominationStatus: function (sNominationStatus) {
			switch (sNominationStatus) {
			case "NOT_OPEN_FOR_NOMINATION":
				return 2;
			case "OPEN_FOR_NOMINATION":
				return 8;
			case "CLOSED_FOR_NOMINATION";
				return 3;
			}
		},
		
		votingStatus: function (sVotingStatus) {
			switch (sVotingStatus) {
			case "NOT_OPEN_FOR_VOTING":
				return 2;
			case "OPEN_FOR_VOTING":
				return 8;
			case "CLOSED_FOR_VOTING";
				return 3;
			}
		}		
		
	};
});