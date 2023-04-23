const Player = require('./player/implementation')

const bootstrap = async () => {
  const player = new Player()

  try {
    await player.createDancercard()
  } catch (error) {
    process.exitCode = -1

    return console.error(
      `[error] dancercard creation failed: ${error.message}`
    )
  }

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
