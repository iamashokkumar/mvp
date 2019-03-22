if ($.request.method === $.net.http.GET) {
	var connection = "";
	var query = "";
	var responseJSON = {
		Userid: [],
		Response: [],
		MVPCategories: [],
		MVPNominees: [],
		MVPResults: []
	};

	try {
		connection = $.hdb.getConnection();
		var userEmailId = $.session.getUsername();
		// userEmailId = 'ashok.kumar.m01@sap.com';
		if (userEmailId !== undefined && userEmailId !== '') {
			
			// Validate User
			query = "SELECT * FROM \"mvpadmin.mvpdb::mvp.MVPUser\" WHERE \"UserEmail\" = '" + userEmailId.toLowerCase() + "'";
			var userResult = connection.executeQuery(query);
			if (userResult) {
				query = "SELECT * FROM \"mvpadmin.mvpdb::mvp.MVPCategory\"";
				// var pstmt = connection.prepareStatement(query);
				// var MVPCategoryResult = pstmt.executeQuery();
				var MVPCategories = connection.executeQuery(query);
				for (var category of MVPCategories) {
					responseJSON.MVPCategories.push(category);
				}
				// }
				responseJSON.Response = {
					"CODE": "SUCCESS",
					"Text": "MVP Categories Fetched"
				};
				$.response.status = $.net.http.OK;
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
		responseJSON.Userid = { userEmailId };
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