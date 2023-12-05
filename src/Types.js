/*                                         [General] 
General types for our project. */

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
 * @typedef {Message { type: 'fail', MID: string } } Fail
 */

/**
 * If the client sends any message (get() or put()) to a replica that is not the leader, it should respond with a redirect:
 * @typedef {Message & { type: 'redirect', MID: string } } Redirect
 */



/*                                    🚣‍♀️🚣‍♀️🚣‍♀️🚣‍♀️ [Raft] 🚣‍♀️🚣‍♀️🚣‍♀️🚣‍♀️                             
The stuff below is related to our specific implementation of Raft. */

/**
 * An entry contains a command for state machine, and the term when entry was received by leader.
 * @typedef {Put & { term: number }} Entry
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

/** [TODO]
 * AppendEntryResponse message type from a follower replica after receiving an AppendEntryRPC.
 * @typedef {Message & { type: 'AppendEntryResponse', entry: string, term: number }} AppendEntryResponse
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
