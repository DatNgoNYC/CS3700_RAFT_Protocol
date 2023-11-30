const { FollowerState } = require("./States/Follower");


/**
 * Replica class (Context).
 * @class
 */
class Replica {
  /**
   * Creates an instance of Replica.
   */
  constructor() {
    // Common properties shared among states
    this.term = 0;
    this.logOfAppendEntries = [];

    // Common method shared among states
    this.commonMethod = function () {
      console.log('Common method');
      // Common logic
    };

    // Set the initial state to Follower
    this.state = new FollowerState(this);
  }

  /**
   * Method to run the current state's logic.
   */
  run() {
    this.state.run();
  }
}

// Example usage
const replica = new Replica();
replica.run(); // Outputs: Follower State
