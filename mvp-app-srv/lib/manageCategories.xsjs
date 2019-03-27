function getCurrentTimestamp(connection) {
	var query = "SELECT current_timestamp FROM DUMMY";
	var currentTimeStamp = connection.executeQuery(query);
	return currentTimeStamp[0].CURRENT_TIMESTAMP;
}

if ($.request.method === $.net.http.GET) {
	var connection = "";
	var query = "";
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
		var mvpCategoryId = $.request.parameters.get("MVPCategoryId");
		
		if (userEmailId !== undefined && userEmailId !== '') {
			userEmailId = (userEmailId !== undefined && userEmailId !== '') ? userEmailId.toLowerCase() : '';
			// Validate User
			query = "SELECT * FROM \"mvpadmin.mvpdb::mvp.MVPUser\" WHERE \"UserEmail\" = '" + userEmailId + "'";
			var userResult = connection.executeQuery(query);
			if (userResult.length > 0) {

				if (mvpCategoryId !== undefined && mvpCategoryId !== '') {
					query = "SELECT * FROM \"mvpadmin.mvpdb::mvp.MVPCategory\" WHERE \"MVPCategoryStatusId\" NOT IN ('DRAFT','CANCELED') AND \"MVPCategoryId\" = " + mvpCategoryId;
				} else {
					query = "SELECT * FROM \"mvpadmin.mvpdb::mvp.MVPCategory\" WHERE \"MVPCategoryStatusId\" NOT IN ('DRAFT','CANCELED') ORDER BY \"MVPCategoryVoteEndDate\" DESC";
				}
				var MVPCategories = connection.executeQuery(query);
				currentTimeStamp = getCurrentTimestamp(connection);
				for (var category of MVPCategories) {

					if (category.MVPCategoryNominateStartDate > currentTimeStamp) {
						category.MVPCategoryNominationStatus = 'NOT_OPEN_FOR_NOMINATION';
						category.MVPCategoryNominationStatusText = 'Not Open For Nomination';
					} else if (category.MVPCategoryNominateStartDate < currentTimeStamp & category.MVPCategoryNominateEndDate > currentTimeStamp) {
						category.MVPCategoryNominationStatus = 'OPEN_FOR_NOMINATION';
						category.MVPCategoryNominationStatusText = 'Open For Nomination';
					} else if (category.MVPCategoryNominateEndDate < currentTimeStamp) {
						category.MVPCategoryNominationStatus = 'CLOSED_FOR_NOMINATION';
						category.MVPCategoryNominationStatusText = 'Closed For Nomination';
					}

					if (category.MVPCategoryVoteStartDate > currentTimeStamp) {
						category.MVPCategoryVotingStatus = 'NOT_OPEN_FOR_VOTING';
						category.MVPCategoryVotingStatusText = 'Not Open For Voting';
					} else if (category.MVPCategoryVoteStartDate < currentTimeStamp & category.MVPCategoryVoteEndDate > currentTimeStamp) {
						category.MVPCategoryVotingStatus = 'OPEN_FOR_VOTING';
						category.MVPCategoryVotingStatusText = 'Open For Voting';
					} else if (category.MVPCategoryVoteEndDate < currentTimeStamp) {
						category.MVPCategoryVotingStatus = 'CLOSED_FOR_VOTING';
						category.MVPCategoryVotingStatusText = 'Closed For Voting';
					}

					if (category.MVPCategoryVoteMode === 'SINGLE') {
						category.MVPCategoryVoteModeText = 'Note: You can vote for only one nominee.';
					} else if (category.MVPCategoryVoteMode === 'MULTIPLE') {
						category.MVPCategoryVoteModeText = 'Note: You can vote for multiple nominees.'
					}

					responseJSON.MVPCategories.push(category);
				}
				$.response.status = $.net.http.OK;
				responseJSON.Response = {
					"CODE": "SUCCESS",
					"Text": "MVP Categories Fetched."
				};
			} else {
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
	} catch (error) {
		connection.rollback();
		$.response.contentType = "text/plain";
		$.response.status = $.net.http.INTERNAL_SERVER_ERROR;
		responseJSON.Response = {
			"CODE": "INTERNAL_ERROR",
			"Text": JSON.stringify(error.message)
		};
	} finally {
		connection.close();
		responseJSON.Userid = {
			userEmailId
		};
		$.response.setBody(JSON.stringify(responseJSON));
	}
} else {
	$.response.status = $.net.http.METHOD_NOT_ALLOWED;
	var responseJSON = {
		Response: []
	};
	responseJSON.Response = {
		"CODE": "INVALID_METHOD",
		"Text": "Invalid Method"
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