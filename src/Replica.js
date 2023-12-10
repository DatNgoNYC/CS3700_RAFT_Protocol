const { createSocket } = require('dgram');
const { Candidate } = require('./States/CandidateState');
const { Leader } = require('./States/LeaderState');
const { BROADCAST } = require('./Utilities');
const { Follower } = require('./States/FollowerState');
// eslint-disable-next-line no-unused-vars
const Types = require('./Types');

/**
 * The Replica class represents a replica in our key-value data store.
 *
 * We are using the state design pattern and so we designate the Replica to act as the "context" as well and allows our state implementations to execute based on the curent "context"/"state" of the replica.
 * @param {string} port - The port our replica should send messages to on localhost.
 * @param {string} id - The id of our replica. It is a string in hexideximal form so exactly four characters, 0-9, a-z.
 * @param {(string)[]} others - The is list of other replicas, by id, in our cluster.

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
    /** @property {BaseRaftState} - This replica's current state. */
    this.state = new Follower(this);
    /** @property {number} port - This replica's port number on the localhost that you should send UDP packets to in order to communicate with your replicas. */
    this.port = port;
    /** @property {string} id - This replica's id to identify itself in messages. */
    this.id = id;
    /** @property {string[]} others - The other replicas in the replica cluster. */
    this.others = others;
    /** @property {Socket} - This replica's socket it will use to send messages. */
    this.socket = createSocket('udp4');
    this.socket.bind(0, '0.0.0.0');
    this.socket.on('message', (buffer) => {
      const jsonString = buffer.toString('utf-8'); // Convert buffer to string
      const message = JSON.parse(jsonString); // Parse from JSON to JS object
      // console.log(
      //   `[${this.state.constructor.name} ${this.id}] ... is receiving a '${message.type}' message.  src:${message.src}, dst:${message.dst}, leader:${message.leader}, type:${message.type}.`
      // );
      let messageContent = Object.entries(message)
        .map(([key, value]) => {
          return key === 'value'
            ? 'value: PLACEHOLDER'
            : key === 'entries'
            ? `entries: ${value.length}`
            : `${key}: ${JSON.stringify(value)}`;
        })
        .join(' | ');

      console.log(
        `[${this.state.constructor.name} ${this.id}] ... is receiving a '${message.type}' message. ${messageContent}.`
      );
    });

    /*  🚣‍♀️ [Raft] 🚣‍♀️ */
    /** PERSISTENT state on all servers:
     * (Updated on stable storage before responding to RPCs) */

    /** @property {number} currentTerm - [Raft] latest term server has seen (initialized to 0 on first boot, increases monotonically). */
    this.currentTerm = 0;
    /** @property {string} - [Raft] candidateId that received vote in current term (or null if none). */
    this.votedFor = null;
    /** @property {Types.Entry[]} log - [Raft] log entries; each entry contains command for state machine, and term when entry was received by leader (first index is 1) */
    this.log = [{ term: 0 }];
    /** [Raft] Volatile state on all servers:  */
    /** @property {number} commitIndex - [Raft] index of highest log entry known to be committed (initialized to 0, increases monotonically). */
    this.commitIndex = 0;
    /** @property {number} lastApplied - [Raft] index of highest log entry applied to state machine (initialized to 0, increases monotonically). */
    this.lastApplied = 0;
    /** @property {Object.<string, string>} stateMachine - The state machine representing key-value pairs. */
    this.stateMachine = {};
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
    };
    this.send(hello);

    this.state.run();
  }

  /** Change the the state of the replica to the given state and then run the replica with the state's logic
   * @method changeState
   * @param {string} state - The new state of the replica. */
  changeState(state) {
    switch (state) {
      case 'Follower':
        this.state = new Follower(this);
        break;
      case 'Candidate':
        this.state = new Candidate(this);
        break;
      case 'Leader':
        this.state = new Leader(this);
        break;
      default:
        break;
    }

    this.state.run();
  }

  /** Send a message to the simulator in the required JSON format.
   * @method send
   * @param {Types.Message} message - The message to send. */
  send(message) {
    let messageContent = Object.entries(message)
      .map(([key, value]) => {
        return key === 'value'
          ? 'value: PLACEHOLDER'
          : key === 'entries'
          ? `entries: ${value.length}`
          : `${key}: ${JSON.stringify(value)}`;
      })
      .join(' | ');

    console.log(
      `[${this.state.constructor.name} ${this.id}] ... is sending a '${message.type}' message. ${messageContent}.`
    );

    const messageSerialized = JSON.stringify(message);
    this.socket.send(messageSerialized, Number(this.port), 'localhost');
  }
}

module.exports = {
  Replica,
};
