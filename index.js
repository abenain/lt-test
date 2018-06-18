const axios = require('axios');
const q = require('q');
const {WS_URL} = require('./config');
const {races} = require('./races')
const {users} = require('./users')

const AUTH_URL = `${WS_URL}/auth/local`;
const RACE_URL = `${WS_URL}/api/v2/races`;
const TOKEN_PREFIX = 'Bearer ';

function getUsersWithTokens(users){
	return q.all(users.map(user => {
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
	return q.all(raceIds.map(raceId => {
		return axios.get(`${RACE_URL}/${raceId}`, {headers})
			.then(({status, data}) => status === 200 && data)
			.then(raceData => raceData && axios.get(`${RACE_URL}/${raceId}/track`, {headers})
				.then(({status, data}) => status === 200 && ({...raceData, ...data}))
			);
	}));
}

getUsersWithTokens(users)
	.then(usersWithTokens => {
		if(usersWithTokens.length && usersWithTokens[0].token){
			return getRacesDetails(races, usersWithTokens[0]);
		}

		return null;
	})
	.then(racesWithDetails => {
		process.exit(0);
	})
	.catch(error => {
		console.error(error);
		process.exit(-1);
	});

