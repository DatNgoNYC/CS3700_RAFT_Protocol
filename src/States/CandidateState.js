const { getRandomDuration, getRandomMID } = require('../Utilities');
const BaseRaftState = require('./BaseRaftState');
// Disabled rule for JSDoc typing purposes.
// eslint-disable-next-line no-unused-vars
const Types = require('../Types');
const { BROADCAST } = require('../Replica');
const { LeaderState } = require('./LeaderState');
require('./LeaderState');

/** [Raft] Candidate state class.
 *
 * A replica in the Candidate state will try up to take the Leader role by sending out VoteRequest RPCS. It will continue to do so unless there is an AppendEntry RPC from a leader with an overriding term. slay.
 * @class
 * @extends BaseRaftState
 */
class CandidateState extends BaseRaftState {
  /** Creates an instance of CandidateState.
   * @param {Replica} replica - The Replica instance.
   */
  constructor(replica) {
    super(replica);

    /** @property {int} voteTally - The current vote tally for the candidate. */
    this.voteTally = 0;
  }

  /** [Raft] On conversion to candidacy, we start the election. We rerun the election if we did not receive a majority of the votes and our election timeout executes.
   * @method run */
  run() {
    /* Increment the current term. */
    this.replica.currentTerm += 1;

    /* Vote for self. */
    this.replica.votedFor = this.replica.id;
    this.voteTally = 1;

    /** Broadcast the RequestVoteRPC to our replica cluster.
    /** @type {Types.RequestVoteRPC} - Broadcast the VoteRequestRPC using the broadcast channel */
    const requestVoteRPC_Broadcasted = {
      src: this.replica.id,
      dst: BROADCAST,
      leader: this.replica.votedFor,
      type: 'RequestVoteRPC',
      MID: getRandomMID(),
    };
    this.replica.send(requestVoteRPC_Broadcasted);

    this.setupTimeout(this.timeoutHandler, getRandomDuration());
    this.replica.socket.on('message', this.messageHandler);
  }

  /** [Raft] The candidate should rerun the election on timeout.
   * @method timeoutHandler   */
  timeoutHandler() {
    /* Vote for self. */
    this.replica.votedFor = this.replica.id;
    this.voteTally = 1;

    /** Broadcast the RequestVoteRPC to our replica cluster.
    /** @type {Types.RequestVoteRPC} - Broadcast the VoteRequestRPC using the broadcast channel */
    const requestVoteRPC_Broadcasted = {
      src: this.replica.id,
      dst: BROADCAST,
      leader: this.replica.votedFor,
      type: 'RequestVoteRPC',
      MID: getRandomMID(),
    };
    this.replica.send(requestVoteRPC_Broadcasted);
  }

  /** [Raft] Upon receiving a message the Candidate replica will see if it has enough votes to transition to the Leader state.
   *
   * @method messageHandler
   * @param {Buffer} buffer - The message this replica's received. */
  messageHandler(buffer) {
    clearTimeout(this.timeoutId);

    const jsonString = buffer.toString('utf-8'); // Convert buffer to string
    /** @type { Types.Redirect | Types.AppendEntryResponse | Types.RequestVoteRPC | Types.AppendEntryRPC } */
    const message = JSON.parse(jsonString); // Parse from JSON to JS object
    /** @type { Types.Redirect | Types.RequestVoteReponse } - The response we'll send. The type of message received dicates the type of the response we send. */
    let response;
    /** @type {number} - Number of replicas needed to reach consensus. */
    const quorum = Math.floor(this.replica.others.length / 2) + 1;

    switch (message.type) {
      case 'AppendEntriesRPC':
        break;

      case 'RequestVoteRPC':
        break;

      case 'VoteResponse':
        this.voteTally += message.voteGranted ? 1 : 0;

        if (this.voteTally >= quorum) {
          clearTimeout(this.timeoutId);
          this.replica.socket.removeListener('message', this.messageHandler);
          this.replica.changeState(new LeaderState(this.replica));
        }
        break;

      default:
        /** @type {Types.Redirect} - The response is a redirect message. */
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
  }
}

module.exports = {
  CandidateState,
};
