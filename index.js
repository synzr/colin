const Player = require('./player/implementation')

const roomCode = 2440

const bootstrap = async () => {
  const player = new Player()
  const state = {}

  try {
    state.dancerCardId = await player.createDancercard()
  } catch (error) {
    process.exitCode = -1

    return console.error(
      `[error] dancercard creation failed: ${error.message}`
    )
  }

  console.debug(
    `[debug] dancercard id: ${state.dancerCardId}`
  )

  try {
    state.connectionEmitter = await player.connectToRoom(
      roomCode
    )
  } catch (error) {
    process.exitCode = -1

    console.debug(error)
    return console.error(
      `[error] connection to the room failed: ${error.message}`
    )
  }
}

bootstrap()
