/**
 * General message properties all messages must have.
 * @typedef {Object} Message
 * @property {string} src - Source of the message.
 * @property {string} dst - Destination of the message.
 * @property {string} leader - The ID of the leader, or 'FFFF' if the leader's ID is unknown.
 * @property {string} type - The type of the message.
 * @property {string} MID - The message ID.
 */

/** [TODO]
 * AppendEntry RPC message type from a Leader replica.
 * @typedef {Message & { type: 'AppendEntryRPC', entry: string, term: number }} AppendEntryRPC
 */

/** [TODO]
 * AppendEntryResponse message type from a follower replica after receiving an AppendEntryRPC.
 * @typedef {Message & { type: 'AppendEntryResponse', entry: string, term: number }} AppendEntryResponse
 */

/**
 * RequestVote RPC message type from a Candidate replica.
 *
 *  - {number} term - The candidate's term.
 *  - {string} candidateID - The candidate requesting this vote.
 *  - {number} lastLogIndex - index of candidate’s last log entry (§5.4 Raft paper).
 *  - {number} lastLogTerm - term of candidate’s last log entry (§5.4 Raft paper).
 * @typedef {Message & { type: 'RequestVoteRPC', term: number, candidateID: string, lastLogIndex: number, lastLogTerm: number }} RequestVoteRPC
 */

/**
 * The VoteResponse message type from a replica to a candidate.
 *
 *  - {number} term - The src's currentTerm
 *  - {boolean} voteGranted - True means the candidate received the vote.
 * @typedef {Message & { type: 'VoteResponse', term: number, voteGranted: boolean }} VoteResponse
 */

/**
 * Get request from the client.
 * @typedef {Message & { type: 'get' , key: string }} Get
 */

/**
 * An OK message the leader replica can send with the key's value.
 * @typedef {Message & { type: 'ok', value: string }} ok
 */

/**
 * Or the leader replica may respond with a fail message, in which case the client should retry the get():
 * @typedef {Message { type: 'fail' } } Fail
 */

/**
 * If the client sends any message (get() or put()) to a replica that is not the leader, it should respond with a redirect:
 * @typedef {Message & { type: 'redirect' } } Redirect
 */

module.exports = {};
