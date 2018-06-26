const axios = require('axios');

const {WS_URL, USER_REPORT_PERIOD_MS, NB_CONCURRENT_POS_REPORT} = require('./config');
const AUTH_URL = `${WS_URL}/auth/local`;
const RACE_URL = `${WS_URL}/api/v2/races`;
const CREATE_POSITION_URL = `${WS_URL}/api/v2/positions/races`;
const TOKEN_PREFIX = 'Bearer ';

function getUsersWithTokens(users){
	return Promise.all(users.map(user => {
		return axios.post(AUTH_URL, user).then(({status, data}) => {
			if(status === 200){
				return {
					...user,
					...data,
				};
			}

			return user;
		});
	}));
}

const getAuthorizationHeaderForUser = userWithToken => ({
	Authorization: `${TOKEN_PREFIX}${userWithToken.token}`
});

function getRacesDetails(raceIds, userWithToken){
	const headers = getAuthorizationHeaderForUser(userWithToken);
	return Promise.all(raceIds.map(raceId => {
		return axios.get(`${RACE_URL}/${raceId}`, {headers})
			.then(({status, data}) => status === 200 && data)
			.then(raceData => raceData && axios.get(`${RACE_URL}/${raceId}/track`, {headers})
				.then(({status, data}) => status === 200 && ({...raceData, ...data}))
			);
	}));
}

function getDetailedUsersAndRaces(userCredentials, raceIds){
	return getUsersWithTokens(userCredentials)
		.then(users => {
			if(!users.length || !users[0].token){
				throw new Error('no user token available');
			}

			return getRacesDetails(raceIds, users[0]).then(races => ({races, users}));
		});
}

function getInitialUsersInRacesStatus(users, races){
	const usersInRacesStatus = {};
	users.forEach(user => {
		usersInRacesStatus[user.email] = {
			email: user.email,
			id: user._id,
			token: user.token,
			races: races.map(({_id: id, name, trackpoints}) => ({
				id,
				name,
				trackpoints,
				index: 0,
			}))
		};
	});
	return usersInRacesStatus;
}

function sendPosition(user, race, position){
	const {lat: latitude, lng: longitude, ele: elevation} = position;
	const headers = getAuthorizationHeaderForUser(user);
	return axios.post(`${CREATE_POSITION_URL}/${race.id}`, {latitude, longitude, elevation}, {headers});

}

function getRandomNoise(){
	return Math.floor(Math.random() * 10) / 10000;
}

function getNextPosition({index, trackpoints}){
	const trackpoint = trackpoints[index];
	return {
		...trackpoint,
		lat: trackpoint.lat + getRandomNoise(),
		lng: trackpoint.lng + getRandomNoise(),
	};
}

function sendPositionsForUserInRace(user, race){
	console.log(`sending ${NB_CONCURRENT_POS_REPORT} pos for user ${user.email} in race ${race.name}`);
	const promises = [];
	for(let i=0; i < NB_CONCURRENT_POS_REPORT; i++){
		const position = getNextPosition(race);
		race.index = (race.index + 1) % race.trackpoints.length;
		promises.push(sendPosition(user, race, position));
	}

	return Promise.all(promises);
}

const getUserTimer = userInRaces => setInterval(() => {
	userInRaces.races.forEach(race => {
		const {email, id, token} = userInRaces;
		sendPositionsForUserInRace({email, id, token}, race).catch(error => {
			console.log(`create position request failed: ${error}`);
		})
	});
}, USER_REPORT_PERIOD_MS);

module.exports = {
	getDetailedUsersAndRaces,
	getInitialUsersInRacesStatus,
	getUserTimer,
};