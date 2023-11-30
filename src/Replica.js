// disabled for JSDoc typing.
// eslint-disable-next-line no-unused-vars
const { createSocket, Socket } = require('dgram');
// disabled for JSDoc typing.
// eslint-disable-next-line no-unused-vars
const BaseRaftState = require('./States/BaseRaftState');
const { FollowerState } = require('./States/FollowerState');

// /**
//  * Base class for Raft states (Pseudo-abstract).
//  * @class
//  * @abstract
//  */
// class BaseRaftState {
//   /**
//    * Creates an instance of BaseRaftState.
//    * @param {Types.Replica} replica - The Replica instance.
//    */
//   constructor(replica) {
//     // Reference to the replica

//     this.replica = replica;
//   }

//   /**
//    * Abstract method for running the replica dependent on current state.
//    */
//   run() {
//     throw new Error('Abstract method run must be overridden');
//   }
// }

// /**
//  * Follower state class.
//  * @class
//  * @extends BaseRaftState
//  */
// class FollowerState {
//   /**
//    * Creates an instance of FollowerState.
//    * @param {Replica} replica - The Replica instance.
//    */
//   constructor(replica) {
//     // Call the constructor of the base class
//     BaseRaftState.call(this, replica);
//   }

//   /**
//    * Implement the run method specific to the Follower state.
//    */
//   run() {
//     console.log('Follower State');
//     // Access common properties and methods from the Replica context
//     this.replica.commonMethod();
//   }
// }

// // Set up prototype inheritance for FollowerState
// FollowerState.prototype = Object.create(BaseRaftState.prototype);

// /**
//  * Candidate state class.
//  * @class
//  * @extends BaseRaftState
//  */
// class CandidateState {
//   /**
//    * Creates an instance of CandidateState.
//    * @param {Replica} replica - The Replica instance.
//    */
//   constructor(replica) {
//     // Call the constructor of the base class
//     BaseRaftState.call(this, replica);
//     // Additional property specific to the Candidate state
//     this.candidateProperty = 'Candidate-specific property';
//   }

//   /**
//    * Implement the run method specific to the Candidate state.
//    */
//   run() {
//     console.log('Candidate State');
//     // Access common properties and methods from the Replica context
//     this.replica.commonMethod();
//     // Access state-specific property
//     console.log('Candidate Property:', this.candidateProperty);
//   }
// }

// // Set up prototype inheritance for CandidateState
// CandidateState.prototype = Object.create(BaseRaftState.prototype);

// /**
//  * Leader state class.
//  * @class
//  * @extends BaseRaftState
//  */
// class LeaderState {
//   /**
//    * Creates an instance of LeaderState.
//    * @param {Replica} replica - The Replica instance.
//    */
//   constructor(replica) {
//     // Call the constructor of the base class
//     BaseRaftState.call(this, replica);
//     // Additional method specific to the Leader state
//     this.leaderMethod = function () {
//       console.log('Leader-specific method');
//       // Leader-specific logic
//     };
//   }

//   /**
//    * Implement the run method specific to the Leader state.
//    */
//   run() {
//     console.log('Leader State');
//     // Access common properties and methods from the Replica context
//     this.replica.commonMethod();
//     // Access state-specific method
//     this.leaderMethod();
//   }
// }

// // Set up prototype inheritance for LeaderState
// LeaderState.prototype = Object.create(BaseRaftState.prototype);

// ------------------------------------------------------------------------------

// ------------------------ State Pattern ------------------------

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
    /** @property {int} port - This replica's port number on the localhost that you should send UDP packets to in order to communicate with your replicas. */
    this.port = port;
    /** @property {string} id - This replica's id to identify itself in messages. */
    this.id = id;
    /** @property {string[]} others - The other replicas in the replica set. */
    this.others = others;
    /** @property {Socket} - This replica's socket it will use to send messages. */
    this.socket = createSocket('udp4');
    this.socket.bind(this.port, '0.0.0.0');
    /**
     * The current state of the Raft algorithm.
     * @property {BaseRaftState} - This replica's current state. */
    this.state = new FollowerState(this);

    // ________ Raft properties ________
    /** @property {int} term - This replica's current term. */
    this.term = 0;
    /** @property {Entry[]} log - This replica's log of entries (get/puts) */
    this.log = [];
  }

  /**
   * Get the replica up and running, using the current state's logic.
   * @method run */
  run() {
    this.state.run();
  }

  /**
   * Change the the state of the replica to the given state and then run the replica with the state's logic
   * @method changeState
   * @param {BaseRaftState} state - The new state of the replica. */
  async changeState(state) {
    this.state = state;
    this.state.run();
  }

  /**
   * Send a message.
   * @method send
   * @param {Message} message - The message to send. */
  send(message) {
    this.socket.send(message, this.port, 'localhost');
  }
}

module.exports = {
  Replica,
  // BaseRaftState,
};
