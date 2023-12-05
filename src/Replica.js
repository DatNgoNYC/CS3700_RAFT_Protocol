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
const { getRandomMID, BROADCAST } = require('./Utilities');
const { CandidateState } = require('./States/CandidateState');
const { LeaderState } = require('./States/LeaderState');

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
    /** @property {number} port - This replica's port number on the localhost that you should send UDP packets to in order to communicate with your replicas. */
    this.port = port;
    /** @property {string} id - This replica's id to identify itself in messages. */
    this.id = id;
    /** @property {string[]} others - The other replicas in the replica cluster. */
    this.others = others;
    /** @property {Socket} - This replica's socket it will use to send messages. */
    this.socket = createSocket('udp4');
    this.socket.bind(0, '0.0.0.0');
    /** @property {BaseRaftState} - This replica's current state. */
    this.state = new FollowerState(this);

    /*  🚣‍♀️ [Raft] 🚣‍♀️ */
    /** PERSISTENT state on all servers:
     * (Updated on stable storage before responding to RPCs) */
    /** @property {number} term - This replica's current term. */
    this.currentTerm = 0;
    /** @property {string} - The candidate that received this replica's vote this current term. */
    this.votedFor = null;
    /** @property {Types.Entry[]} log - This replica's log of entries (puts) */
    this.log = [];
    /** VOLATILE state on all servers:  */
    /** @property {number} commitIndex - index of highest log entry known to be committed (initialized to 0, increases monotonically). */
    this.commitIndex = 0;
    /** @property {number} lastApplied - index of highest log entry applied to state machine (initialized to 0, increases monotonically). */
    this.lastApplied = 0;
  }

  /** Get the replica up and running, using the current state's logic.
   * @method run */
  run() {
    // Send a HELLO message once at startup.
    const hello = {
      src: this.id,
      dst: BROADCAST,
      leader: 'FFFF',
      type: 'hello',
      MID: getRandomMID(),
    };
    this.send(hello);

    this.state.run();

    // add the initial handlemessage here
  }

  /** Change the the state of the replica to the given state and then run the replica with the state's logic
   * @method changeState
   * @param {string} state - The new state of the replica. */
  changeState(state) {
    switch (state) {
      case 'Follower':
        this.state = new FollowerState(this);
        break;
      case 'Candidate':
        this.state = new CandidateState(this);
        break;
      case 'Leader':
        this.state = new LeaderState(this);
        break;
      default:
        break;
    }
    this.state.run();

    // do something here to handle attaching and removing recursively.
  }

  /** Send a message to the simulator in the required JSON format.
   * @method send
   * @param {Types.Message} message - The message to send. */
  send(message) {
    const messageSerialized = JSON.stringify(message);
    this.socket.send(messageSerialized, Number(this.port), 'localhost');
  }
}

module.exports = {
  Replica,
};
