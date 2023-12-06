// Disabled rule for JSDoc typing purposes.
// eslint-disable-next-line no-unused-vars
const Types = require('../Types');
const { BROADCAST } = require('../Utilities');
const BaseRaftState = require('./BaseRaftState');

/** [Raft] Leader state class.
 *
 * - Upon election: send initial empty AppendEntries RPCs (heartbeat) to each server; repeat during idle periods to prevent election timeouts (§5.2).
 * - If command received from client: append entry to local log, respond after entry applied to state machine (§5.3).
 * @class
 * @extends BaseRaftState
 */
class Leader extends BaseRaftState {
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
      // LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING
      console.log(`[Leader] ... is now Leader of the cluster.`);
      // LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING

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
      this.setupTimeout(this.timeoutHandler, 200); // Set up the timeout for the next heartheat.
      this.replica.socket.on('message', this.messageHandler); // Set up the message handler.
   }

   /** [Raft] The leader should send out heartbeats to prevent election timeouts.
    * @method timeoutHandler
    */
   timeoutHandler() {
      console.log(`[Leader] ... heartbeatTimeout.`);

      /** @type {Types.AppendEntryRPC} - The heartbeat we will send. */
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

      this.setupTimeout(this.timeoutHandler, 75);
   }

   /** [Raft] Upon receiving a message the Leader will...
    *
    * @method messageHandler
    * @param {Buffer} buffer - The message this replica's received. */
   messageHandler(buffer) {
      const jsonString = buffer.toString('utf-8'); // Convert buffer to string
      /** @type { Types.Redirect | Types.AppendEntryResponse | Types.Fail | Types.AppendEntryRPC | Types.Put | Types.Get } */
      const message = JSON.parse(jsonString); // Parse from JSON to JS object
      /** @type { Types.OK | Types.Fail } - The response we'll send. The type of message received dicates the type of the response we send. */
      let response;
      /** @type {number} */
      // const quorum = Math.floor(this.replica.others.length / 2) + 1;

      switch (message.type) {
         case 'AppendEntriesRPC':
            // [TODO] case where there is another leader somehow... maybe from a network partition, slow network? anywho, will have to look into how to decide which log from the leaders are valid, decide leader of new cluster, and more stuff im sure.
            response = {};
            break;

         case 'RequestVoteRPC':
            // [TODO] case where there is a candidate somehow... maybe from a network partition, slow network? anywho, will have to look into what to do.
            response = {};
            break;

         case 'AppendEntryResponse':
            response = {};
            break;

         case 'put':
            // [TODO] make sure the do the quorum thing before PUTting into statemachine

            this.replica.stateMachine[message.key] = message.value; // PUT into out state machine

            /** @type {Types.OK} - We've successfully applied it to our stateMachine.*/
            response = {
               src: this.replica.id,
               dst: message.src,
               leader: this.replica.id,
               type: 'ok',

               MID: message.MID,
            };

            this.replica.send(response);

            break;

         case 'get':
            /** @type {Types.OK} - We've successfully applied it to our stateMachine.*/
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
            console.error(`[Leader] ... received an unrecognized message type.`);
            break;
      }
   }
}

module.exports = {
   Leader,
};

//
