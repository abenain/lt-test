const {TEST_DURATION_MS, WS_URL} = require('./config');
const {races: raceIds} = require('./races');
const {users: userCredentials} = require('./users');
const {getDetailedUsersAndRaces, getRacesMap, getCompetitorTimer} = require('./lib');

console.log(`--- starting livetracking test simulating positions sent by competitors on ${WS_URL} for ${TEST_DURATION_MS / 1000 / 60} min`);
console.log(`--- getting credentials and races data`);
getDetailedUsersAndRaces(userCredentials, raceIds)
	.then(({users, races}) => {
		const reporter = users[0];

        //Races include track and participants
        const racesMap = getRacesMap(races);

        let competitors = [];
        races.forEach((race) => {
            race.competitors.map((competitor) => (
                competitors.push({
                    _id: competitor._id,
                    name: competitor.name,
                    race: competitor.race,
                    index: 0,
                })
			))
		})

		console.log(`--- starting livetracking test`);

		const competitorTimers = competitors.map(competitor => getCompetitorTimer(reporter, competitor, racesMap[competitor.race]));

		setTimeout(() => {
            competitorTimers.forEach(timerId => clearInterval(timerId));
			console.log(`--- end livetracking participants test`);
			process.exit(0);
		}, TEST_DURATION_MS);
	})
	.catch(error => {
		console.error(error);
		process.exit(-1);
	});

