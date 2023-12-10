// Disabled rule for JSDoc typing purposes.
// eslint-disable-next-line no-unused-vars
const Types = require('../Types');
const { HEARTBEAT_INTERVAL } = require('../Utilities');
const BaseRaftState = require('./BaseRaftState');

/** [Raft] Leader state class.
 * @class
 * @extends BaseRaftState
 */
class Leader extends BaseRaftState {
  constructor(replica) {
    super(replica);
    /** @type {Object<string, number>} - [Raft] for each server, index of the next log entry to send to that server (initialized to leader last log index + 1) */
    this.nextIndex = {};
    this.replica.others.forEach((id) => {
      this.nextIndex[id] = this.replica.log.length;
    });
    /** @type {Object<string, number>} - [Raft] for each server, index of the last log entry to send to that server (initialized when we send) */
    this.lastIndex = {};
    /** @type {Object<string, number>} - [Raft] for each server, index of highest log entry known to be replicated on server (initialized to 0, increases monotonically) */
    this.matchIndex = {};
    this.replica.others.forEach((id) => {
      this.matchIndex[id] = 0;
    });
  }

  /** [Raft] Upon election: send initial empty AppendEntries RPCs (heartbeat) to each server. Set up the timeout to send heartbeats to prevent election timeouts.
   * @method run */
  run() {
    console.log(`[Leader ${this.replica.id}] ... is now Leader and ready to lead.`);

    this.setupTimeout(this.timeoutHandler, 0); // Send the initial heartbeat.
    this.replica.socket.on('message', this.messageHandler); // Set up the message handler.
  }

  /** [Raft] The leader should send out heartbeats to prevent election timeouts.
   * @method timeoutHandler
   */
  timeoutHandler() {
    console.log(`[Leader ${this.replica.id}] ... heartbeatTimeout.`);

    // [Raft] If there exists an N such that N > commitIndex, a majority of matchIndex[i] ≥ N, and log[N].term == currentTerm: set commitIndex = N (§5.3, §5.4).
    // Iterate through the log entries starting from commitIndex + 1
    for (let N = this.replica.commitIndex + 1; N < this.replica.log.length; N++) {
      // Count the number of matchIndex values greater than or equal to N
      const matchingNodes = Object.entries(this.matchIndex).filter(([followerId, matchIndex]) => {
        console.log(`For follower ${followerId}, its matchIndex is ${matchIndex}`);
        return matchIndex >= N;
      }).length;
      console.log(
        `... for commitIndex value N: ${N}, the number of matching nodes is ${matchingNodes}.`
      );
      // Check if a majority of matchIndex values are greater than or equal to N, and log[N].term == currentTerm
      if (
        matchingNodes > this.replica.others.length / 2 &&
        this.replica.log[N].term === this.replica.currentTerm
      ) {
        console.log(`... succesfully updating commitIndex to N.`);
        // set commitIndex to N (§5.3, §5.4).
        this.replica.commitIndex = N;

        // [Raft] If commitIndex > lastApplied: increment lastApplied, apply log[lastApplied] to state machine (§5.3).
        // send OKs.
        while (this.replica.commitIndex > this.replica.lastApplied) {
          this.replica.lastApplied += 1;
          /** @type {Types.Entry} */
          const entry = this.replica.log[this.replica.lastApplied];
          this.replica.stateMachine[entry.key] = entry.value;

          console.log(`Sending ok for log entry ${this.replica.lastApplied}`);

          /** @type {Types.OK} - We've successfully applied it to our stateMachine.*/
          let ok = {
            src: this.replica.id,
            dst: entry.src,
            leader: this.replica.id,
            type: 'ok',

            MID: entry.MID,
          };
          this.replica.send(ok);
        }
      }
    }

    this.replica.others.forEach((id) => {
      // this.lastIndex[id] = this.replica.log.length - 1; // lastIndex we send is our recentmost log index we've sent. We do - 1 bc the log is 1 indexed

      /** @type {Types.AppendEntryRPC} */
      const appendEntryRPC = {
        src: this.replica.id,
        dst: id,
        leader: this.replica.id,
        type: 'AppendEntryRPC',

        term: this.replica.currentTerm,
        leaderId: this.replica.id,
        prevLogIndex: this.nextIndex[id] - 1,
        prevLogTerm: this.replica.log[this.nextIndex[id] - 1].term,
        entries: this.replica.log.slice(this.nextIndex[id], this.nextIndex[id] + 1), // we do +1 because slice's end arg is exclusive
        leaderCommit: this.replica.commitIndex,
      };
      this.replica.send(appendEntryRPC);
    });

    this.setupTimeout(this.timeoutHandler, HEARTBEAT_INTERVAL);
  }

  /**
   * @method messageHandler
   * @param {Buffer} buffer - The message this replica's received. */
  messageHandler(buffer) {
    const jsonString = buffer.toString('utf-8'); // Convert buffer to string
    /** @type { Types.Redirect | Types.AppendEntryResponse | Types.Fail | Types.AppendEntryRPC | Types.Put | Types.Get } */
    const message = JSON.parse(jsonString); // Parse from JSON to JS object
    /** @type { Types.OK | Types.Fail } - The response we'll send. The type of message received dicates the type of the response we send. */
    let response;
    /** @type {number} */

    switch (message.type) {
      case 'AppendEntryRPC':
        // [Raft] If RPC request or response contains term T > currentTerm, set currentTerm = T, change to follower state.
        if (message.term > this.replica.currentTerm) {
          this.replica.currentTerm = message.term;
          this.replica.votedFor = message.src;
          console.log(
            `[Leader ${this.replica.id}] ... is updating its term to ${this.replica.currentTerm} due to a higher-term AppendEntriesRPC. and updating its votedFor to ${this.replica.votedFor}.`
          );
          console.log(`[Leader ${this.replica.id}] ... is changing into a Follower.`);
          this.changeState('Follower');
        }
        break;

      case 'RequestVoteRPC':
        // [Raft] If RPC request or response contains term T > currentTerm, set currentTerm = T, change to follower state.
        if (message.term > this.replica.currentTerm) {
          this.replica.currentTerm = message.term;
          this.replica.votedFor = message.src;
          console.log(
            `[Leader ${this.replica.id}] ... is updating its term to ${this.replica.currentTerm} due to a higher-term RequestVoteRPC. and updating its votedFor to ${this.replica.votedFor}.`
          );
          console.log(`[Leader ${this.replica.id}] ... is changing into a Follower.`);
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

      case 'AppendEntryResponse': {
        // [Raft] If RPC request or response contains term T > currentTerm, set currentTerm = T
        // [Raft] If AppendEntryResponse received from newer follower: convert to follower
        if (message.term > this.replica.currentTerm) {
          this.replica.currentTerm = message.term;
          this.replica.votedFor = message.src;
          console.log(
            `[Leader ${this.replica.id}] ... is updating its term upon a higher-term AppendEntryResponse. and updating its votedFor.`
          );
          this.changeState('Follower');
          console.log(`[Leader ${this.replica.id}] ... is changing into a Follower.`);
        }

        // [Raft] If successful: update nextIndex and matchIndex for follower (§5.3).
        if (message.success) {
          // this.nextIndex[message.src] = this.lastIndex[message.src] + 1;
          this.nextIndex[message.src] += 1;

          // this.matchIndex[message.src] = this.lastIndex[message.src]; // we know we sent up to this index b/c the message was successful.
          this.matchIndex[message.src] = this.nextIndex[message.src] - 1;
        }

        // [Raft] If AppendEntries fails because of log inconsistency: decrement nextIndex and retry (§5.3).
        if (!message.success) {
          this.nextIndex[message.src] -= 1;
        }

        break;
      }

      case 'put':
        this.replica.log.push({
          src: message.src,
          dst: message.dst,
          leader: this.replica.id,
          type: 'put',

          MID: message.MID,
          key: message.key,
          value: message.value,

          term: this.replica.currentTerm,
        });

        break;

      case 'get':
        /** @type {Types.OK} */
        response = {
          src: this.replica.id,
          dst: message.src,
          leader: this.replica.id,
          type: 'ok',

          MID: message.MID,
          value: this.replica.stateMachine[message.key] || '',
        };

        this.replica.send(response);
        break;

      case 'hello':
        break;

      case 'ok':
        break;

      default:
        console.error(`[Leader ${this.replica.id}] ... received an unrecognized message type.`);
        break;
    }
  }
}

module.exports = {
  Leader,
};

//
