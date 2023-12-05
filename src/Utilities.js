/**
 * 
 * @returns a thirteen character long unique base-36 string id.
 */
function getRandomMID() {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * @returns a random duration for the election cycle between 150 and 300.
 */
function getRandomDuration() {
  return Math.floor(Math.random() * 150 + 150);
}

/** @constant BROADCAST - The destintion required to broadcast a message. */
const BROADCAST = 'FFFF'

module.exports = {
  getRandomMID,
  getRandomDuration,
  BROADCAST
};
