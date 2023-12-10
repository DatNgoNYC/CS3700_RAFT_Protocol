/**
 * The Replica class represents a replica in our key-value data store.
 *
 * We are using the state design pattern and so we designate the Replica to act as the "context" as well and allows our state implementations to execute based on the current "context"/"state" of the replica.
 * @typedef {Object} Replica
 * @property {number} port - This replica's port number on the localhost that you should send UDP packets to in order to communicate with your replicas.
 * @property {string} id - This replica's id to identify itself in messages.
 * @property {string[]} others - The other replicas in the replica cluster.
 * @property {Socket} socket - This replica's socket it will use to send messages.
 * @property {BaseRaftState} state - This replica's current state.
 * @property {number} currentTerm - This replica's current term.
 * @property {string} votedFor - The candidate that received this replica's vote this current term.
 * @property {Types.Entry[]} log - This replica's log of entries (puts).
 * @property {number} commitIndex - index of the highest log entry known to be committed (initialized to 0, increases monotonically).
 * @property {number} lastApplied - index of the highest log entry applied to the state machine (initialized to 0, increases monotonically).
 * @property {Object.<string, string>} stateMachine - The state machine representing key-value pairs.
 * @property {function} run - Get the replica up and running, using the current state's logic.
 * @property {function} changeState - Change the state of the replica to the given state and then run the replica with the state's logic.
 * @property {function} send - Send a message to the simulator in the required JSON format.
 * @property {function} [constructor] - Creates an instance of Replica.
 */

/**
 * An entry contains a command for state machine, and the term when entry was received by leader.
 * @typedef {Put & { term: number }} Entry
 */

/**
 * General message properties all messages must have for the simulator to be able to process it and send it to the "client" or another "replica" in the replica cluster. :) slay slay slay!
 * @typedef {Object} Message
 * @property {string} src - Source of the message.
 * @property {string} dst - Destination of the message.
 * @property {string} leader - The ID of the leader, or 'FFFF' if the leader's ID is unknown.
 * @property {string} type - The type of the message.
 */

/**
 * Get request from the client.
 *  - {get} type - The message is a 'get' type.
 *  - {string} MID - The message ID.
 *  - {string} key - The key of the value to get.
 * @typedef {Message & { type: 'get' , MID: string, key: string }} Get
 */

/**
 * Put request from the client.
 *  - {put} type - The message is a 'put' type.
 *  - {string} MID - The message ID.
 *  - {string} key - The key of the value to store.
 *  - {string} value - The value to store.
 * @typedef {Message & { type: 'put' , MID: string, key: string, value: string }} Put
 */

/**
 * An OK message the leader replica can send with the key's value when the get request succeeds. Include the value if it is an OK message for a get request.
 * @typedef {Message & { type: 'ok', MID: string, value?: string }} OK
 */

/**
 * Or the leader replica may respond with a fail message, in which case the client should retry the get():
 * @typedef {Message & { type: 'fail', MID: string } } Fail
 */

/**
 * If the client sends any message (get() or put()) to a replica that is not the leader, it should respond with a redirect:
 * @typedef {Message & { type: 'redirect', MID: string } } Redirect
 */

/**
 * AppendEntry RPC message type from a Leader replica.
 *  - {number} term - leader's term.
 *  - {string} leaderId - so follower can redirect clients.
 *  - {number} prevLogIndex - index of log entry immediately preceding new ones.
 *  - {number} prevLogTerm - term of prevLogIndex entry.
 *  - {Entry[]} entries - log entries to store (empty for heartbeat; may send more than one for efficiency).
 *  - {number} leaderCommit - leader's commit index.
 * @typedef {Message & { type: 'AppendEntryRPC', term: number, leaderId: string, prevLogIndex: number, prevLogTerm: number, entries: Entry[], leaderCommit: number }} AppendEntryRPC
 */

/**
 * AppendEntryResponse message type from a follower replica after receiving an AppendEntryRPC.
 *  - {number} term - currentTerm, for leader to update itself,
 *  - {boolean} success - true if follower contained entry matching prevLogIndex and prevLogTerm.
 * @typedef {Message & { type: 'AppendEntryResponse', term: number, success: boolean }} AppendEntryResponse
 */

/**
 * RequestVote RPC message type from a Candidate replica.
 *  - {number} term - The candidate's term.
 *  - {string} candidateID - The candidate requesting this vote.
 *  - {number} lastLogIndex - index of candidate’s last log entry (§5.4 Raft paper).
 *  - {number} lastLogTerm - term of candidate’s last log entry (§5.4 Raft paper).
 * @typedef {Message & { type: 'RequestVoteRPC', term: number, candidateID: string, lastLogIndex: number, lastLogTerm: number }} RequestVoteRPC
 */

/**
 * The RequestVoteReponse message type from a replica to a candidate.
 *
 *  - {number} term - The src's currentTerm
 *  - {boolean} voteGranted - True means the candidate received the vote.
 * @typedef {Message & { type: 'RequestVoteReponse', term: number, voteGranted: boolean }} RequestVoteResponse
 */

module.exports = {};
