// disabled for JSDoc typing.
// eslint-disable-next-line no-unused-vars
const { createSocket, Socket } = require('dgram');
// disabled for JSDoc typing.
// eslint-disable-next-line no-unused-vars
const BaseRaftState = require('./States/BaseRaftState');
const { FollowerState } = require('./States/FollowerState');
// disabled for JSDoc typing.
// eslint-disable-next-line no-unused-vars
const Types = require('./Types');
const { getRandomMID } = require('./Utilities');

const BROADCAST = 'FFFF';

/**
 * The Replica object. (Also serves as context for our three states: Follower, Candidate, Leader).
 * @class
 */
class Replica {
  /**
   * Creates an instance of Replica.
   * @param {number} port - The port number to send messages to.
   * @param {string} id - The ID of the replica.
   * @param {string[]} others - An array of IDs of other replicas.
   */
  constructor(port, id, others) {
    console.log(typeof port, port, id);
    /** @property {int} port - This replica's port number on the localhost that you should send UDP packets to in order to communicate with your replicas. */
    this.port = port;
    /** @property {string} id - This replica's id to identify itself in messages. */
    this.id = id;
    /** @property {string[]} others - The other replicas in the replica set. */
    this.others = others;
    /** @property {Socket} - This replica's socket it will use to send messages. */
    this.socket = createSocket('udp4');
    // this.socket.bind(0, '0.0.0.0');
    /**
     * The current state of the Raft algorithm.
     * @property {BaseRaftState} - This replica's current state. */
    this.state = new FollowerState(this);

    /* ________ Raft properties ________ */
    /** @property {int} term - This replica's current term. */
    this.term = 0;
    /** @property {Entry[]} log - This replica's log of entries (get/puts) */
    this.log = [];
  }

  /**
   * Get the replica up and running, using the current state's logic.
   * @method run */
  run() {
    // Send a HELLO message once at startup.
    const hello = {
      src: this.id,
      dst: 'FFFF',
      leader: 'FFFF',
      type: 'hello',
      MID: getRandomMID(),
    };
    this.send(hello);

    this.state.run();
  }

  /**
   * Change the the state of the replica to the given state and then run the replica with the state's logic
   * @method changeState
   * @param {BaseRaftState} state - The new state of the replica. */
  changeState(state) {
    this.state = state;
    this.state.run();
  }

  /**
   * Send a message.
   * @method send
   * @param {Types.Message} message - The message to send. */
  send(message) {
    const messageSerialized = JSON.stringify(message);
    this.socket.send(messageSerialized, Number(this.port), 'localhost');
  }
}

module.exports = {
  Replica,
  BROADCAST,
};
