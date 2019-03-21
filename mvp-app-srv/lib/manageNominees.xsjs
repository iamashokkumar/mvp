var connection = "";
var query = "";
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
		var userResult = connection.executeQuery(query);
		if (!userResult) {
			$.response.status = $.net.http.BAD_REQUEST;
			responseJSON.Response = {
				"CODE": "BADREQUEST",
				"Text": "Sorry, You're not part of the user group to access the MVP app!"
			};
			$.response.setBody(JSON.stringify(responseJSON));
		}
	} else {
		$.response.status = $.net.http.UNAUTHORIZED;
		responseJSON.Response = {
			"CODE": "UNAUTHORIZED",
			"Text": "You're not authorized to use this app!"
		};
		$.response.setBody(JSON.stringify(responseJSON));
	}
}

function getMVPCategory(connection, mvpCategoryId) {
	query = "SELECT * FROM \"mvpadmin.mvpdb::mvp.MVPCategory\" WHERE \"MVPCategoryId\" = " + mvpCategoryId ";
	var MVPCategoryResult = connection.executeQuery(query);
	return MVPCategoryResult;
}

validate mvpCategory(mvpCategory) {
	if (!mvpCategory) {
		$.response.status = $.net.http.BAD_REQUEST;
		responseJSON.Response = {
			"CODE": "BAD_REQUEST",
			"Text": "MVP Category ID is Empty or Invalid."
		};
		$.response.setBody(JSON.stringify(responseJSON));
	}
}

function dateCheck(connection) {

}

try {
	connection = $.hdb.getConnection();
	var userEmailId = $.session.getUsername();
	userEmailId = 'ashok.kumar.m01@sap.com';
	var actionId = $.request.parameters.get("ACTIONID");

	// Read
	if (actionId === 'GET_NOMINEES') {
		responseJSON.Response = validateLogonUser(userEmailId, connection);
		if (!responseJSON.Response) {

			var mvpCategoryId = $.request.parameters.get("MVPCategoryId");

			if (mvpCategoryId !== undefined && mvpCategoryId !== '') {
				var mvpCategory = getMVPCategory(connection, mvpCategoryId);

			} else {

			}

			query = "SELECT * FROM \"mvpadmin.mvpdb::mvp.MVPCategory\"";
			var MVPCategoryResult = connection.executeQuery(query);
			for (var result of MVPCategoryResult) {
				responseJSON.MVPCategories.push(result);
			}
			// }
			responseJSON.Response = {
				"CODE": "SUCCESS",
				"Text": "MVP Nominees Fetched"
			};
			$.response.setBody(JSON.stringify(responseJSON));
			$.response.status = $.net.http.OK;
		}
	} else if (actionId === 'UPDATE_NOMINEES') {
		responseJSON.Response = validateLogonUser(userEmailId, connection);
		if (!responseJSON.Response) {

		}
	} else if (actionId === 'DELETE_NOMINEES') {

	} else if (actionId === 'VOTE_NOMINEES') {

	} else {
		$.response.status = $.net.http.BAD_REQUEST;
		responseJSON.Response = {
			"CODE": "BAD_REQUEST",
			"Text": "Bad Request"
		};
		$.response.setBody(JSON.stringify(responseJSON));
	}
} catch (error) {
	connection.rollback();
	$.response.contentType = "text/plain";
	responseJSON.Response = {
		"CODE": "INTERNAL_ERROR",
		"Text": JSON.stringify(error.message)
	};
	$.response.setBody(JSON.stringify(responseJSON));
	$.response.status = $.net.http.INTERNAL_SERVER_ERROR;
} finally {
	connection.close();
}

// var query = "call RUNINSPIRED.ADMIN_GET_SURVEY_FEEDBACK_DUMP(" + surveyId + ", ? )";
// var pstmt = connection.prepareCall(query);
// pstmt.execute();
// var result = pstmt.getResultSet();
// while (result.next()) {
// 	responseJSON.surveyResults.push(createFeedbackDumpResultsJson(result));
// }