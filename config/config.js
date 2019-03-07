const OPTIONS = {
	//WS_URL: 'https://followracer.com',	//The website url
	//WS_URL: 'https://console.test.followracer.com',	//The website url
	WS_URL: 'http://localhost:9000',	//The website url

	TEST_DURATION_MS: 10 * 60 * 1000,	//How long shall tests run?

//For the positions creation tests
	USER_REPORT_PERIOD_MS   : 3 * 1000,	//How often shall each user/participant report positions?
	NB_CONCURRENT_POS_REPORT: 6,		//How many positions shall be reported at every iteration?

//for the viewer test
	NB_VIEWERS                       : 10,		//How many user are viewing the livetracking page?
	PAGE_REFRESH_PERDIOD_MS          : 10000,	//How often are pages refreshed (like, new segment result, we reload all
	                                          // results)
	NB_CONCURRENT_COMPETITORS_QUERIED: 5,//How many competitors will we query the positions of (per refresh)
}

module.exports = {...OPTIONS}