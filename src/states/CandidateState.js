const BaseRaftState = require('./BaseRaftState');
const { getRandomDuration, BROADCAST } = require('../Utilities');
// Disabled rule for JSDoc typing purposes.
// eslint-disable-next-line no-unused-vars
const Types = require('../Types');

/** [Raft] Candidate state class.
 * @class
 * @extends BaseRaftState
 */
class Candidate extends BaseRaftState {
  constructor(replica) {
    super(replica);

    /** @property {int} voteTally - [Raft] The current vote tally for the candidate. */
    this.voteTally = 0;
  }

  /** On conversion to candidacy, we start the election. We rerun the election if we did not receive a majority of the votes and our election timeout executes.
   * @method run */
  async run() {
    console.log(
      `[Candidate ${this.replica.id}] ... is a new Candidate and ready to run for election.`
    );

    this.setupTimeout(this.timeoutHandler, 0);
    this.replica.socket.on('message', this.messageHandler);
  }

  /** [Raft] The candidate should rerun the election on timeout.
   * @method timeoutHandler   */
  timeoutHandler() {
    console.log(`[Candidate ${this.replica.id}] ... is running for election.`);

    this.replica.currentTerm += 1; // [Raft] Increment currentTerm.
    this.replica.votedFor = this.replica.id; // [Raft] Vote for self.
    this.voteTally = 1;

    /** @type {Types.RequestVoteRPC} - Our VoteRequestRPC to our replica cluster. */
    const requestVoteRPC = {
      src: this.replica.id,
      dst: BROADCAST,
      leader: 'FFFF',
      type: 'RequestVoteRPC',

      term: this.replica.currentTerm,
      candidateID: this.replica.id,
      lastLogIndex: this.replica.log.length - 1,
      lastLogTerm: this.replica.log[this.replica.log.length - 1].term,
    };
    this.replica.send(requestVoteRPC); // Broadcast the VoteRequestRPC to our replica cluster.

    this.setupTimeout(this.timeoutHandler, getRandomDuration()); // set up the next timeout (the election rerunning).
  }

  /** [Raft] Upon receiving a message the Candidate replica will see if it has enough votes to transition to the Leader state.
   *
   * @method messageHandler
   * @param {Buffer} buffer - The message this replica's received. */
  messageHandler(buffer) {
    const jsonString = buffer.toString('utf-8'); // Convert buffer to string
    /** @type { Types.Redirect | Types.AppendEntryResponse | Types.RequestVoteRPC | Types.AppendEntryRPC } */
    const message = JSON.parse(jsonString); // Parse from JSON to JS object
    /** @type { Types.Redirect | Types.RequestVoteReponse } - The response we'll send. The type of message received dicates the type of the response we send. */
    let response;

    switch (message.type) {
      case 'AppendEntryRPC': {
        // [Raft] If RPC request or response contains term T > currentTerm, set currentTerm = T, convert to follower
        // [Raft] If AppendEntries RPC received from new leader: convert to follower
        if (message.term >= this.replica.currentTerm) {
          this.replica.currentTerm = message.term;
          this.replica.votedFor = message.src;
          console.log(
            `[Candidate ${this.replica.id}] ... is updating its term upon a higher-term AppendEntryRPC. and updating its votedFor to ${this.replica.votedFor}.`
          );
          console.log(`[Candidate ${this.replica.id}] ... is changing into a Follower.`);
          this.changeState('Follower');
        } else {
          // [Raft] We send back a false response so the old leader can update itself.
          /** @type {Types.AppendEntryResponse} */
          response = {
            src: this.replica.id,
            dst: message.src,
            leader: 'FFFF',
            type: 'AppendEntryResponse',

            term: this.replica.currentTerm,
            success: false,
          };

          this.replica.send(response);
        }

        break;
      }
      case 'RequestVoteRPC': {
        // [Raft] If RPC request or response contains term T > currentTerm, set currentTerm = T, change to follower state.
        if (message.term > this.replica.currentTerm) {
          this.replica.currentTerm = message.term;
          this.replica.votedFor = message.src;
          console.log(
            `[Candidate ${this.replica.id}] ... is updating its term to ${this.replica.currentTerm} due to a higher-term RequestVoteRPC. and updating its votedFor to ${this.replica.votedFor}.`
          );
          console.log(`[Candidate ${this.replica.id}] ... is changing into a Follower.`);
          this.changeState('Follower');
        }

        /** @type {Types.RequestVoteResponse} - We send back a RequestVoteResponse response of NO. */
        response = {
          src: this.replica.id,
          dst: message.src,
          leader: 'FFFF',
          type: 'RequestVoteResponse',

          term: this.replica.currentTerm,
          voteGranted: false,
        };

        this.replica.send(response);
        break;
      }

      case 'RequestVoteResponse': {
        // [Raft] If RPC request or response contains term T > currentTerm, set currentTerm = T, change to follower state.
        if (message.term > this.replica.currentTerm) {
          this.replica.currentTerm = message.term;
          this.replica.votedFor = message.src;
          console.log(
            `[Candidate ${this.replica.id}] ... is updating its term to ${this.replica.currentTerm} due to a higher-term RequestVoteRPC. and updating its votedFor to ${this.replica.votedFor}.`
          );
          console.log(`[Candidate ${this.replica.id}] ... is changing into a Follower.`);
          this.changeState('Follower');
        }

        /** @type {number} - Number of replicas needed to reach consensus. */
        const quorum = Math.floor(this.replica.others.length / 2) + 1;
        this.voteTally += message.voteGranted ? 1 : 0;

        if (this.voteTally >= quorum) {
          console.log(`[Candidate ${this.replica.id}] ... is changing into a Leader.`);
          this.changeState('Leader');
        }
        break;
      }

      case 'hello':
        break;

      case 'put':
        /** @type {Types.Redirect} */
        response = {
          src: this.replica.id,
          dst: message.src,
          leader: 'FFFF',
          type: 'redirect',

          MID: message.MID,
        };
        this.replica.send(response);
        break;

      case 'get':
        /** @type {Types.Redirect} */
        response = {
          src: this.replica.id,
          dst: message.src,
          leader: 'FFFF',
          type: 'redirect',

          MID: message.MID,
        };
        this.replica.send(response);
        break;

      default:
        console.error(`[Candidate] ... received an unrecognized message type.`);
    }
  }
}

module.exports = {
  Candidate,
};
