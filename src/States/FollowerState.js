const { clearTimeout } = require('timers');
const BaseRaftState = require('./BaseRaftState');
const { CandidateState } = require('./CandidateState');
// Disabled rule for JSDoc typing purposes.
// eslint-disable-next-line no-unused-vars
const { Replica } = require('../Replica');
const { getRandomDuration } = require('../Utilities');

/**
 * Follower state class.
 *
 * [Raft] A replica in the Follower state will take the role of listening and logging under the coordination/lead of the Leader replica.
 * @class
 * @extends BaseRaftState
 */
class FollowerState extends BaseRaftState {
  /**
   * Creates an instance of FollowerState.
   * @param {Replica} replica - The Replica instance.
   */
  constructor(replica) {
    super(replica);
  }
  /**
   * Run the replica with logic defined by each state.
   *
   * 1. Set up the state's 'timeout' mechanism.
   * 2. Set up the state's message handler logic.
   * 
   * [Raft] The Follower should have an 'election timout' that gets called every 150-300ms (the specific duration is randomized every cycle). The election timeout resets on every message.
   * @method run 
   * @abstract */
  run() {
    this.setupTimeout(this.timeoutHandler, getRandomDuration());
    this.replica.socket.on('message', this.messageHandler);
  }

  /**
   * The event handler, dependent on state, for when the replica has a 'timeout' event.
   *
   * [Raft] In the Follower state you should transition the replica to the candidate state. In this context, the 'timeout' of the follower is the election timeout. The replica will now transition to the Candidate state and will proceed in accordance with Raft.
   *
   * @method timeoutHandler
   */
  timeoutHandler() {
    this.replica.socket.removeListener('message', this.messageHandler);
    this.replica.changeState(new CandidateState(this.replica));
  }

  /**
   * Each state has specific message handling logic.
   *
   * [Raft] The replica can either get a message from the client or another replica. Reset the timer on each message. While in the Follower state...
   * 
   * 1. If the message is from a client, send back a "redirect" message. 
   * 2. If the message if from another replica... follow protocol.
   * 
   * @method messageHandler
   * @param {Message} */
  messageHandler() {
    clearTimeout(this.timeoutId);



    const randomDuration = Math.floor(Math.random() * 150 + 150);
    this.setupTimeout(this.timeoutHandler, randomDuration);
  }
}

module.exports = {
  FollowerState,
};
