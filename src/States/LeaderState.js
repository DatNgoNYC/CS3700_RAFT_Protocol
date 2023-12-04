const { BROADCAST } = require('../Replica');
// Disabled rule for JSDoc typing purposes.
// eslint-disable-next-line no-unused-vars
const Types = require('../Types');
const BaseRaftState = require('./BaseRaftState');

/** [Raft] Leader state class.
 *
 * - Upon election: send initial empty AppendEntries RPCs (heartbeat) to each server; repeat during idle periods to prevent election timeouts (§5.2).
 * - If command received from client: append entry to local log, respond after entry applied to state machine (§5.3).
 * @class
 * @extends BaseRaftState
 */
class LeaderState extends BaseRaftState {
  /**
   * Creates an instance of FollowerState.
   * @param {Replica} replica - The Replica instance.
   */
  constructor(replica) {
    super(replica);
  }

  /** [Raft] Upon election: send initial empty AppendEntries RPCs (heartbeat) to each server. Set up the timeout to send heartbeats to prevent election timeouts.
   * @method run */
  run() {
    /** @type {Types.AppendEntryRPC} */
    const initialHeartbeat = {
      src: this.replica.id,
      dst: BROADCAST,
      leader: this.replica.id,
      type: 'AppendEntryRPC',

      term: this.replica.currentTerm,
      leaderId: this.replica.id,
      prevLogIndex: this.replica.log.length,
      entries: [],
      leaderCommit: this.replica.commitIndex,
    };
    this.replica.send(initialHeartbeat);
    this.setupTimeout(this.timeoutHandler, 75);
    this.replica.socket.on('message', (buffer) => {
      const jsonString = buffer.toString('utf-8');  // Convert buffer to string 
      const message = JSON.parse(jsonString); // Parse from JSON to JS object

      this.messageHandler(message);
    });  
  }

  /** [Raft] The leader should send out heartbeats to prevent election timeouts.
   * @method timeoutHandler
   */
  timeoutHandler() {
    /** @type {Types.AppendEntryRPC} */
    const heartbeat = {
      src: this.replica.id,
      dst: BROADCAST,
      leader: this.replica.id,
      type: 'AppendEntryRPC',

      term: this.replica.currentTerm,
      leaderId: this.replica.id,
      prevLogIndex: this.replica.log.length,
      entries: [],
      leaderCommit: this.replica.commitIndex,
    };
    this.replica.send(heartbeat);
  }

  /** [Raft] Upon receiving a message the Leader will...
   *
   * @method messageHandler
   * @method messageHandler
   * @param {Buffer} buffer - The message this replica's received. */
  messageHandler(buffer) {
    clearTimeout(this.timeoutId);

    const jsonString = buffer.toString('utf-8');  // Convert buffer to string 
    /** @type { Types.Redirect | Types.AppendEntryResponse | Types.RequestVoteRPC | Types.AppendEntryRPC } */
    const message = JSON.parse(jsonString); // Parse from JSON to JS object
    /** @type { Types.Redirect | Types.RequestVoteReponse } - The response we'll send. The type of message received dicates the type of the response we send. */
    let response;
    /** @type {number} */
    // const quorum = Math.floor(this.replica.others.length / 2) + 1;
    
    switch (message.type) {
      case 'AppendEntriesRPC':
        // case where there is another leader somehow... maybe from a network partition, slow network? anywho, will have to look into how to decide which log from the leaders are valid, decide leader of new cluster, and more stuff im sure.
        break;

      case 'RequestVoteRPC':
        // case where there is a candidate somehow... maybe from a network partition, slow network? anywho, will have to look into what to do.
        break;

      case 'AppendEntryResponse':

        break;

      case 'get':
        break;

      case 'put':
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
  LeaderState,
};
