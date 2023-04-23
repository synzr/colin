const DRS = require('./clients/drs') // eslint-disable-line no-unused-vars
const JDNS = require('./clients/jdns')

class Player {
  constructor (environment = 'ire-prod') {
    this.clients = {
      drs: null, jdns: new JDNS(environment)
    }
    this.state = {}
  }

  async createDancercard () {
    throw new Error(
      'Player.createDancercard() function is not implemented yet.'
    )
  }

  async connectToRoom () {
    throw new Error(
      'Player.connectToRoom() function is not implemented yet.'
    )
  }
}

module.exports = Player
