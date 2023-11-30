const { BaseRaftState } = require('./BaseRaftState');

/**
 * Follower state class.
 * @class
 * @extends BaseRaftState
 */
class FollowerState {
  /**
   * Creates an instance of FollowerState.
   * @param {Replica} replica - The Replica instance.
   */
  constructor(replica) {
    // Call the constructor of the base class
    BaseRaftState.call(this, replica);
  }

  /**
   * Implement the run method specific to the Follower state.
   */
  run() {
    console.log('Follower State');
    // Access common properties and methods from the Replica context
    this.replica.commonMethod();
  }
}

// Set up prototype inheritance for FollowerState
FollowerState.prototype = Object.create(BaseRaftState.prototype);

module.exports = {
  FollowerState,
};
