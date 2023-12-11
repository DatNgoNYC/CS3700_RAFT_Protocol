/** @constant BROADCAST - The destintion required to broadcast a message. */
const BROADCAST = 'FFFF';

/** @constant BROADCAST - The destintion required to broadcast a message. */
const HEARTBEAT_INTERVAL = 100;

/**
 *
 * @returns a thirteen character long unique base-36 string id.
 */
function getRandomMID() {
   return Math.random().toString(36).substring(2, 15);
}

/**
 * @returns a random duration for the election cycle.
 */
function getRandomDuration() {
   return Math.floor(HEARTBEAT_INTERVAL * 4 + Math.random() * 2 * HEARTBEAT_INTERVAL );
}

module.exports = {
   BROADCAST,
   HEARTBEAT_INTERVAL,
   getRandomMID,
   getRandomDuration,
};
