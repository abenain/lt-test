//const WS_URL = 'https://followracer.com';	//The website url
const WS_URL = 'https://test.followracer.com';	//The website url

const TEST_DURATION_MS = 10 * 60 * 1000;	//How long shall tests run?

//For the positions creation tests
const USER_REPORT_PERIOD_MS = 6 * 1000;	//How often shall each user/participant report positions?
const NB_CONCURRENT_POS_REPORT = 25;		//How many positions shall be reported at every iteration?

//for the viewer test
const NB_VIEWERS 				= 10;		//How many user are viewing the livetracking page?
const PAGE_REFRESH_PERDIOD_MS 	= 10000;	//How often are pages refreshed (like, new segment result, we reload all results)
const NB_CONCURRENT_COMPETITORS_QUERIED = 5;//How many competitors will we query the positions of (per refresh)

module.exports = {
	WS_URL,
	USER_REPORT_PERIOD_MS,
	NB_CONCURRENT_POS_REPORT,
	TEST_DURATION_MS,
    PAGE_REFRESH_PERDIOD_MS,
    NB_VIEWERS,
    NB_CONCURRENT_COMPETITORS_QUERIED
};