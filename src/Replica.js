const { Socket, createSocket } = require('dgram');
const { Follower } = require('./states/Follower');

/**
 * The Replica class represents a replica in our key-value data store.
 *
 * We are using the state design pattern and so we designate the Replica to act as the "context" as well and allows our state implementations to execute based on the curent "context"/"state" of the replica.
 * @param {string} port - The port our replica should send messages to on localhost.
 * @param {string} id = The id of our replica. It is a string in hexideximal form so exactly four characters, 0-9, a-z.
 * @param {(string)[]} others - The is list of other replicas, by id, in our cluster.
 */
class Replica {
  constructor(port, id, others) {
    /** @type {State.js} The state of our replica. */
    this.current_state = new Follower(this);
    /** @type {number}  The port we should send messages to. */
    this.port = Number(port);
    /** @type {string} - The id of our replica. It is a string  */
    this.id = id;
    /** @type {string[]} - The id of our replica. It is a string  */
    this.others = others;
    /** @type {Socket} - Our replica's socket we'll use to communicate across the transport layer. */
    this.socket = createSocket('udp4');
    this.socket.bind(0, '0.0.0.0', () => {
      this.socket.send()

      // create our message as a json object
      // convert it to string
      // argument for this.socket.send();
    });

    /* _______________________ RAFT PROTOCOL PROPERTIES _______________________ */
    /** @type {number} term - The current term of this replica. */
    this.term = 0;
  }

  start() {
    this.current_state.run();
  }

  /** @param {State.js} state - The new state of our replica. */
  changeState(state) {
    this.current_state = state;
  }
}

module.exports = {
  Replica,
};
