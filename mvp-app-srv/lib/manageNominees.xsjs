function validateLogonUser(userEmailId, connection) {
	if (userEmailId !== undefined && userEmailId !== '') {
		// Validate User
		query = "SELECT * FROM \"mvpadmin.mvpdb::mvp.MVPUser\" WHERE \"UserEmail\" = '" + userEmailId + "'";
		var MVPUser = connection.executeQuery(query);
		if (!MVPUser.length > 0) {
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

function getCurrentTimestamp(connection) {
	var query = "SELECT current_timestamp FROM DUMMY";
	var currentTimeStamp = connection.executeQuery(query);
	return currentTimeStamp[0].CURRENT_TIMESTAMP;
}

function getMVPCategory(mvpCategoryId, connection) {
	query = "SELECT * FROM \"mvpadmin.mvpdb::mvp.MVPCategory\" WHERE \"MVPCategoryId\" = " + mvpCategoryId;
	var MVPCategory = connection.executeQuery(query);
	if (!MVPCategory.length > 0) {
		$.response.status = $.net.http.BAD_REQUEST;
		responseJSON.Response = {
			"CODE": "BAD_REQUEST",
			"Text": "MVP Category ID is Empty or Invalid."
		};
	}
	return MVPCategory;
}

function isCategoryOpen(mvpCategory) {
	if (mvpCategory[0].MVPCategoryStatusId === 'OPEN') {
		return true;
	}
}

function isNominationEditOpen(mvpCategory) {
	var isEditAllowed = false;

	currentTimeStamp = getCurrentTimestamp(connection);

	if (mvpCategory[0].MVPCategoryNominateStartDate > currentTimeStamp) {
		isEditAllowed = false;
	} else if (mvpCategory[0].MVPCategoryNominateStartDate < currentTimeStamp & mvpCategory[0].MVPCategoryNominateEndDate > currentTimeStamp) {
		isEditAllowed = true;
	} else if (mvpCategory[0].MVPCategoryNominateEndDate < currentTimeStamp) {
		isEditAllowed = false;
	}
	return isEditAllowed;
}

function isVotingOnCategoryOpen(mvpCategory) {
	var isVotingAllowed = false;

	currentTimeStamp = getCurrentTimestamp(connection);

	if (mvpCategory[0].MVPCategoryVoteStartDate > currentTimeStamp) {
		isVotingAllowed = false;
	} else if (mvpCategory[0].MVPCategoryVoteStartDate < currentTimeStamp & mvpCategory[0].MVPCategoryVoteEndDate > currentTimeStamp) {
		isVotingAllowed = true;
	} else if (mvpCategory[0].MVPCategoryVoteEndDate < currentTimeStamp) {
		isVotingAllowed = false;
	}
	return isVotingAllowed;
}

function isNomineeInCategory(mvpCategoryId, mvpNomineeId, connection) {
	var isNomineeValid = false;
	query = "SELECT * FROM \"mvpadmin.mvpdb::mvp.MVPNominee\" WHERE \"MVPCategoryId\" = " + mvpCategoryId + " AND \"MVPNomineeId\" = " + mvpNomineeId;
	var MVPNomineeInCategory = connection.executeQuery(query);
	if (MVPNomineeInCategory.length > 0) {
		isNomineeValid = true;
	}
	return isNomineeValid;
}

function hasUserAlreadyVotedForNominee(mvpCategoryId, userEmailId, MVPNomineeId, connection) {
	var isUserAlreadyVotedForNominee = false;
	query = "SELECT * FROM \"mvpadmin.mvpdb::mvp.MVPVote\" WHERE \"MVPCategoryId\" = " + mvpCategoryId + " AND \"MVPNomineeId\" = " +
		MVPNomineeId + " AND \"MVPNomineeVotedBy\" = '" + userEmailId + "'";
	var MVPNomineeVote = connection.executeQuery(query);
	if (MVPNomineeVote.length > 0) {
		isUserAlreadyVotedForNominee = true;
	}
	return isUserAlreadyVotedForNominee;
}

function hasUserAlreadyVoted(mvpCategoryId, userEmailId, connection) {
	var isUserAlreadyVoted = false;
	query = "SELECT * FROM \"mvpadmin.mvpdb::mvp.MVPVote\" WHERE \"MVPCategoryId\" = " + mvpCategoryId + " AND \"MVPNomineeVotedBy\" = '" +
		userEmailId + "'";
	var MVPUserVote = connection.executeQuery(query);
	if (MVPUserVote.length > 0) {
		isUserAlreadyVoted = true;
	}
	return isUserAlreadyVoted;
}

var connection = "";
var query = "";
var user = "";
var payload = "";
var userEmailId = "";
var currentTimeStamp = "";
var responseJSON = {
	Userid: [],
	Response: [],
	MVPCategories: [],
	MVPNominees: [],
	MVPResults: []
};

try {
	connection = $.hdb.getConnection();
	userEmailId = $.session.getUsername();
	// userEmailId = 'ashok.kumar.m01@sap.com';
	userEmailId = (userEmailId !== undefined && userEmailId !== '') ? userEmailId.toLowerCase() : '';
	var actionId = $.request.parameters.get("ACTIONID");
	var mvpCategoryId = $.request.parameters.get("MVPCategoryId");

	// Read
	if (actionId === 'GET_NOMINEE') {
		responseJSON.Response = validateLogonUser(userEmailId, connection);
		if (!responseJSON.Response) {

			if (mvpCategoryId !== undefined && mvpCategoryId !== '') {
				var mvpCategory = getMVPCategory(mvpCategoryId, connection);

				if (mvpCategory.length > 0) {
					query = "SELECT * FROM \"mvpadmin.mvpdb::mvp.MVPNominee\" WHERE \"MVPCategoryId\" = " + mvpCategoryId;
					var MVPNominees = connection.executeQuery(query);
					for (var nominee of MVPNominees) {
						// Did user already vote for nominee?
						nominee.HAS_VOTED = false;
						if (hasUserAlreadyVotedForNominee(mvpCategoryId, userEmailId, nominee.MVPNomineeId, connection)) {
							nominee.HAS_VOTED = true;
						}
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

				if (mvpCategory.length > 0) {

					if (isCategoryOpen(mvpCategory) & isNominationEditOpen(mvpCategory)) {

						payload = JSON.parse($.request.body.asString());
						query = "INSERT INTO \"mvpadmin.mvpdb::mvp.MVPNominee\" VALUES(" + payload.MVPCategoryId + ",'" + payload.MVPNomineeName + "','" +
							payload.MVPNomineeAvatarFileName + "','" + payload.MVPNomineeAvatarFileNameExtn + "','" + payload.MVPNomineeAvatarFileData + "','" +
							payload.MVPNomineeAbstract +
							"','" + payload.MVPNomineeKeyAchievements + "','" + payload.MVPNomineeCustomerQuotes + "','" + userEmailId +
							"', current_timestamp,'" +
							userEmailId + "', current_timestamp)";

						/*						var MVPNomineeName = "Test Nominee";
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
													userEmailId + "', current_timestamp)";*/

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

				if (mvpCategory.length > 0) {

					if (isCategoryOpen(mvpCategory) & isNominationEditOpen(mvpCategory)) {

						payload = JSON.parse($.request.body.asString());
						// Delete Nominee
						query = "DELETE  FROM \"mvpadmin.mvpdb::mvp.MVPNominee\" WHERE \"MVPCategoryId\" = " + mvpCategoryId + " and \"MVPNomineeId\" = " +
							payload.MVPNomineeId;
						var MVPNominee = connection.executeUpdate(query);
						// Delete Votes VALUES(" + mvpCategoryId + "," + payload.MVPNomineeId + ", '" + userEmailId +
						query = "DELETE  FROM \"mvpadmin.mvpdb::mvp.MVPVote\" WHERE \"MVPCategoryId\" = " + mvpCategoryId + " and \"MVPNomineeId\" = " +
							payload.MVPNomineeId;
						var MVPNomineeVotes = connection.executeUpdate(query);

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

				if (mvpCategory.length > 0) {

					if (isCategoryOpen(mvpCategory) & isNominationEditOpen(mvpCategory)) {

						payload = JSON.parse($.request.body.asString());
						query = "UPDATE \"mvpadmin.mvpdb::mvp.MVPNominee\" SET \"MVPNomineeName\" = '" + payload.MVPNomineeName +
							"', \"MVPNomineeAvatarFileName\" = '" + payload.MVPNomineeAvatarFileName + "', \"MVPNomineeAvatarFileNameExtn\" = '" +
							payload.MVPNomineeAvatarFileNameExtn + "', \"MVPNomineeAvatarFileData\" = '" + payload.MVPNomineeAvatarFileData +
							"', \"MVPNomineeAbstract\" = '" +
							payload.MVPNomineeAbstract + "', \"MVPNomineeKeyAchievements\" = '" + payload.MVPNomineeKeyAchievements +
							"', \"MVPNomineeCustomerQuotes\" = '" +
							payload.MVPNomineeCustomerQuotes + "', \"MVPNomineeChangedBy\" = '" + userEmailId +
							"', \"MVPNomineeChangedOn\" =  current_timestamp WHERE \"MVPCategoryId\" = " + mvpCategoryId + " and \"MVPNomineeId\" = " +
							payload.MVPNomineeId;

						/*						var MVPNomineeId = "7";
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
													MVPNomineeId;*/

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

				if (mvpCategory.length > 0) {

					if (isCategoryOpen(mvpCategory) & isVotingOnCategoryOpen(mvpCategory)) {

						payload = JSON.parse($.request.body.asString());

						if (payload.MVPNomineeId !== undefined && payload.MVPNomineeId !== '') {
							// Is Nominee in Category
							if (isNomineeInCategory(mvpCategoryId, payload.MVPNomineeId, connection)) {
								// Did user already vote for nominee?
								if (!hasUserAlreadyVotedForNominee(mvpCategoryId, userEmailId, payload.MVPNomineeId, connection)) {
									// Did user already vote? If 'No' or voting mode is 'MULTI', then proceed
									if ((mvpCategory[0].MVPCategoryVoteMode === 'SINGLE' & !hasUserAlreadyVoted(mvpCategoryId, userEmailId, connection)) || (
											mvpCategory[0].MVPCategoryVoteMode ===
											'MULTI')) {

										query = "INSERT INTO \"mvpadmin.mvpdb::mvp.MVPVote\" VALUES(" + mvpCategoryId + "," + payload.MVPNomineeId + ", '" + userEmailId +
											"', current_timestamp)";

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
											"Text": "You already voted for a nominee in this category!"
										};
									}
								} else {
									$.response.status = $.net.http.BAD_REQUEST;
									responseJSON.Response = {
										"CODE": "BAD_REQUEST",
										"Text": "You voted for this nominee already!"
									};
								}
							} else {
								$.response.status = $.net.http.BAD_REQUEST;
								responseJSON.Response = {
									"CODE": "BAD_REQUEST",
									"Text": "Nominee is invalid or not part of Category."
								};
							}
						} else {
							$.response.status = $.net.http.BAD_REQUEST;
							responseJSON.Response = {
								"CODE": "BAD_REQUEST",
								"Text": "Nominee ID is Empty or Invalid."
							};
						}

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