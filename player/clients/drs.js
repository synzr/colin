const net = require('net')
const fs = require('fs')
const zlib = require('zlib')

const { EventEmitter } = require('events')

const compressionDictionary = fs.readFileSync(
  './data/compression-dictionary.txt'
)
const compressionLevel = 2

/**
 * Dance Room Service mobile client
 */
class DRS {
  /**
   * Initialize the client.
   *
   * @param {String} host IP address to the server.
   * @param {Number?} port Port of the server. Defaults to 4001.
   */
  constructor (host, port = 4001) {
    this.$connectionAddress = { host, port }
    this.$state = {
      messageEmitter: null,
      connection: null,
      dancerCard: null
    }
  }

  /**
   * Promise handler of DRS.connect().
   *
   * @param {Function} resolve Resolve function
   * @param {Function} reject Reject function
   */
  $connectPromiseHandler (resolve, reject) {
    this.$state.connection = net.createConnection(
      this.$connectionAddress
    )

    this.$state.messageEmitter = new EventEmitter()

    this.$state.messageEmitter.on('ping', this.$onPingMessage.bind(this))
    this.$state.messageEmitter.on('sync', this.$onSyncMessage.bind(this))

    this.$state.connection.on('connection', () => {
      return resolve(this.$state.messageEmitter)
    })

    this.$state.connection.on('data', this.$dataRecevied.bind(this))
  }

  /**
   * Connects to the server.
   *
   * @param {Object} dancerCard Dancercard information.
   * @returns {EventEmitter} Message emitter.
   */
  connect (dancerCard) {
    if (this.$state.messageEmitter) {
      throw new Error('you cant reconnect to drs')
    }

    return new Promise(this.$connectPromiseHandler.bind(this))
  }

  /**
   * The data handler.
   * @param {Buffer} data Raw data.
   */
  $dataRecevied (data) {
    console.debug(`[debug] raw packet: ${data.toString('base64url')}`)

    const uncompressedMessage = zlib.inflateRawSync(
      data.subarray(4, data.length),
      { dictionary: compressionDictionary }
    )
    const message = JSON.parse(uncompressedMessage)

    console.debug('[debug] parsed message from packet:', message)

    this.$state.messageEmitter.emit(message.func, message)
  }

  /**
   * Sends a message to the server.
   * @param {Object} message Message information.
   */
  sendMessage (message) {
    const rawMessage = Buffer.from(JSON.stringify(message), 'utf-8')

    const compressedMessage = zlib.deflateRawSync(
      rawMessage,
      { dictionary: compressionDictionary, level: compressionLevel }
    )

    let compressedMessageSize = compressedMessage.length

    if (compressedMessageSize > 0x1ffff) {
      throw new Error('compressed size is too big')
    }

    compressedMessageSize |= compressionLevel << 17

    const compressedMessageSizeEncoded = Buffer.from(
      compressedMessageSize
        .toString(36)
        .padStart(4, '0'),
      'utf-8'
    )

    const packet = Buffer.concat([
      compressedMessageSizeEncoded,
      compressedMessage
    ])

    this.$state.connection.write(packet)

    console.debug(
      `[debug] sent the ${message.func} message. packet size is ${packet.length}`
    )
  }

  /**
   * Handles the `sync` message from the server.
   * @param {Object} message Message information.
   */
  $onSyncMessage (message) {
    const {
      sync: { o: serverTime }
    } = message
    const currentTime = Date.now()

    console.debug(
      `[debug] recevied the sync message. server time is ${serverTime}, current time is ${currentTime}`
    )

    return this.sendMessage({
      func: 'sync',
      o: serverTime,
      r: currentTime,
      t: currentTime,
      d: 0
    })
  }

  /**
   * Handles the `ping` message from the server.
   */
  $onPingMessage () {
    console.debug('[debug] recevied the ping message.')
    return this.sendMessage({ func: 'pong' })
  }
}

module.exports = DRS
