const axios = require('axios');

const {WS_URL} = require('./config');
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

module.exports = {
	getDetailedUsersAndRaces,
};