const utilities = require('../utilities')

const DRS = require('./clients/drs')
const JDNS = require('./clients/jdns')

const { EventEmitter } = require('events')

const unlockedfirstTimeUserExperienceData = require(
  '../data/unlocked-ftue-data.json'
)

/**
 * The bot player implementation.
 */
class Player {
  /**
   * Initialize the player.
   * @param {String} environment Environment name. Example: "ire-prod".
   */
  constructor (environment = 'ire-prod') {
    this.$clients = {
      drs: null, jdns: new JDNS(environment)
    }
    this.$state = {
      currentDancercardId: null,
      drsMessageEmitter: null,
      playerConnectionEmitter: null
    }
  }

  /**
   * Checks (and updates if necessary) the COPPA data procession status.
   * @returns {Object} COPPA data procession status.
   */
  async $checkCOPPA () {
    if (!this.$state.currentDancercardId) {
      throw new Error('dancercard id not found in current state')
    }

    const gdprCOPPAInformation = await this.$clients.jdns.getGDPRCOPPAFields(
      this.$state.currentDancercardId
    )

    if (gdprCOPPAInformation.age === -1) {
      return this.$clients.jdns.setGDPRCOPPAFields(
        this.$state.currentDancercardId,
        utilities.randomInt(0, 85)
      )
    }
  }

  /**
   * Unlocks the dancercard.
   * @returns {Object} Dancercard information.
   */
  async $unlockDancercard () {
    if (!this.$state.currentDancercardId) {
      throw new Error('dancercard id not found in current state')
    }

    return this.$clients.jdns.updateDancerCard(
      this.$state.currentDancercardId,
      'Colin', // Player name
      371, // Avatar with a simple black hair
      'CN', // China
      1, // First global version
      unlockedfirstTimeUserExperienceData
    )
  }

  /**
   * Creates a dancercard.
   */
  async createDancercard () {
    this.$state.currentDancercardId = await this.$clients.jdns.hello()

    await Promise.all([
      this.$checkCOPPA(),
      this.$unlockDancercard()
    ])

    return this.$state.currentDancercardId
  }

  /**
   * Connects to the room.
   *
   * @param {Number} roomCode Room code of the screen.
   * @returns {EventEmitter} Message emitter.
   */
  async connectToRoom (roomCode) {
    if (!this.$state.currentDancercardId) {
      throw new Error('please create dancercard before calling this method')
    }

    if (this.$clients.drs && this.$state.drsMessageEmitter) {
      throw new Error('please disconnect from current room before calling this method')
    }

    const [
      { drs: host, port },
      dancerCard
    ] = await Promise.all([
      this.$clients.jdns.checkRoomController(
        roomCode
      ),
      this.$clients.jdns.getDancerCard(
        this.$state.currentDancercardId
      )
    ])

    this.$clients.drs = new DRS(host, port)
    this.$state.drsMessageEmitter = await this.$clients.drs.connect(
      dancerCard
    )

    this.$state.playerConnectionEmitter = new EventEmitter()
    return this.$state.playerConnectionEmitter
  }
}

module.exports = Player
