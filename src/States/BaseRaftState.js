// eslint-disable-next-line no-unused-vars
const { Replica } = require('../Replica');

/**
 * Base class for Raft states (Pseudo-abstract).
 * @class
 * @abstract
 */
class BaseRaftState {
  /**
   * Creates an instance of BaseRaftState.
   * @param {Replica} replica - The Replica instance we use as context.
   */
  constructor(replica) {
    /** @property {Replica} - The state's replica instance we use as context. */
    this.replica = replica;

    // Bind methods to the instance to preserve the context
    this.setupTimeout = this.setupTimeout.bind(this);
    // this.clearTimeout = this.clearTimeout.bind(this);
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
   * @param {Message}
   * @abstract   */
  messageHandler() {
    throw new Error('Abstract method run must be overridden with state specific logic.');
  }
}

module.exports = BaseRaftState;
