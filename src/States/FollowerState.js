const { clearTimeout } = require('timers');
const BaseRaftState = require('./BaseRaftState');
const { CandidateState } = require('./CandidateState');
// Disabled rule for JSDoc typing purposes.
// eslint-disable-next-line no-unused-vars
const { Replica } = require('../Replica');
const { getRandomDuration } = require('../Utilities');
// Disabled rule for JSDoc typing purposes.
// eslint-disable-next-line no-unused-vars
const Types = require('../Types');

/** [Raft] Follower state class.
 *
 * A replica in the Follower state will take the role of listening and logging under the coordination/lead of the Leader replica. Or responding to Candidates when necessary.
 * @class
 * @extends BaseRaftState
 */
class FollowerState extends BaseRaftState {
  /** Creates an instance of FollowerState.
   * @param {Replica} replica - The Replica instance.
   */
  constructor(replica) {
    super(replica);
  }

  /** [Raft] The Follower should have an 'election timout' that gets called every 150-300ms (the specific duration is randomized every cycle). The election timeout resets on every message received.
   * @method run */
  run() {
    this.setupTimeout(this.timeoutHandler, getRandomDuration());
    this.replica.socket.on('message', (buffer) => {
      // Convert buffer to string and then parse as JSON
      const jsonString = buffer.toString('utf-8');
      const message = JSON.parse(jsonString);

      this.messageHandler(message);
    });
  }

  /** [Raft] In the Follower state you should transition the replica to the candidate state. In this state, the 'timeout' is the election timeout. The replica will now transition to the Candidate state and will proceed in accordance with Raft.
   * @method timeoutHandler */
  timeoutHandler() {
    // Remove Follower state's listener so that it doesn't fire when a 'message' even during the new state.
    clearTimeout(this.timeoutId);
    this.replica.socket.removeListener('message', this.messageHandler);
    this.replica.changeState(new CandidateState(this.replica));
  }

  /** [Raft] The replica can either get a message from the client or another replica. Reset the timer on each message. While in the Follower state...
   *
   * 1. If the message is type 'get' or 'put' then it is from a client. In which case send back a "redirect" message.
   *
   * 2. If the message is from another replica... follow protocol.
   *
   * @method messageHandler
   * @param {Types.RequestVoteRPC} message - The message this replica's received. */
  messageHandler(message) {
    clearTimeout(this.timeoutId);

    /** @type { Types.Redirect | Types.VoteResponse } - The response we'll send. The type of message received dicates the type of the response we send. */
    let response;
    switch (message.type) {
      case 'AppendEntryRPC':
        break;

      case 'RequestVoteRPC':
        response = {
          src: this.replica.id,
          dst: message.src,
          leader: this.replica.votedFor,
          type: 'VoteResponse',
          MID: message.MID,

          term: this.replica.currentTerm,
          voteGranted: undefined,
        };

        if (
          message.term < this.replica.currentTerm /** Reply false if term < currentTerm (§5.1) */
        ) {
          response.voteGranted = false;
          this.replica.send(response);
        } else if (
          (this.replica.votedFor === null || this.replica.votedFor === message.candidateID) & //  If votedFor is null or candidateId
          true // [TODO] and candidate’s log is at least as up-to-date as receiver’s log, grant vote (§5.2, §5.4)
        ) {
          response.voteGranted = true;

          this.replica.send(response);
        } else {
          response.voteGranted = false;

          this.replica.send(response);
        }

        break;

      default:
        response = {
          src: this.replica.id,
          dst: message.src,
          leader: this.replica.votedFor,
          type: 'redirect',
          MID: message.MID,
        };
        this.replica.send(response);
        break;
    }

    this.setupTimeout(this.timeoutHandler, getRandomDuration());
  }
}

module.exports = {
  FollowerState,
};
