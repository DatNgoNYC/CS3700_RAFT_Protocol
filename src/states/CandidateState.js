const { getRandomDuration, BROADCAST } = require('../Utilities');
const BaseRaftState = require('./BaseRaftState');
// Disabled rule for JSDoc typing purposes.
// eslint-disable-next-line no-unused-vars
const Types = require('../Types');

/** [Raft] Candidate state class.
 *
 * A replica in the Candidate state will try up to take the Leader role by sending out VoteRequest RPCS. It will continue to do so unless there is an AppendEntry RPC from a leader with an overriding term. slay.
 * @class
 * @extends BaseRaftState
 */
class Candidate extends BaseRaftState {
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
   async run() {
      // LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING
      console.log(`[Candidate] ... is running for election.`);
      // LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING

      this.replica.currentTerm += 1; // Increment the currentTerm before starting operations.
      this.replica.votedFor = this.replica.id; // Vote for self.
      this.voteTally = 1; // Increase the vote tally after voting for self.

      /** @type {Types.RequestVoteRPC} - Our VoteRequestRPC to our replica cluster. */
      const requestVoteRPC_Broadcasted = {
         src: this.replica.id,
         dst: BROADCAST,
         leader: 'FFFF',
         type: 'RequestVoteRPC',

         term: this.replica.currentTerm,
         candidateID: this.replica.id,
         lastLogIndex: this.replica.log.length,
         lastLogTerm: this.replica.log[this.replica.lastApplied.length]
            ? this.replica.log[this.replica.lastApplied.length].term
            : 0,
      };
      this.replica.send(requestVoteRPC_Broadcasted); // Broadcast the VoteRequestRPC to our replica cluster.

      this.setupTimeout(this.timeoutHandler, getRandomDuration());
      this.replica.socket.on('message', this.messageHandler);
   }

   /** [Raft] The candidate should rerun the election on timeout.
    * @method timeoutHandler   */
   timeoutHandler() {
      // LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING
      console.log(`[Candidate] ... is re-running for election.`);
      // LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING

      this.replica.votedFor = this.replica.id;
      this.voteTally = 1;

      /** @type {Types.RequestVoteRPC} - Our VoteRequestRPC to our replica cluster. */
      const requestVoteRPC_Broadcasted = {
         src: this.replica.id,
         dst: BROADCAST,
         leader: 'FFFF',
         type: 'RequestVoteRPC',

         term: this.replica.currentTerm,
         candidateID: this.replica.id,
         lastLogIndex: this.replica.log.length,
         lastLogTerm: this.replica.log[this.replica.log.length]
            ? this.replica.log[this.replica.lastApplied.length].term
            : 1,
      };
      this.replica.send(requestVoteRPC_Broadcasted); // Broadcast the VoteRequestRPC to our replica cluster.

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

      /** @type {number} - Number of replicas needed to reach consensus. */
      const quorum = Math.floor(this.replica.others.length / 2) + 1;

      switch (message.type) {
         case 'AppendEntryRPC':
            // Decide whether to switch to Follower or stay candidate
            if (message.term >= this.replica.currentTerm) {
               console.error(
                  `[Candidate] ... message.term: ${message.term}, currentTernL ${
                     this.replica.currentTerm
                  }. message.term >= this.replica.currentTerm : ${
                     message.term >= this.replica.currentTerm
                  } `
               );
               // If we get an AppendEntryRPC from a leader with a higher term...
               this.changeState('Follower');
            }
            break;

         case 'RequestVoteRPC':
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

         case 'RequestVoteResponse':
            this.voteTally += message.voteGranted ? 1 : 0;

            if (this.voteTally >= quorum) {
               this.changeState('Leader');
            }
            break;

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
