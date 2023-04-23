const utilities = require('../utilities')

const DRS = require('./clients/drs') // eslint-disable-line no-unused-vars
const JDNS = require('./clients/jdns')

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
    this.$state = { currentDancercardId: null }
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
   * @param {Number} roomCode Room code of the screen.
   */
  async connectToRoom (roomCode) {
    throw new Error(
      'Player.connectToRoom() function is not implemented yet.'
    )
  }
}

module.exports = Player
