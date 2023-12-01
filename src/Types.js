/**
 * General message type.
 * @typedef {Object} Message
 * @property {string} src - Source of the message.
 * @property {string} dst - Destination of the message.
 */

/**
 * AppendEntry RPC message type.
 * @typedef {Message & { entry: string, term: number }} AppendEntryRPC
 */

/**
 * RequestVote RPC message type.
 * @typedef {Message & { vote: string }} RequestVoteRPC
 */

module.exports = {};
