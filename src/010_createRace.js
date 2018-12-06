const shortid = require('shortid')
const moment = require('moment')

const {createRace} = require('./lib')
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

createRace(manager, eventId, newRace)
	.then(race => {
		console.log(`created race:`)
		console.log(`name: ${race._id}`)
		console.log(`name: ${race.name}`)
		process.exit(0)
	})
	.catch(error => {
		console.error(error)
		process.exit(-1)
	})
