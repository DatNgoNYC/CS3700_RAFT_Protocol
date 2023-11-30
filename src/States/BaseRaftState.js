/**
 * Base class for Raft states (Pseudo-abstract).
 * @class
 */
class BaseRaftState {
  /**
   * Creates an instance of BaseRaftState.
   * @param {Replica} replica - The Replica instance.
   */
  constructor(replica) {
    // Reference to the replica
    this.replica = replica;
  }

  /**
   * Abstract method for running the state logic.
   * @abstract
   */
  run() {
    throw new Error('Abstract method run must be overridden');
  }
}

module.exports = {
  BaseRaftState,
};
