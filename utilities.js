const randomInt = (min, max) => {
  if (min > max) {
    throw new Error("minimum value can't be maximum in range")
  }

  return Math.floor(
    (Math.random() * (max - min)) + min
  )
}

module.exports = { randomInt }
