const axios = require('axios');

const {WS_URL, USER_REPORT_PERIOD_MS, NB_CONCURRENT_POS_REPORT} = require('./config');
const AUTH_URL = `${WS_URL}/auth/local`;
const RACE_URL = `${WS_URL}/api/v2/races`;
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
			races: races.map(race => ({
				id: race._id,
				name: race.name,
				index: 0,
			}))
		};
	});
	return usersInRacesStatus;
}

const getUserTimer = userInRaces => setInterval(() => {
	console.log(`sending ${NB_CONCURRENT_POS_REPORT} pos for user ${userInRaces.email}`);
}, USER_REPORT_PERIOD_MS);

module.exports = {
	getDetailedUsersAndRaces,
	getInitialUsersInRacesStatus,
	getUserTimer,
};