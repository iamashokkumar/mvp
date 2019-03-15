function createMVPCategoriesResultsJson(rs) {
	return {
		"MVPCategoryId": rs.getString(1),
		"MVPCategoryName": rs.getString(2),
		"MVPCategoryStatusId": rs.getString(3),
		"MVPCategoryRegionId": rs.getString(4),
		"MVPCategoryTeamId": rs.getString(5),
		"MVPCategoryOpenTill": rs.getString(6),
		"MVPCategoryVoteMode": rs.getString(7),
		"MVPCategoryCreatedBy": rs.getString(8),
		"MVPCategoryCreatedOn": rs.getString(9),
		"MVPCategoryChangedBy": rs.getString(10),
		"MVPCategoryChangedOn": rs.getString(11),
	};
}

if ($.request.method === $.net.http.GET) {
	var connection = "";
	var responseJSON = {
		userid: [],
		response: [],
		MVPCategories: [],
		MVPNominees: [],
		MVPResults: [],
		errors: []
	};

	try {
		connection = $.db.getConnection();
		var MVPCategoryId = $.request.parameters.get("MVPCategoryId");
		if (MVPCategoryId !== undefined && MVPCategoryId !== '') {

			//if (optionID === 'FEEDBACK_DUMP') {
			// /* Get survey results Feedback Dump*/
			// var query = "call RUNINSPIRED.ADMIN_GET_SURVEY_FEEDBACK_DUMP(" + surveyId + ", ? )";
			// var pstmt = connection.prepareCall(query);
			// pstmt.execute();
			// var result = pstmt.getResultSet();
			// while (result.next()) {
			// 	responseJSON.surveyResults.push(createFeedbackDumpResultsJson(result));
			// } ""MVP".""MVPadmin."MVPdb::"MVP."MVPCategory"
			// "SELECT * FROM \"S4HANA_CoE\".\"PARTICIPANTS\" where USERID = '" + userID + "'";
			var query = "SELECT * FROM \"MVP\".\"mvpadmin.mvpdb::mvp.MVPCategory\" WHERE \"MVPCategoryId\" = " + MVPCategoryId;
			var pstmt = connection.prepareStatement(query);
			var MVPCategoryResult = pstmt.executeQuery();
			while (MVPCategoryResult.next()) {
				responseJSON.MVPCategories.push(createMVPCategoriesResultsJson(MVPCategoryResult));
			}
		}

		responseJSON.response = {
			"CODE": "SUCCESS",
			"Text": "MVP Categories Fetched"
		};
		$.response.setBody(JSON.stringify(responseJSON));
		$.response.status = $.net.http.OK;
	} catch (error) {
		connection.rollback();
		$.response.contentType = "text/plain";
		responseJSON.response = {
			"CODE": "INTERNAL_ERROR",
			"Text": JSON.stringify(error.message)
		};
		$.response.setBody(JSON.stringify(responseJSON));
		$.response.status = $.net.http.INTERNAL_SERVER_ERROR;
	} finally {
		connection.close();
	}
} else {
	$.response.status = $.net.http.METHOD_NOT_ALLOWED;
	var responseJSON = {
		response: []
	};
	responseJSON.response = {
		"CODE": "INVALID_METHOD",
		"Text": "Invalid Method"
	};
	$.response.setBody(JSON.stringify(responseJSON));
}