function getCurrentTimestamp(connection) {
	var query = "SELECT current_timestamp FROM DUMMY";
	var currentTimeStamp = connection.executeQuery(query);
	return currentTimeStamp[0].CURRENT_TIMESTAMP;
}

if ($.request.method === $.net.http.GET) {
	var connection = "";
	var userEmailId = "";
	var userRole = "";
	var currentTimeStamp = "";
	var isShowResults = false;
	var responseJSON = {
		Userid: [],
		Response: [],
		MVPCategories: [],
		MVPNominees: [],
		MVPResults: [],
		MVPVoteDetail: [],
		MVPUsers: [],
		MVPVotingData:[]
	};

	try {
		connection = $.hdb.getConnection();
		userEmailId = $.session.getUsername();
		userEmailId = 'mithun.smith.dias@sap.com';
		var mvpCategoryId = $.request.parameters.get("MVPCategoryId");

		if (userEmailId !== undefined && userEmailId !== '') {
			// Validate User
			userEmailId = (userEmailId !== undefined && userEmailId !== '') ? userEmailId.toLowerCase() : '';
			query = "SELECT * FROM \"mvpadmin.mvpdb::mvp.MVPUser\" WHERE \"UserEmail\" = '" + userEmailId + "'";
			var userResult = connection.executeQuery(query);
			if (userResult.length > 0) {
				userRole = userResult[0].UserRole;
				if (mvpCategoryId !== undefined && mvpCategoryId !== '') {

					query = "SELECT * FROM \"mvpadmin.mvpdb::mvp.MVPCategory\" WHERE \"MVPCategoryId\" = " + mvpCategoryId;
					var mvpCategory = connection.executeQuery(query);
					if (mvpCategory.length > 0) {

						if (userRole !== 'TEAMLEAD') {
							if (userRole === 'CHIEF') {
								currentTimeStamp = getCurrentTimestamp(connection);
								//Is voting complete?
								if (currentTimeStamp > mvpCategory[0].MVPCategoryVoteEndDate) {
									isShowResults = true;
								}
							}
							if (isShowResults || userRole === 'SUPER') {
								query =
									"SELECT nominee.\"MVPNomineeId\", nominee.\"MVPNomineeName\", count(vote.\"MVPNomineeId\") as \"MVPVotes\" FROM \"mvpadmin.mvpdb::mvp.MVPNominee\" AS nominee LEFT OUTER JOIN \"mvpadmin.mvpdb::mvp.MVPVote\" AS vote ON nominee.\"MVPCategoryId\" = vote.\"MVPCategoryId\" and nominee.\"MVPNomineeId\" = vote.\"MVPNomineeId\" where nominee.\"MVPCategoryId\" = " +
									mvpCategoryId + " GROUP BY nominee.\"MVPNomineeId\", nominee.\"MVPNomineeName\" ORDER BY COUNT(vote.\"MVPNomineeId\") DESC";

								var MVPNomineeVotes = connection.executeQuery(query);
								for (var nominee of MVPNomineeVotes) {
									responseJSON.MVPResults.push(nominee);
								}
							
								//count of votes
								
								query =
									"SELECT COUNT (*) as total_Users FROM \"mvpadmin.mvpdb::mvp.MVPUser\" ";

									var TotalUsers= connection.executeQuery(query);
								//	responseJSON.MVPVotingData.Users=TotalUsers[0].TOTAL_USERS;
									//for(var total of TotalUsers){
									responseJSON.MVPVotingData.push(TotalUsers[0].TOTAL_USERS);
								//	
									//}
								query =
									"SELECT COUNT (DISTINCT \"mvpadmin.mvpdb::mvp.MVPUser\".\"UserEmail\") as total_Voted FROM \"mvpadmin.mvpdb::mvp.MVPUser\" JOIN \"mvpadmin.mvpdb::mvp.MVPVote\"  ON \"UserEmail\"=\"MVPNomineeVotedBy\" WHERE \"MVPCategoryId\" = " +mvpCategoryId;

									MVPVoteCount= connection.executeQuery(query);
									responseJSON.MVPVotingData.push(MVPVoteCount[0].TOTAL_VOTED);
									//	responseJSON.MVPVotingData.Votes=MVPVoteCount[0].TOTAL_VOTED;
								//	for(var totalVoted of MVPVoteCount){
								//	responseJSON.MVPVotingData.push(MVPVoteCount["TOTAL_VOTED"]);
								//	responseJSON.MVPVotingData.push(MVPVoteCount);
									//}
								//	var votingDetails=[];
								/*	query ="SELECT COUNT (*) as total_Users FROM \"mvpadmin.mvpdb::mvp.MVPUser\" ";
									var TotalUsers= connection.executeQuery(query);
								//	for(var total of TotalUsers){
									//votingDetails.push(TotalUsers);
								//	responseJSON.MVPVotingData.push(TotalUsers);
								//	}
									
									query ="SELECT COUNT (DISTINCT \"mvpadmin.mvpdb::mvp.MVPUser\".\"UserEmail\") as total_Users FROM \"mvpadmin.mvpdb::mvp.MVPUser\" JOIN \"mvpadmin.mvpdb::mvp.MVPVote\"  ON \"UserEmail\"=\"MVPNomineeVotedBy\" WHERE \"MVPCategoryId\" = " +mvpCategoryId;
									usersLeft= connection.executeQuery(query);
									//for(var totalVoted of 	TotalUsers){
								//	responseJSON.MVPVotingData.push(TotalUsers);
										//}
							//votingDetails.push(usersLeft);
								responseJSON.MVPVotingData.push(TotalUsers);
									responseJSON.MVPVotingData.push(usersLeft);
								//*/
								query =
									"SELECT nominee.\"MVPNomineeId\", nominee.\"MVPNomineeName\", vote.\"MVPNomineeVotedBy\" as \"MVPVotedBy\" FROM \"mvpadmin.mvpdb::mvp.MVPNominee\" AS nominee LEFT OUTER JOIN \"mvpadmin.mvpdb::mvp.MVPVote\" AS vote ON nominee.\"MVPCategoryId\" = vote.\"MVPCategoryId\" and nominee.\"MVPNomineeId\" = vote.\"MVPNomineeId\" where nominee.\"MVPCategoryId\" = " +
									mvpCategoryId ;

								MVPNomineeVotes = connection.executeQuery(query);
								for (var nominee of MVPNomineeVotes) {
									responseJSON.MVPVoteDetail.push(nominee);
								}
								$.response.status = $.net.http.OK;
								responseJSON.Response = { 
									"CODE": "SUCCESS",
									"Text": "Votes Fetched."
								};
							} else {
								$.response.status = $.net.http.BAD_REQUEST;
								responseJSON.Response = {
									"CODE": "RESULTS_NOT_READY",
									"Text": "Results will be available as soon as voting ends."
								};
							}
						} else {
							$.response.status = $.net.http.BAD_REQUEST;
							responseJSON.Response = {
								"CODE": "BAD_REQUEST",
								"Text": "Only chiefs can view results."
							};
						}

					} else {
						$.response.status = $.net.http.BAD_REQUEST;
						responseJSON.Response = {
							"CODE": "BAD_REQUEST",
							"Text": "MVP Category ID is Empty or Invalid."
						};
					}

				} else {
					$.response.status = $.net.http.BAD_REQUEST;
					responseJSON.Response = {
						"CODE": "BAD_REQUEST",
						"Text": "MVP Category ID is Empty or Invalid."
					};
				}
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
		responseJSON.response = {
			"CODE": "INTERNAL_ERROR",
			"Text": JSON.stringify(error.message)
		};
	} finally {
		if (connection) {
			connection.close();
		}
		responseJSON.Userid = {
			userEmailId,
			userRole
		};
		$.response.setBody(JSON.stringify(responseJSON));
	}
} else {
	$.response.status = $.net.http.METHOD_NOT_ALLOWED;
	responseJSON.response = {
		"CODE": "INVALID_METHOD",
		"Text": "Invalid Method"
	};
	$.response.setBody(JSON.stringify(responseJSON));
}