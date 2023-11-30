// Base State Class (Pseudo-abstract)
function BaseRaftState(replica) {
  // Reference to the replica
  this.replica = replica;
}

// Run method should be abstract, but JavaScript doesn't have explicit support for abstract methods.
BaseRaftState.prototype.run = function () {
  throw new Error("Abstract method run must be overridden");
};

// Follower State
function FollowerState(replica) {
  // Call the constructor of the base class
  BaseRaftState.call(this, replica);
}

// Set up prototype inheritance for FollowerState
FollowerState.prototype = Object.create(BaseRaftState.prototype);
// Fix the constructor property after setting up the prototype chain
FollowerState.prototype.constructor = FollowerState;

// Implement the run method specific to the Follower state
FollowerState.prototype.run = function () {
  console.log("Follower State");
  // Access common properties and methods from the Replica context
  this.replica.commonMethod();
};

// Candidate State
function CandidateState(replica) {
  // Call the constructor of the base class
  BaseRaftState.call(this, replica);
  // Additional property specific to the Candidate state
  this.candidateProperty = "Candidate-specific property";
}

// Set up prototype inheritance for CandidateState
CandidateState.prototype = Object.create(BaseRaftState.prototype);
// Fix the constructor property after setting up the prototype chain
CandidateState.prototype.constructor = CandidateState;

// Implement the run method specific to the Candidate state
CandidateState.prototype.run = function () {
  console.log("Candidate State");
  // Access common properties and methods from the Replica context
  this.replica.commonMethod();
  // Access state-specific property
  console.log("Candidate Property:", this.candidateProperty);
};

// Leader State
function LeaderState(replica) {
  // Call the constructor of the base class
  BaseRaftState.call(this, replica);
  // Additional method specific to the Leader state
  this.leaderMethod = function () {
      console.log("Leader-specific method");
      // Leader-specific logic
  };
}

// Set up prototype inheritance for LeaderState
LeaderState.prototype = Object.create(BaseRaftState.prototype);
// Fix the constructor property after setting up the prototype chain
LeaderState.prototype.constructor = LeaderState;

// Implement the run method specific to the Leader state
LeaderState.prototype.run = function () {
  console.log("Leader State");
  // Access common properties and methods from the Replica context
  this.replica.commonMethod();
  // Access state-specific method
  this.leaderMethod();
};

// Replica Class (Context)
function Replica() {
  // Common properties shared among states
  this.term = 0;
  this.logOfAppendEntries = [];

  // Common method shared among states
  this.commonMethod = function () {
      console.log("Common method");
      // Common logic
  };

  // Set the initial state to Follower
  this.state = new FollowerState(this);
}

// Method to run the current state's logic
Replica.prototype.run = function () {
  this.state.run();
};

// Example usage
const replica = new Replica();
replica.run(); // Outputs: Follower State

// Transition to Candidate State
replica.state = new CandidateState(replica);
replica.run(); // Outputs: Candidate State
