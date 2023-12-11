const BaseRaftState = require('./BaseRaftState');
const { getRandomDuration } = require('../Utilities');
// Disabled rule for JSDoc typing purposes.
// eslint-disable-next-line no-unused-vars
const Types = require('../Types');

/** Follower state class.
 * @class
 * @extends BaseRaftState
 */
class Follower extends BaseRaftState {
  constructor(replica) {
    super(replica);

    /** @property {string} - [Raft] so follower can redirect clients. */
    this.leader = 'FFFF';
  }

  /** The Follower should have an 'election timout' that gets called every 150-300ms (the specific duration is randomized every cycle). The election timeout resets on every message received. The follower should appropiately respond to RPCs and redirect client requests.
   * @method run */
  run() {
    console.log(`[Follower ${this.replica.id}] ... is a new Follower and ready to follow.`);

    this.setupTimeout(this.timeoutHandler, getRandomDuration());
    this.replica.socket.on('message', this.messageHandler);
  }

  /** [Raft] In the Follower state you should transition the replica to the candidate state. In this state, the 'timeout' is the election timeout. The replica will now transition to the Candidate state and will proceed in accordance with Raft.
   * @method timeoutHandler */
  timeoutHandler() {
    console.log(`[Follower ${this.replica.id}] ... is changing into a Candidate.`);
    this.changeState('Candidate');
  }

  /**
   * @method messageHandler
   * @param {Buffer} buffer - The message this replica's received. */
  messageHandler(buffer) {
    const jsonString = buffer.toString('utf-8'); /*  Convert buffer to string  */
    /** @type { Types.Redirect | Types.AppendEntryResponse | Types.RequestVoteRPC | Types.AppendEntryRPC } - The message we've received. */
    const message = JSON.parse(jsonString); // Parse from JSON to JS object
    /** @type { Types.Redirect | Types.RequestVoteResponse | Types.AppendEntryResponse } - The response we'll send. The type of Message received dicates the type of the response we send. */
    let response;

    switch (message.type) {
      case 'AppendEntryRPC':
        // [Raft] If RPC request or response contains term T > currentTerm, set currentTerm = T ... Why does this make sense? because when a follower gets a heartbeat from a leader that is... in a new term??? this can happen in network partitions (or perhaps unreliable networks where heartbeats get lost) where this follower was not in the quorum group. tough stuff, this.replic.id. When this happens, you can go ahead and update your term. So what about the old leader? Well, the new leader can only be elected if it gets a majority of votes which happens when it's up to date with a majority of replicas. and up to date means prevLogIndex and prevLogTerm so we're comparing only the most RECENT entries during election. and therefore a new leader can only be elected when its has all the entries of at least a quorum of replicas. Meaning, the new leader has all the entries that we need to maintain consistency.
        // What happens to the additional logs if there was a network partition/crash such that we have the old logs of the old leader that were NOT commited? Well that means we're gonna have to delete it and send the fail response. If we don't want to duplicate fail messages for the same put request, we can make it that the leader that switches to follower can send the failure responses. for now thoough, let's just make it that all followers can send back fails upon splicing for time's sake.
        if (message.term > this.replica.currentTerm) {
          this.replica.currentTerm = message.term;
          this.replica.votedFor = message.src;
          console.log(
            `[Follower ${this.replica.id}] ... is updating its term to ${this.replica.currentTerm} due to a higher-term AppendEntryRPC. and updating its votedFor to ${this.replica.votedFor}.`
          );
          this.setupTimeout(this.timeoutHandler, getRandomDuration());
          break;
        }

        /** @type {Types.AppendEntryResponse} */
        response = {
          src: this.replica.id,
          dst: message.src,
          leader: this.leader,
          type: 'AppendEntryResponse',

          term: this.replica.currentTerm,
          success: false,
        };

        // [Raft] This is the CONSISTENCY check to if the leader is valid.

        // [Raft] 1. Reply false if term < currentTerm (§5.1). For the cases where it was from a partitioned leader and the OLD leader is trying to send a heartbeat
        if (message.term < this.replica.currentTerm) {
          response.success = false;
          this.replica.send(response);
          // we do not reset the timer because old RPCs or responses are never accepted. The leader that sent this message will see that we are higher term and update themselves. In this case if we do not get an AppendEntryRPC again from another leader, possibly the correct one (we check in the next step)... we'll just execute the election timer if we don't get one from a new leader bc maybe we are the valid leader !!
          break;
        }

        // [Raft] 2. Reply false if log doesn’t contain an entry at prevLogIndex whose term matches prevLogTerm (§5.3) ...
        // If we don't have that log we'll send it back a failure so the leader can send back the index prior and maybe we will have an entry starting there.
        if (this.replica.log[message.prevLogIndex] === undefined) {
          response.success = false;
          this.replica.send(response);
          this.setupTimeout(this.timeoutHandler, getRandomDuration());
          break;
        } 
        
        // If we finally find an index where we both have entries, but if the terms are different then go back once more
        if (this.replica.log[message.prevLogIndex].term !== message.prevLogTerm) {
          response.success = false;
          this.replica.send(response);
          this.setupTimeout(this.timeoutHandler, getRandomDuration()); // Remember it's okay to reset the timer here because  our safety checks during leader election mean the leader, a NEW leader as we just verifie
          break;
        }

        // [Raft] We confirm the message the be successful from a proper Leader.
        response.success = true;

        // [Raft] 3. If an existing entry conflicts with a new one (same index but different terms), delete the existing entry and all that follow it (§5.3)
        for (let i = 0; i < message.entries.length; i++) {
          const logIndex = message.prevLogIndex + 1 + i; // we do + 1 because we are appending onto the next available index
          const existingEntry = this.replica.log[logIndex];
          const newEntry = message.entries[i];
          if (!existingEntry || existingEntry.term !== newEntry.term) {
            // If it is not existing (undefined) then we do not have an entry at that index.
            this.replica.log.splice(logIndex);
            // [TODO] We have to

            // [Raft] 4. Append any new entries not already in the log
            this.replica.log.push(...message.entries.slice(i));
            break;
          }
        }

        // [Raft] 5. If leaderCommit > commitIndex, set commitIndex = min(leaderCommit, index of last new entry).
        if (message.leaderCommit > this.replica.commitIndex) {
          this.replica.commitIndex = Math.min(
            message.leaderCommit,
            message.prevLogIndex + message.entries.length
          );
        }

        // Send back a success response the entries was not empty (ie not just a heartbeat to keep alive).
        if (message.entries.length > 0) {
          this.replica.send(response);
        }

        // update leader property to redirect clients.
        this.leader = message.leader;
        this.setupTimeout(this.timeoutHandler, getRandomDuration());

        // [Raft] If commitIndex > lastApplied: increment lastApplied, apply log[lastApplied] to state machine (§5.3). Make sure our stateMachine is updated before responding!
        while (this.replica.commitIndex > this.replica.lastApplied) {
          this.replica.lastApplied += 1;
          /** @type {Types.Entry} */
          const entry = this.replica.log[this.replica.lastApplied];
          this.replica.stateMachine[entry.key] = entry.value;
        }

        break;

      case 'RequestVoteRPC':
        // [Raft] If RPC request or response contains term T > currentTerm, set currentTerm = T
        if (message.term > this.replica.currentTerm) {
          this.replica.currentTerm = message.term;
          this.replica.votedFor = message.src;
          `[Follower ${this.replica.id}] ... is updating its term to ${this.replica.currentTerm} due to a higher-term AppendEntryRPC. and updating its votedFor to ${this.replica.votedFor}.`;
        }

        /** @type {Types.RequestVoteResponse} */
        response = {
          src: this.replica.id,
          dst: message.src,
          leader: this.leader,
          type: 'RequestVoteResponse',

          term: this.replica.currentTerm,
          voteGranted: false,
        };

        // [Raft] 1. Reply false if term < currentTerm (§5.1).
        if (message.term < this.replica.currentTerm) {
          response.voteGranted = false;
          this.replica.send(response);
          break;
        }

        // [Raft] 2. If votedFor is null or candidateId, and candidate’s log is at least as up-to-date as receiver’s log, grant vote (§5.2, §5.4)
        if (this.replica.votedFor === null || this.replica.votedFor === message.candidateID) {
          const lastIndex = this.replica.log.length - 1;

          // [Raft] If we have a more recent term in our recentmost entry then we deny the vote. We have a more recent log.
          if (message.lastLogTerm < this.replica.log[lastIndex].term) {
            response.voteGranted = false;
            this.replica.send(response);

            break;
          }

          // [Raft] If the logs end with the same term, then whichever log is longer is more up-to-date
          if (message.lastLogTerm === this.replica.log[lastIndex].term) {
            if (message.lastLogIndex < lastIndex) {
              response.voteGranted = false;
              this.replica.send(response);

              break;
            }
          }
          response.voteGranted = true;
          this.replica.send(response);
          this.setupTimeout(this.timeoutHandler, getRandomDuration());
        }

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
        console.error(`[Follower ${this.replica.id}] ... received an unrecognized message type.`);
    }
  }
}

module.exports = {
  Follower,
};
