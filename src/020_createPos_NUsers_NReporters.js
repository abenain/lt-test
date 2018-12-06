const {TEST_DURATION_MS, WS_URL} = require('../config/config');
const {races: raceIds} = require('../config/races');
const {users: userCredentials} = require('../config/users');
const {getDetailedUsersAndRaces, getInitialUsersInRacesStatus, getUserTimer} = require('./lib');

getDetailedUsersAndRaces(userCredentials, raceIds)
	.then(({users, races}) => {
		const usersInRaces = getInitialUsersInRacesStatus(users, races);
		
		console.log(`--- starting livetracking test on ${WS_URL} (${TEST_DURATION_MS / 1000 / 60} min)`);
		
		const userTimers = Object.keys(usersInRaces).map(email => getUserTimer(usersInRaces[email]));

		setTimeout(() => {
			userTimers.forEach(timerId => clearInterval(timerId));

			console.log(`--- end livetracking test`);

			process.exit(0);
		}, TEST_DURATION_MS);
	})
	.catch(error => {
		console.error(error);
		process.exit(-1);
	});

