const shortid = require('shortid')
const moment = require('moment')

const {createRace, enrollCompetitorsInRace} = require('./lib')
const {eventId} = require('../config/event')
const {manager} = require('../config/users')

const newRace = {
	name: `race-${shortid.generate()}`,
	startDate: moment(),
	endDate: moment().add(1, 'days'),
	event: eventId,
	online: true,
	discipline: '5aca308017e51020001afe3c',
	timezone: '%28GMT-08%3A00%29%20Pacific%20Time%20-%20Tijuana',
}

function getNCompetitorsCid(nbCompetitors){
	const cids = []
	for(let i=0; i<nbCompetitors; i++){
		cids.push(shortid.generate())
	}
	return cids
}
function getNCompetitors(nbCompetitors){
	return getNCompetitorsCid(nbCompetitors).map(cid => ({
		email: `${cid}@a.com`,
		surname: `surname-${cid}`,
		name: `name-${cid}`,
		number: cid,
		sex: 'male'
	}))
}

const competitors = getNCompetitors(4)

createRace(manager, eventId, newRace)
	.then(race => {
		console.log(`created race:`)
		console.log(`name: ${race._id}`)
		console.log(`name: ${race.name}`)

		return enrollCompetitorsInRace(manager, race._id, competitors)
	})
	.then(competitors => {
		const filteredCompetitors = competitors.filter(competitor => competitor);
		console.log(`enrolled ${filteredCompetitors.length} competitors: ${JSON.stringify(filteredCompetitors)}`)

		process.exit(0)
	})
	.catch(error => {
		console.error(error)
		process.exit(-1)
	})
