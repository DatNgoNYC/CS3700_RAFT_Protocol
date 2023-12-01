const BaseRaftState = require('./BaseRaftState');

/**
 * Candidate state class.
 * @class
 * @extends BaseRaftState
 */
class CandidateState extends BaseRaftState {
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
   * [FOLLOWER] Set up the electionTimeout mechanism. Add the message handler for all incoming messages (will either be a 'heartbeat'/appendEntries RPC or RequestVote RPC).
   * @method run */
  run() {
    const randomDuration = Math.floor(Math.random() * 150 + 150);
    this.setupTimeout(this.timeoutHandler, randomDuration);

    this.replica.socket.on('message', this.messageHandler);
  }

  /**
   * Set up the timeout for the state.
   * @method setupTimeout
   * @param {Function} callback - Callback function to be executed on timeout.
   * @param {number} timeout - Timeout duration in milliseconds.
   */
  setupTimeout(callback, timeout) {
    this.timeoutId = setTimeout(callback, timeout);
  }

  /**
   * The event handler, dependent on state, for when the replica has a 'timeout' event.
   *
   * [FOLLOWER] In the Follower state you should transition the replica to the candidate state. In this context, the 'timeout' of the follower is the election timeout. Remove the current messageHandler for this state before you transition to the new one.
   * @method timeoutHandler
   */
  timeoutHandler() {
    this.replica.socket.removeListener('message', this.messageHandler);
    this.replica.changeState(new CandidateState(this.replica));
  }

  /**
   * Each state has specific message handling logic.
   *
   * [FOLLOWER] Upon receiving a heartbeat/AppendEntry RPC or VoteRequest RPC it should execute the appropiate steps and reset its election timeout with a random duration from 150ms - 300ms. If there is a VoteRequest RPC, execute the appropiate steps.
   * @method messageHandler
   * @param {Buffer} message */
  messageHandler(message) {
    console.log(message.toJSON());
    // respond however we'd like...
    // if appendEntry
    //  then do what needs to be done
    // else if VoteRequest

    clearTimeout(this.timeoutId);

    const randomDuration = Math.floor(Math.random() * 150 + 150);
    this.setupTimeout(this.timeoutHandler, randomDuration);
  }
}

module.exports = {
  CandidateState,
};