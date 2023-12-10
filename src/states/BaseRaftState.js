// Need for jsdoc
// eslint-disable-next-line no-unused-vars
const Types = require('../Types');

/**
 * Base class for Raft states (Pseudo-abstract).
 * @class
 * @abstract
 */
class BaseRaftState {
  /**
   * @param {Types.Replica} replica - The Replica instance we use as context.
   */
  constructor(replica) {
    /** @type {Types.Replica} - The state's replica instance we use as context. */
    this.replica = replica;

    // Bind methods to the instance to preserve the context
    this.setupTimeout = this.setupTimeout.bind(this);
    this.timeoutHandler = this.timeoutHandler.bind(this);
    this.messageHandler = this.messageHandler.bind(this);
  }

  /**
   * Run the replica with logic defined by each state.
   *
   * 1. Set up the state's 'timeout' mechanism.
   * 2. Set up the state's message handler logic.
   * @method run
   * @abstract */
  run() {
    throw new Error('Abstract method run must be overridden with state specific logic.');
  }

  /**
   * Each state in Raft has a 'timeout' mechanism - something it should do by default after some time... Set it up here with the given timeout handler and the give timeout duration
   * @method setupTimeout
   * @param {Function} timeoutHandler - Callback function to be executed on timeout.
   * @param {number} timeoutDuration - Timeout duration in milliseconds.
   */
  setupTimeout(timeoutHandler, timeoutDuration) {
    clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(timeoutHandler, timeoutDuration);
  }

  /**
   * The event handler, dependent on state, for when the replica has a 'timeout' event.
   * @method timeoutHandler
   * @abstract */
  timeoutHandler() {
    throw new Error('Abstract method run must be overridden with state specific logic.');
  }

  /**
   * Each state has specific message handling logic.
   * @method messageHandler
   * @param {Buffer} message - The message the replica's received.
   * @abstract   */
  messageHandler(message) {
    throw new Error(`Abstract method run must be overridden with state specific logic. ${message}`);
  }

  /**
   * Clean up process before state switch. Remove the current state's timeout and messageHandler before changing state.
   * @param {string} state - The new state we want to change to
   */
  changeState(state) {
    clearTimeout(this.timeoutId);
    this.replica.socket.removeListener('message', this.messageHandler);
    this.replica.changeState(state);
  }
}

module.exports = BaseRaftState;
