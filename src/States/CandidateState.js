const { getRandomDuration, getRandomMID } = require('../Utilities');
const BaseRaftState = require('./BaseRaftState');
// Disabled rule for JSDoc typing purposes.
// eslint-disable-next-line no-unused-vars
const Types = require('../Types');
const { BROADCAST } = require('../Replica');

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
   * @param {Types.VoteResponse} message - The message this replica's received. */
  messageHandler(message) {
    /** @type {number} - The minimum number of votes to needed to become leader. */
    const quorum = Math.floor(this.replica.others.length / 2) + 1;
    /** @type {Types.Message} - The response we'll send. The type of message received dicates the type of the response we send. */
    let response;

    switch (message.type) {
      case 'VoteResponse':
        this.voteTally += message.voteGranted ? 1 : 0;

        if (this.voteTally >= quorum) {
          this.replica.socket.removeListener('message', this.messageHandler);
          this.replica.changeState();
        }
        break;

      default:
        /** @type {Types.Redirect} */
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
