const Player = require('./player/implementation')

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
    await player.connectToRoom()
  } catch (error) {
    process.exitCode = -1

    return console.error(
      `[error] connection to the room failed: ${error.message}`
    )
  }
}

bootstrap()
