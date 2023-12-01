/**
 * Returns a thirteen character long unique base-36 string id.
 * @function
 */
function getRandomMID() {
  return Math.random().toString(36).substring(2, 15);
}

function getRandomDuration() {
  return Math.floor(Math.random() * 150 + 150);
}

module.exports = {
  getRandomMID,
  getRandomDuration,
};
