const { BaseRaftState } = require("./BaseRaftState");

/**
 * Candidate state class.
 * @class
 * @extends BaseRaftState
 */
class CandidateState {
  /**
   * Creates an instance of CandidateState.
   * @param {Replica} replica - The Replica instance.
   */
  constructor(replica) {
    // Call the constructor of the base class
    BaseRaftState.call(this, replica);
    // Additional property specific to the Candidate state
    this.candidateProperty = 'Candidate-specific property';
  }

  /**
   * Implement the run method specific to the Candidate state.
   */
  run() {
    console.log('Candidate State');
    // Access common properties and methods from the Replica context
    this.replica.commonMethod();
    // Access state-specific property
    console.log('Candidate Property:', this.candidateProperty);
  }
}

// Set up prototype inheritance for CandidateState
CandidateState.prototype = Object.create(BaseRaftState.prototype);

module.exports = {
  CandidateState
}
