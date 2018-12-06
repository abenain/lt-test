const axios = require('axios')

const {WS_URL, USER_REPORT_PERIOD_MS, NB_CONCURRENT_POS_REPORT, PAGE_REFRESH_PERDIOD_MS, NB_CONCURRENT_COMPETITORS_QUERIED} = require('../config/config')

const AUTH_URL = `${WS_URL}/auth/local`
const RACE_URL = `${WS_URL}/api/v2/races`
const POSITION_URL = `${WS_URL}/api/v2/positions/races`
const EVENTS_URL = `${WS_URL}/api/v2/events`
const LIVETRACKING_URL_EXTENSION = `livetracking`

const TOKEN_PREFIX = 'Bearer '

function getUsersWithTokens(users) {
	return Promise.all(users.map(user => {
		return axios.post(AUTH_URL, user).then(({status, data}) => {
			if (status === 200) {
				return {
					...user,
					...data,
				}
			}

			return user
		})
	}))
}

const getAuthorizationHeaderForUser = userWithToken => ({
	Authorization: `${TOKEN_PREFIX}${userWithToken.token}`
})

function getRacesDetails(raceIds, userWithToken) {
	const headers = getAuthorizationHeaderForUser(userWithToken)
	return Promise.all(raceIds.map(raceId => {
		return axios.get(`${RACE_URL}/${raceId}`, {headers})
			.then(({status, data}) => status === 200 && data)
			.then(raceData => raceData && axios.get(`${RACE_URL}/${raceId}/track`, {headers})
				.then(({status, data}) => status === 200 && ({...raceData, ...data}))
			)
	}))
}

function getDetailedUsersAndRaces(userCredentials, raceIds) {
	return getUsersWithTokens(userCredentials)
		.then(users => {
			if (!users.length || !users[0].token) {
				throw new Error('no user token available')
			}

			return getRacesDetails(raceIds, users[0]).then(races => ({races, users}))
		})
}

function getInitialUsersInRacesStatus(users, races) {
	const usersInRacesStatus = {}
	users.forEach(user => {
		usersInRacesStatus[user.email] = {
			email: user.email,
			id   : user._id,
			token: user.token,
			races: races.map(({_id: id, name, trackpoints}) => ({
				id,
				name,
				trackpoints,
				index: 0,
			}))
		}
	})
	return usersInRacesStatus
}

function getRacesMap(races) {
	const racesMap = {}
	races.forEach(race => {
		racesMap[race._id] = {
			name       : race.name,
			trackpoints: race.trackpoints
		}
	})
	return racesMap
}

function sendPosition(user, race, position) {
	const {lat: latitude, lng: longitude, ele: elevation} = position
	const headers = getAuthorizationHeaderForUser(user)
	return axios.post(`${POSITION_URL}/${race.id}`, {latitude, longitude, elevation}, {headers})
}

function getFullLivetrackingResults(race) {
	return axios.get(`${RACE_URL}/${race._id}/${LIVETRACKING_URL_EXTENSION}`)
}

function getCompetitorsPositions(race) {
	return axios.get(`${POSITION_URL}/${race._id}`)
}

function getAllPositionsForCompetitor(race, competitor) {
	return axios.get(`${POSITION_URL}/${race._id}/competitors/${competitor._id}`)
}

function sendCompetitorPosition(user, participant, position) {
	const {lat: latitude, lng: longitude, ele: elevation} = position
	const headers = getAuthorizationHeaderForUser(user)
	const competitor = participant._id
	const date = new Date().toISOString()
	console.log(JSON.stringify(user))

	const reporter = user.id
	const body = {latitude, longitude, elevation, competitor, date, reporter}
	console.log("posting to " + `${POSITION_URL}/${participant.race}` + " body " + JSON.stringify(body) + " headers " + JSON.stringify({headers}))
	return axios.post(`${POSITION_URL}/${participant.race}`, body, {headers})
}

function getRandomNoise() {
	return Math.floor(Math.random() * 10) / 10000
}

function getNextPosition(index, trackpoints) {
	const trackpoint = trackpoints[index]
	return {
		...trackpoint,
		lat: trackpoint.lat + getRandomNoise(),
		lng: trackpoint.lng + getRandomNoise(),
	}
}

function sendPositionsForUserInRace(user, race) {
	console.log(`sending ${NB_CONCURRENT_POS_REPORT} pos for user ${user.email} in race ${race.name}`)
	const promises = []
	for (let i = 0; i < NB_CONCURRENT_POS_REPORT; i++) {
		const position = getNextPosition(race.index, race.trackpoints)
		race.index = (race.index + 1) % race.trackpoints.length
		promises.push(sendPosition(user, race, position))
	}

	return Promise.all(promises)
}

function sendPositionsForCompetitorInRace(reporter, competitor, race) {
	console.log(`sending ${NB_CONCURRENT_POS_REPORT} pos for competitor ${competitor.name} in race ${race.name}`)
	const promises = []
	for (let i = 0; i < NB_CONCURRENT_POS_REPORT; i++) {
		const position = getNextPosition(competitor.index, race.trackpoints)
		competitor.index = (competitor.index + 1) % race.trackpoints.length
		const {email, id, token} = reporter
		promises.push(sendCompetitorPosition({email, id, token}, competitor, position))
	}
	return Promise.all(promises)
}

function refreshPageData(race, viewer) {
	console.log(`refreshing data for ${NB_CONCURRENT_COMPETITORS_QUERIED} pos for viewer ${viewer} in race ${race.name}`)
	const promises = []
	const startTime = new Date().getTime()
	promises.push(getFullLivetrackingResults(race).then((response) => {
		const time = new Date().getTime()
		const timeDiff = time - startTime
		console.log("getting full livetracking results took " + timeDiff + "ms (" + response.data.length + " results)")
	}).catch(error => {
		console.log(`getting full livetracking results failed ${error}`)
	}))
	promises.push(getCompetitorsPositions(race).then((response) => {
		const time = new Date().getTime()
		const timeDiff = time - startTime
		console.log("getting positions for all competitors took " + timeDiff + "ms (" + response.data.length + " positions)")
	}).catch(error => {
		console.log(`getting positions for all competitors failed ${error}`)
	}))
	for (let i = 0; i < NB_CONCURRENT_COMPETITORS_QUERIED; i++) {
		const index = (i + 1) % race.competitors.length
		promises.push(getAllPositionsForCompetitor(race, race.competitors[index]).catch(error => {
			//maybe we just don't have positions for that competitor
			// console.log(`getting positions for competitor ` + race.competitors[index].name + ` failed: ${error}`)
		}))
	}
	return Promise.all(promises)
}

const getUserTimer = userInRaces => setInterval(() => {
	userInRaces.races.forEach(race => {
		const {email, id, token} = userInRaces
		sendPositionsForUserInRace({email, id, token}, race).catch(error => {
			console.log(`create position request failed: ${error}`)
		})
	})
}, USER_REPORT_PERIOD_MS)

const getCompetitorTimer = (reporter, competitor, race) => setInterval(() => {
	sendPositionsForCompetitorInRace(reporter, competitor, race).catch(error => {
		console.log(`create position request failed: ${error}`)
	})
}, USER_REPORT_PERIOD_MS)

const getViewerTimer = (reporter, viewerNr, races) => setInterval(() => {
	races.forEach(race => {
		refreshPageData(race, viewerNr).catch(error => {
			console.log(`refreshing page data failed: ${error}`)
		})
	})
}, PAGE_REFRESH_PERDIOD_MS)

const createRace = (userCredentials, eventId, race) => {
	return getUsersWithTokens([userCredentials])
		.then(users => users && users.length && users[0])
		.then(userWithToken => {
			const headers = getAuthorizationHeaderForUser(userWithToken)
			return axios.post(`${EVENTS_URL}/${eventId}/races`, {
				...race
			}, {headers})
		})
		.then(({status, data}) => status === 201 && data)
}

module.exports = {
	getDetailedUsersAndRaces,
	getInitialUsersInRacesStatus,
	getUserTimer,
	getRacesMap,
	getCompetitorTimer,
	getViewerTimer,
	createRace
}