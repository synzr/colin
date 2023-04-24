const axios = require('axios')

/**
 * Client of Just Dance Now Satellite service
 */
class JDNS {
  /**
   * Initialize the client.
   * @param {String} environment Environment name. Example: "ire-prod".
   */
  constructor (environment) {
    this.$axios = axios.create({
      baseURL: `https://${environment}-jdns.justdancenow.com`,
      headers: { 'x-platform': 'android' }
    })
    this.$state = {
      isHelloDone: false,
      authorizationToken: null
    }
  }

  /**
   * Says "Hello, Satellite! I am a dancercard {insert dancercard identifer here}!" to the service!
   *
   * @param {String?} dancerCardId Dancercard identifier. Optional.
   * @param {String?} languageCode 2-letter ISO language code. Defaults to "en".
   *
   * @returns {String} Dancercard identifier from the hello response.
   */
  async hello (dancerCardId = undefined, languageCode = 'en') {
    if (this.$state.isHelloDone) {
      throw new Error('hello was done before your request')
    }

    const body = {
      /**
       * The dancercard identifier field.
       *
       * If the value of this field is not a valid ObjectID,
       * the service will create a new empty dancercard.
       */
      text: dancerCardId !== undefined
        ? dancerCardId
        : 'Hello',
      firstPartyId: '', // Apple ID/Google Play Games ID
      teamPlayerId: '',
      lang: languageCode.toLowerCase() // 2-letter ISO language code
    }

    try {
      const { data: response } = await this.$axios.post(
        '/hello', body
      )

      this.$state.isHelloDone = true
      this.$state.authorizationToken = response.authToken

      return response.dancercard._id
    } catch (error) {
      if (error?.response?.status) {
        throw new Error(`bad response status: ${error.response.status}`)
      }

      throw error
    }
  }

  /**
   * Gets a dancercard from the service.
   *
   * @param {String} dancerCardId Dancercard identifier.
   * @returns {Object} Dancercard information.
   */
  async getDancerCard (dancerCardId) {
    if (!this.$state.isHelloDone) {
      throw new Error('please say hello to the satellite')
    }

    try {
      const {
        data: { dancercard: dancerCard }
      } = await this.$axios.get(
        '/getDancerCard', {
          headers: {
            'x-auth-token': `Bearer ${this.$state.authorizationToken}`
          },
          params: { _id: dancerCardId }
        }
      )

      return dancerCard
    } catch (error) {
      if (error?.response?.status) {
        throw new Error(`bad response status: ${error.response.status}`)
      }

      throw error
    }
  }

  /**
   * Updates a dancercard from the service.
   *
   * @param {String} dancerCardId Dancercard identifier.
   * @param {String} playerName Player nickname.
   * @param {Number} avatarNumber Number of the avatar.
   * @param {String} countryCode 2-letter ISO language code
   * @param {Number} globalLevel Global level number.
   * @param {Object} firstTimeUserExperienceData First-time user experience data.
   *
   * @returns {Object} Dancercard information.
   */
  async updateDancerCard (
    dancerCardId,
    playerName,
    avatarNumber,
    countryCode,
    globalLevel,
    firstTimeUserExperienceData
  ) {
    if (!this.$state.isHelloDone) {
      throw new Error('please say hello to the satellite')
    }

    const body = {
      pName: playerName,
      avatar: avatarNumber.toString(),
      country: countryCode.toUpperCase(),
      globalLevel: globalLevel.toString(),
      ftueDatas: JSON.stringify(firstTimeUserExperienceData),
      _id: dancerCardId
    }

    try {
      await this.$axios.post(
        '/updateDancercard', body, {
          headers: {
            'x-auth-token': `Bearer ${this.$state.authorizationToken}`
          }
        }
      )

      return this.getDancerCard(dancerCardId)
    } catch (error) {
      if (error?.response?.status) {
        throw new Error(`bad response status: ${error.response.status}`)
      }

      throw error
    }
  }

  /**
   * Gets a COPPA data procession status (such as age, process data boolean).
   *
   * @param {String} dancerCardId Dancercard identifier.
   * @returns {Object} COPPA data procession status.
   */
  async getGDPRCOPPAFields (dancerCardId) {
    if (!this.$state.isHelloDone) {
      throw new Error('please say hello to the satellite')
    }

    try {
      const { data: response } = await this.$axios.get(
        '/getGDPRCOPPAFields', {
          headers: {
            'x-auth-token': `Bearer ${this.$state.authorizationToken}`
          },
          params: { _id: dancerCardId }
        }
      )

      return response
    } catch (error) {
      if (error?.response?.status) {
        throw new Error(`bad response status: ${error.response.status}`)
      }

      throw error
    }
  }

  /**
   * Updates a COPPA data procession status.
   *
   * @param {String} dancerCardId Dancercard identifier.
   * @param {Number} age Age number.
   *
   * @returns {Object} COPPA data procession status.
   */
  async setGDPRCOPPAFields (dancerCardId, age) {
    if (!this.$state.isHelloDone) {
      throw new Error('please say hello to the satellite')
    }

    const processDataValue = age >= 16
    const body = {
      age,
      processData: processDataValue,
      persoDiscount: processDataValue,
      _id: dancerCardId
    }

    try {
      await this.$axios.post(
        '/setGDPRCOPPAFields', body, {
          headers: {
            'x-auth-token': `Bearer ${this.$state.authorizationToken}`
          }
        }
      )

      return this.getGDPRCOPPAFields(dancerCardId)
    } catch (error) {
      if (error?.response?.status) {
        throw new Error(`bad response status: ${error.response.status}`)
      }

      throw error
    }
  }

  /**
   * Gets a DRS connection information by the room code.
   *
   * @param {Number} roomCode Room code.
   * @returns DRS connection information (such as IP address and port).
   */
  async checkRoomController (roomCode) {
    try {
      const { data: response } = await this.$axios.get(
        '/checkRoomController', {
          params: { roomID: roomCode }
        }
      )

      return response
    } catch (error) {
      if (error?.response?.status) {
        throw new Error(`bad response status: ${error.response.status}`)
      }

      throw error
    }
  }
}

module.exports = JDNS
