// disabled for JSDoc typing.
// eslint-disable-next-line no-unused-vars
const { createSocket, Socket } = require('dgram');
const { Follower } = require('./States/FollowerState');
// disabled for JSDoc typing.
// eslint-disable-next-line no-unused-vars
const Types = require('./Types');
const { getRandomMID, BROADCAST } = require('./Utilities');
const { Candidate } = require('./States/CandidateState');
const { Leader } = require('./States/LeaderState');

/**
 * The Replica object. (Also serves as context for our three states: Follower, Candidate, Leader).
 * @class
 */
class Replica {
   /**
    * Creates an instance of Replica.
    * @param {number} port - The port number to send messages to.
    * @param {string} id - The ID of the replica.
    * @param {string[]} others - An array of IDs of other replicas.
    */
   constructor(port, id, others) {
      /** @property {number} port - This replica's port number on the localhost that you should send UDP packets to in order to communicate with your replicas. */
      this.port = port;
      /** @property {string} id - This replica's id to identify itself in messages. */
      this.id = id;
      /** @property {string[]} others - The other replicas in the replica cluster. */
      this.others = others;
      /** @property {Socket} - This replica's socket it will use to send messages. */
      this.socket = createSocket('udp4');
      this.socket.bind(0, '0.0.0.0');
      this.socket.setMaxListeners(2);
      this.socket.on('message', (buffer) => {
         const jsonString = buffer.toString('utf-8'); // Convert buffer to string
         /** @type { Types.Redirect | Types.AppendEntryResponse | Types.Fail | Types.AppendEntryRPC } */
         const message = JSON.parse(jsonString); // Parse from JSON to JS object
         /** @type { Types.OK | Types.Fail } - The response we'll send. The type of message received dicates the type of the response we send. */

         // LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING
         console.log(
            `[${this.state.constructor.name}] ... is receiving a '${message.type}' message.  src:${message.src}, dst:${message.dst}, leader:${message.leader}, type:${message.type}. All properties: ${Object.keys(message).join(' | ')}`
         );
         // LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING
      });
      /** @property {BaseRaftState} - This replica's current state. */
      this.state = new Follower(this);

      /*  🚣‍♀️ [Raft] 🚣‍♀️ */
      /** PERSISTENT state on all servers:
       * (Updated on stable storage before responding to RPCs) */
      /** @property {number} term - This replica's current term. */
      this.currentTerm = 0;
      /** @property {string} - The candidate that received this replica's vote this current term. */
      this.votedFor = null;
      /** @property {Types.Entry[]} log - This replica's log of entries (puts) */
      this.log = [];
      /** VOLATILE state on all servers:  */
      /** @property {number} commitIndex - index of highest log entry known to be committed (initialized to 0, increases monotonically). */
      this.commitIndex = 0;
      /** @property {number} lastApplied - index of highest log entry applied to state machine (initialized to 0, increases monotonically). */
      this.lastApplied = 0;
      /** @property {Object.<string, string>} stateMachine - The state machine representing key-value pairs. */
      this.stateMachine = {};
   }

   /** Get the replica up and running, using the current state's logic.
    * @method run */
   run() {
      // Send a HELLO message once at startup.
      const hello = {
         src: this.id,
         dst: BROADCAST,
         leader: 'FFFF',
         type: 'hello',

         MID: getRandomMID(),
      };
      this.send(hello);

      this.state.run();

      // add the initial handlemessage here
   }

   /** Change the the state of the replica to the given state and then run the replica with the state's logic
    * @method changeState
    * @param {string} state - The new state of the replica. */
   changeState(state) {
      switch (state) {
         case 'Follower':
            this.state = new Follower(this);
            break;
         case 'Candidate':
            this.state = new Candidate(this);
            break;
         case 'Leader':
            this.state = new Leader(this);
            break;
         default:
            break;
      }
      this.state.run();
   }

   /** Send a message to the simulator in the required JSON format.
    * @method send
    * @param {Types.Message} message - The message to send. */
   send(message) {
      // LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING
      // if (message.type !== 'redirect') { // let's not log redirect messages
      console.log(`[${this.state.constructor.name}] ... is sending a '${message.type}' message.`);
      // }
      // LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING LOGGING

      const messageSerialized = JSON.stringify(message);
      this.socket.send(messageSerialized, Number(this.port), 'localhost');
   }
}

module.exports = {
   Replica,
};
