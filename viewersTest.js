const {TEST_DURATION_MS, NB_VIEWERS, WS_URL} = require('./config');
const {races: raceIds} = require('./races');
const {users: userCredentials} = require('./users');
const {getDetailedUsersAndRaces, getViewerTimer} = require('./lib');

console.log(`--- starting test to simulate ${NB_VIEWERS} users viewing livetracking on ${WS_URL} (${TEST_DURATION_MS / 1000 / 60} min)`);
console.log(`--- WARNING: run a test with participants or users to generate positions data`);
console.log(`--- getting credentials and races data`);
getDetailedUsersAndRaces(userCredentials, raceIds)
	.then(({users, races}) => {
		const reporter = users[0];

        const timers = []
        console.log(`--- started viewing test`);
        for (i = 0; i< NB_VIEWERS; i++){
            timers.push(getViewerTimer(reporter, i, races));
		}

		setTimeout(() => {
            timers.forEach(timerId => clearInterval(timerId));
			console.log(`--- end livetracking participants test`);
			process.exit(0);
		}, TEST_DURATION_MS);
	})
	.catch(error => {
		console.error(error);
		process.exit(-1);
	});

