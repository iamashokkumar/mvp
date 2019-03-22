var connection = "";
var query = "";
var user = "";
var payload = "";
var responseJSON = {
	Userid: [],
	Response: [],
	MVPCategories: [],
	MVPNominees: [],
	MVPResults: []
};

function validateLogonUser(userEmailId, connection) {
	if (userEmailId !== undefined && userEmailId !== '') {
		// Validate User
		query = "SELECT * FROM \"mvpadmin.mvpdb::mvp.MVPUser\" WHERE \"UserEmail\" = '" + userEmailId.toLowerCase() + "'";
		var MVPUser = connection.executeQuery(query);
		if (!MVPUser) {
			$.response.status = $.net.http.BAD_REQUEST;
			responseJSON.Response = {
				"CODE": "BADREQUEST",
				"Text": "Sorry, You're not part of the user group to access the MVP app!"
			};
		}
	} else {
		$.response.status = $.net.http.UNAUTHORIZED;
		responseJSON.Response = {
			"CODE": "UNAUTHORIZED",
			"Text": "You're not authorized to use this app!"
		};
	}
}

function getMVPCategory(mvpCategoryId, connection) {
	query = "SELECT * FROM \"mvpadmin.mvpdb::mvp.MVPCategory\" WHERE \"MVPCategoryId\" = " + mvpCategoryId;
	var MVPCategory = connection.executeQuery(query);
	if (!MVPCategory) {
		$.response.status = $.net.http.BAD_REQUEST;
		responseJSON.Response = {
			"CODE": "BAD_REQUEST",
			"Text": "MVP Category ID is Empty or Invalid."
		};
	}
	return MVPCategory;
}

function isNominationAllowed(mvpCategory) {
	if (mvpCategory[0].MVPCategoryStatusId === 'OPEN') {
		return true;
	}
}

function isNominationDeletionAllowed(mvpCategory) {
	if (mvpCategory[0].MVPCategoryStatusId === 'OPEN') {
		return true;
	}
}

function isNominationUpdateAllowed(mvpCategory) {
	if (mvpCategory[0].MVPCategoryStatusId === 'OPEN') {
		return true;
	}
}

function isVotingAllowed(mvpCategory) {
	if (mvpCategory[0].MVPCategoryStatusId === 'OPEN') {
		return true;
	}
}

//To do
// Date Check, is nominated by user check.
function dateCheck(connection) {

}

try {
	connection = $.hdb.getConnection();
	var userEmailId = $.session.getUsername();
	// userEmailId = 'kevin.yang02@sap.com';
	var actionId = $.request.parameters.get("ACTIONID");
	var mvpCategoryId = $.request.parameters.get("MVPCategoryId");

	// Read
	if (actionId === 'GET_NOMINEE') {
		responseJSON.Response = validateLogonUser(userEmailId, connection);
		if (!responseJSON.Response) {

			if (mvpCategoryId !== undefined && mvpCategoryId !== '') {
				var mvpCategory = getMVPCategory(mvpCategoryId, connection);

				if (mvpCategory) {
					query = "SELECT * FROM \"mvpadmin.mvpdb::mvp.MVPNominee\" WHERE \"MVPCategoryId\" = " + mvpCategoryId;
					var MVPNominees = connection.executeQuery(query);
					for (var nominee of MVPNominees) {
						responseJSON.MVPNominees.push(nominee);
					}
					$.response.status = $.net.http.OK;
					responseJSON.Response = {
						"CODE": "SUCCESS",
						"Text": "MVP Nominees Fetched."
					};
				}
			} else {
				$.response.status = $.net.http.BAD_REQUEST;
				responseJSON.Response = {
					"CODE": "BAD_REQUEST",
					"Text": "MVP Category ID is Empty or Invalid."
				};
			}
		}
	} else if (actionId === 'CREATE_NOMINEE') {
		responseJSON.Response = validateLogonUser(userEmailId, connection);
		if (!responseJSON.Response) {

			if (mvpCategoryId !== undefined && mvpCategoryId !== '') {
				var mvpCategory = getMVPCategory(mvpCategoryId, connection);

				if (mvpCategory) {

					if (isNominationAllowed(mvpCategory)) {

						/*		payload = JSON.parse($.request.body.asString());

								query = "INSERT INTO \"mvpadmin.mvpdb::mvp.MVPNominee\" VALUES(" + mvpCategory + ",'" + payload.MVPNomineeName + "','" +
									payload.MVPNomineeAvatarFileName + "','" + payload.MVPNomineeAvatarFileNameExtn + "','" + payload.MVPNomineeAvatarFileData + "','" +
									payload.MVPNomineeAbstract +
									"','" + payload.MVPNomineeKeyAchievements + "','" + payload.MVPNomineeCustomerQuotes + "','" + payload.MVPNominatedBy +
									"', current_timestamp,'" +
									payload.MVPNomineeChangedBy + "', current_timestamp)";*/

						var MVPNomineeName = "Test Nominee";
						var MVPNomineeAvatarFileName = "";
						var MVPNomineeAvatarFileNameExtn = "";
						var MVPNomineeAvatarFileData = "";
						var MVPNomineeAbstract = "This is a test abstract";
						var MVPNomineeKeyAchievements = "This is demo key achievement";
						var MVPNomineeCustomerQuotes = "This is demo customer quote";

						query = "INSERT INTO \"mvpadmin.mvpdb::mvp.MVPNominee\" VALUES(" + mvpCategoryId + ",'" + MVPNomineeName + "','" +
							MVPNomineeAvatarFileName + "','" + MVPNomineeAvatarFileNameExtn + "','" + MVPNomineeAvatarFileData + "','" +
							MVPNomineeAbstract +
							"','" + MVPNomineeKeyAchievements + "','" + MVPNomineeCustomerQuotes + "','" + userEmailId +
							"', current_timestamp,'" +
							userEmailId + "', current_timestamp)";

						var MVPNominee = connection.executeUpdate(query);
						connection.commit();
						$.response.status = $.net.http.OK;
						responseJSON.Response = {
							"CODE": "SUCCESS",
							"Text": "Nomination Saved Successfully."
						};
					} else {
						$.response.status = $.net.http.BAD_REQUEST;
						responseJSON.Response = {
							"CODE": "BAD_REQUEST",
							"Text": "Sorry, you cannot nominate."
						};
					}
				}
			} else {
				$.response.status = $.net.http.BAD_REQUEST;
				responseJSON.Response = {
					"CODE": "BAD_REQUEST",
					"Text": "MVP Category ID is Empty or Invalid."
				};
			}
		}
	} else if (actionId === 'DELETE_NOMINEE') {

		responseJSON.Response = validateLogonUser(userEmailId, connection);
		if (!responseJSON.Response) {

			if (mvpCategoryId !== undefined && mvpCategoryId !== '') {
				var mvpCategory = getMVPCategory(mvpCategoryId, connection);

				if (mvpCategory) {

					if (isNominationDeletionAllowed(mvpCategory)) {

						/*		payload = JSON.parse($.request.body.asString());

								query = "INSERT INTO \"mvpadmin.mvpdb::mvp.MVPNominee\" VALUES(" + mvpCategory + ",'" + payload.MVPNomineeName + "','" +
									payload.MVPNomineeAvatarFileName + "','" + payload.MVPNomineeAvatarFileNameExtn + "','" + payload.MVPNomineeAvatarFileData + "','" +
									payload.MVPNomineeAbstract +
									"','" + payload.MVPNomineeKeyAchievements + "','" + payload.MVPNomineeCustomerQuotes + "','" + payload.MVPNominatedBy +
									"', current_timestamp,'" +
									payload.MVPNomineeChangedBy + "', current_timestamp)";*/

						var MVPNomineeId = 6;
						query = "DELETE  FROM \"mvpadmin.mvpdb::mvp.MVPNominee\" WHERE \"MVPCategoryId\" = " + mvpCategoryId + " and \"MVPNomineeId\" = " +
							MVPNomineeId;
						var MVPNominee = connection.executeUpdate(query);
						connection.commit();
						$.response.status = $.net.http.OK;
						responseJSON.Response = {
							"CODE": "SUCCESS",
							"Text": "Nomination Deleted Successfully."
						};
					} else {
						$.response.status = $.net.http.BAD_REQUEST;
						responseJSON.Response = {
							"CODE": "BAD_REQUEST",
							"Text": "Sorry, you cannot delete."
						};
					}
				}
			} else {
				$.response.status = $.net.http.BAD_REQUEST;
				responseJSON.Response = {
					"CODE": "BAD_REQUEST",
					"Text": "MVP Category ID is Empty or Invalid."
				};
			}
		}

	} else if (actionId === 'UPDATE_NOMINEE') {

		responseJSON.Response = validateLogonUser(userEmailId, connection);
		if (!responseJSON.Response) {

			if (mvpCategoryId !== undefined && mvpCategoryId !== '') {
				var mvpCategory = getMVPCategory(mvpCategoryId, connection);

				if (mvpCategory) {

					if (isNominationUpdateAllowed(mvpCategory)) {

						/*		payload = JSON.parse($.request.body.asString());

								query = "INSERT INTO \"mvpadmin.mvpdb::mvp.MVPNominee\" VALUES(" + mvpCategory + ",'" + payload.MVPNomineeName + "','" +
									payload.MVPNomineeAvatarFileName + "','" + payload.MVPNomineeAvatarFileNameExtn + "','" + payload.MVPNomineeAvatarFileData + "','" +
									payload.MVPNomineeAbstract +
									"','" + payload.MVPNomineeKeyAchievements + "','" + payload.MVPNomineeCustomerQuotes + "','" + payload.MVPNominatedBy +
									"', current_timestamp,'" +
									payload.MVPNomineeChangedBy + "', current_timestamp)";*/

						var MVPNomineeId = "7";
						var MVPNomineeName = "Update Nominee";
						var MVPNomineeAvatarFileName = "";
						var MVPNomineeAvatarFileNameExtn = "";
						var MVPNomineeAvatarFileData = "";
						var MVPNomineeAbstract = "This is a test abstract";
						var MVPNomineeKeyAchievements = "This is demo key achievement";
						var MVPNomineeCustomerQuotes = "This is demo customer quote";

						query = "UPDATE \"mvpadmin.mvpdb::mvp.MVPNominee\" SET \"MVPNomineeName\" = '" + MVPNomineeName +
							"', \"MVPNomineeAvatarFileName\" = '" + MVPNomineeAvatarFileName + "', \"MVPNomineeAvatarFileNameExtn\" = '" +
							MVPNomineeAvatarFileNameExtn + "', \"MVPNomineeAvatarFileData\" = '" + MVPNomineeAvatarFileData + "', \"MVPNomineeAbstract\" = '" +
							MVPNomineeAbstract + "', \"MVPNomineeKeyAchievements\" = '" + MVPNomineeKeyAchievements + "', \"MVPNomineeCustomerQuotes\" = '" +
							MVPNomineeCustomerQuotes + "', \"MVPNomineeChangedBy\" = '" + userEmailId +
							"', \"MVPNomineeChangedOn\" =  current_timestamp WHERE \"MVPCategoryId\" = " + mvpCategoryId + " and \"MVPNomineeId\" = " +
							MVPNomineeId;

						var MVPNominee = connection.executeUpdate(query);
						connection.commit();
						$.response.status = $.net.http.OK;
						responseJSON.Response = {
							"CODE": "SUCCESS",
							"Text": "Nomination Updated Successfully."
						};
					} else {
						$.response.status = $.net.http.BAD_REQUEST;
						responseJSON.Response = {
							"CODE": "BAD_REQUEST",
							"Text": "Sorry, you cannot update."
						};
					}
				}
			} else {
				$.response.status = $.net.http.BAD_REQUEST;
				responseJSON.Response = {
					"CODE": "BAD_REQUEST",
					"Text": "MVP Category ID is Empty or Invalid."
				};
			}
		}

	} else if (actionId === 'VOTE_NOMINEE') {

		responseJSON.Response = validateLogonUser(userEmailId, connection);
		if (!responseJSON.Response) {

			if (mvpCategoryId !== undefined && mvpCategoryId !== '') {
				var mvpCategory = getMVPCategory(mvpCategoryId, connection);

				if (mvpCategory) {

					if (isVotingAllowed(mvpCategory)) {

						/*		payload = JSON.parse($.request.body.asString());

								query = "INSERT INTO \"mvpadmin.mvpdb::mvp.MVPNominee\" VALUES(" + mvpCategory + ",'" + payload.MVPNomineeName + "','" +
									payload.MVPNomineeAvatarFileName + "','" + payload.MVPNomineeAvatarFileNameExtn + "','" + payload.MVPNomineeAvatarFileData + "','" +
									payload.MVPNomineeAbstract +
									"','" + payload.MVPNomineeKeyAchievements + "','" + payload.MVPNomineeCustomerQuotes + "','" + payload.MVPNominatedBy +
									"', current_timestamp,'" +
									payload.MVPNomineeChangedBy + "', current_timestamp)";*/

						var MVPNomineeId = "2";

						query = "INSERT INTO \"mvpadmin.mvpdb::mvp.MVPVote\" VALUES(" + mvpCategoryId + "," + MVPNomineeId + ", '" + userEmailId + "', current_timestamp)";

						var MVPNominee = connection.executeUpdate(query);
						connection.commit();
						$.response.status = $.net.http.OK;
						responseJSON.Response = {
							"CODE": "SUCCESS",
							"Text": "Vote Saved Successfully."
						};
					} else {
						$.response.status = $.net.http.BAD_REQUEST;
						responseJSON.Response = {
							"CODE": "BAD_REQUEST",
							"Text": "Sorry, you cannot vote."
						};
					}
				}
			} else {
				$.response.status = $.net.http.BAD_REQUEST;
				responseJSON.Response = {
					"CODE": "BAD_REQUEST",
					"Text": "MVP Category ID is Empty or Invalid."
				};
			}
		}

	} else {
		$.response.status = $.net.http.BAD_REQUEST;
		responseJSON.Response = {
			"CODE": "BAD_REQUEST",
			"Text": "Bad Request"
		};
		// $.response.setBody(JSON.stringify(responseJSON));
	}
} catch (error) {
	connection.rollback();
	$.response.contentType = "text/plain";
	$.response.status = $.net.http.INTERNAL_SERVER_ERROR;
	responseJSON.Response = {
		"CODE": "INTERNAL_ERROR",
		"Text": JSON.stringify(error.message)
	};
	// $.response.setBody(JSON.stringify(responseJSON));
} finally {
	connection.close();
	responseJSON.Userid = {
		userEmailId
	};
	$.response.setBody(JSON.stringify(responseJSON));
}

// var query = "call RUNINSPIRED.ADMIN_GET_SURVEY_FEEDBACK_DUMP(" + surveyId + ", ? )";
// var pstmt = connection.prepareCall(query);
// pstmt.execute();
// var result = pstmt.getResultSet();
// while (result.next()) {
// 	responseJSON.surveyResults.push(createFeedbackDumpResultsJson(result));
// }