const axios = require('axios');
const q = require('q');
const {WS_URL} = require('./config');
const {races} = require('./races')
const {users} = require('./users')

const AUTH_URL = `${WS_URL}/auth/local`;
const EVENTS_URL = `${WS_URL}/api/v2/events`;
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

getUsersWithTokens(users)
	.then(usersWithTokens => {
		console.log(JSON.stringify(usersWithTokens))

		return axios.get(EVENTS_URL, {
			headers: {
				Authorization: `${TOKEN_PREFIX}${usersWithTokens[0].token}`
			}
		});
	})
	.then(({status, data}) => {
		console.log(`got events response with status ${status}`);
		console.log(JSON.stringify(data));
		process.exit(0);
	})
	.catch(error => {
		console.error(error);
		process.exit(-1);
	});

