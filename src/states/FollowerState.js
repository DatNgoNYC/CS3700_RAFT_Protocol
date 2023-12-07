const BaseRaftState = require('./BaseRaftState');
const { getRandomDuration } = require('../Utilities');
// Disabled rule for JSDoc typing purposes.
// eslint-disable-next-line no-unused-vars
const Types = require('../Types');

/** [Raft] Follower state class.
 *
 * A replica in the Follower state will take the role of listening and logging and replicating under the coordination/lead of the Leader replica. Or responding to Candidates when necessary.
 * @class
 * @extends BaseRaftState
 */
class Follower extends BaseRaftState {
   /** Creates an instance of FollowerState.
    * @param {Replica} replica - The Replica instance.
    */
   constructor(replica) {
      super(replica);

      /** @property {string} - The cluster's leaderId for followers to redirect candidates. */
      this.leader = 'FFFF';
   }

   /** [Raft] The Follower should have an 'election timout' that gets called every 150-300ms (the specific duration is randomized every cycle). The election timeout resets on every message received. The follower should appropiately respond to RPCs and redirect client requests.
    * @method run */
   run() {
      console.log(`[Follower] ... is  a new Follower and ready to follow.`);

      this.setupTimeout(this.timeoutHandler, getRandomDuration());
      this.replica.socket.on('message', this.messageHandler);
   }

   /** [Raft] In the Follower state you should transition the replica to the candidate state. In this state, the 'timeout' is the election timeout. The replica will now transition to the Candidate state and will proceed in accordance with Raft.
    * @method timeoutHandler */
   timeoutHandler() {
      console.log(`[Follower] ... is changing into a candidate.`);
      this.changeState('Candidate');
   }

   /** [Raft] The replica can either get a message from the client or another replica. Reset the timer on each message. While in the Follower state...
    *
    * - If the message is a RequestVoteRPC...
    *    - If the candidate's term is less than this replica's current term, REJECT vote.
    *    - Else, if this replica has not voted yet or the replica has already voted for the candidate, then check to see if the candidate
    *
    * @method messageHandler
    * @param {Buffer} buffer - The message this replica's received. */
   messageHandler(buffer) {
      clearTimeout(this.timeoutId); // Reset the timeout.

      const jsonString = buffer.toString('utf-8'); /*  Convert buffer to string  */
      /** @type { Types.Redirect | Types.AppendEntryResponse | Types.RequestVoteRPC | Types.AppendEntryRPC } - The message we've received. */
      const message = JSON.parse(jsonString); // Parse from JSON to JS object
      /** @type { Types.Redirect | Types.RequestVoteResponse | Types.AppendEntryResponse } - The response we'll send. The type of Message received dicates the type of the response we send. */
      let response;

      switch (message.type) {
         case 'AppendEntryRPC':
            this.setupTimeout(this.timeoutHandler, getRandomDuration()); // set up the timeout again.

            if (message.entries.length === 0) {
               // Don't respond to heartbeats.
               break;
            }

            /** @type {Types.AppendEntryResponse} - We send back an AppendEntryResponse response. */
            response = {
               src: this.replica.id,
               dst: message.src,
               leader: this.leader,
               type: 'AppendEntryResponse',

               term: this.replica.currentTerm,
               success: false,
            };

            // [Raft] Logic for whether to grant vote or not.
            if (message.term < this.replica.currentTerm) {
               // If the leader's AppendEntryRPC is older...
               response.success = false;
            } else if (this.replica.log.length === 0) {
               // We will have to compare the leader's logs to ours to see whether to grant the vote or not.
               // But in this ifelse block, we'll skip that if it's the base case where this replica has no entries.
               response.success = true;
               this.leader = message.leader;
            } else if (message.prevLogIndex >= this.replica.log.length) {
               // The leader's prevLogIndex should be at least as long as this replica's log.
               if (this.replica.log[this.replica.log.length].term === message.prevLogTerm) {
                  // Grant the vote if the Leader's log is as new as this replica's.
                  response.success = true;
                  this.leader = message.leader;
               }
            }

            // [TODO] - we have to do this when we want to replicate.
            // [Raft]
            // 3. If an existing entry conflicts with a new one (same index
            //    but different terms), delete the existing entry and all that
            //    follow it (§5.3)
            // 4. Append any new entries not already in the log
            // 5. If leaderCommit > commitIndex, set commitIndex =
            //    min(leaderCommit, index of last new entry)

            this.replica.send(response);

            break;

         case 'RequestVoteRPC':
            this.setupTimeout(this.timeoutHandler, getRandomDuration()); // set up the timeout again.

            /** @type {Types.RequestVoteResponse} - We send back a RequestVoteResponse response. */
            response = {
               src: this.replica.id,
               dst: message.src,
               leader: this.leader,
               type: 'RequestVoteResponse',

               term: this.replica.currentTerm,
               voteGranted: false,
            };

            // [Raft] Decide whether to grant vote here...
            if (message.term <= this.replica.currentTerm) {
               // If it's in an older term, automatic no 🙅‍♀️. If it's a current term... it should be no too because a candidate should be +1 on candidacy.
               response.voteGranted = false;
            } else {
               // If votedFor is null or candidateId, and candidate’s log is at least as up-to-date as receiver’s log, grant vote (§5.2, §5.4)
               if (this.replica.votedFor === message.candidateID) {
                  response.voteGranted = true;
               } else if (this.replica.votedFor === null && this.replica.log.length === 0) {
                  // Base case
                  response.voteGranted = true; // Grant vote!.
                  this.replica.votedFor = message.candidateID; // We vote for YOU 🫵 message.candidateID
               } else if (
                  // If the logs are NOT empty ...
                  this.replica.votedFor === null && // This follower should not have voted yet this currentTerm.
                  message.lastLogIndex >= this.replica.log.length && // The candidate's log should be AT LEAST as long as this follower's.
                  message.lastLogTerm >= this.replica.log[this.replica.log.length].term // The candidate last log entry's term should be AT LEAST as recent as the follower's.
               ) {
                  response.voteGranted = true; // Grant vote!.
                  this.replica.votedFor = message.candidateID; // We vote for YOU 🫵 message.candidateID
               }
            }

            this.replica.send(response);
            break;

         case 'hello':
            this.setupTimeout(this.timeoutHandler, getRandomDuration()); // set up the timeout again.
            response = {};
            break;

         case 'put':
            /** @type {Types.Redirect} */
            response = {
               src: this.replica.id,
               dst: message.src,
               leader: this.leader,
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
               leader: this.leader,
               type: 'redirect',

               MID: message.MID,
            };
            this.replica.send(response);
            break;

         default:
            console.error(`[Follower] ... received an unrecognized message type.`);
      }
   }
}

module.exports = {
   Follower,
};
