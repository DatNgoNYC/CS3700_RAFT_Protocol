const { BaseRaftState } = require("./BaseRaftState");

/**
 * Leader state class.
 * @class
 * @extends BaseRaftState
 */
class LeaderState {
  /**
   * Creates an instance of LeaderState.
   * @param {Replica} replica - The Replica instance.
   */
  constructor(replica) {
    // Call the constructor of the base class
    BaseRaftState.call(this, replica);
    // Additional method specific to the Leader state
    this.leaderMethod = function () {
      console.log('Leader-specific method');
      // Leader-specific logic
    };
  }

  /**
   * Implement the run method specific to the Leader state.
   */
  run() {
    console.log('Leader State');
    // Access common properties and methods from the Replica context
    this.replica.commonMethod();
    // Access state-specific method
    this.leaderMethod();
  }
}

// Set up prototype inheritance for LeaderState
LeaderState.prototype = Object.create(BaseRaftState.prototype);

module.exports = {
  LeaderState
}