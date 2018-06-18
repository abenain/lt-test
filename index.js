const {races: raceIds} = require('./races');
const {users: userCredentials} = require('./users');
const {getDetailedUsersAndRaces} = require('./lib');

getDetailedUsersAndRaces(userCredentials, raceIds)
	.then(({users, races}) => {
		process.exit(0);
	})
	.catch(error => {
		console.error(error);
		process.exit(-1);
	});

