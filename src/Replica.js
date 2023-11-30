/**
 * Base class for Raft states (Pseudo-abstract).
 * @class
 * @abstract
 */
class BaseRaftState {
  /**
   * Creates an instance of BaseRaftState.
   * @param {Types.Replica} replica - The Replica instance.
   */
  constructor(replica) {
    // Reference to the replica

    this.replica = replica;
  }

  /**
   * Abstract method for running the replica dependent on current state.
   */
  run() {
    throw new Error('Abstract method run must be overridden');
  }
}

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

/**
 * Replica class (Context of our state).
 * @class
 */
class Replica {
  /**
   * Creates an instance of Replica.
   * @param {number} port - The port number.
   * @param {string} id - The ID of the replica.
   * @param {string[]} others - An array of IDs of other replicas.
   */
  constructor(port, id, others) {
    /** @property {int} port - This replica's port number */
    this.port = port;
    /** @property {string} id - This replica's id */
    this.id = id;
    /** @property {string[]} others - Other replicas in the set */
    this.others = others;

    // Raft properties
    /** @property {int} term - This replica's current term */
    this.term = 0;
    /** @property {} log - This replica's log of entries (get/puts) */
    this.log = [];

    /**
     * The current state of the Raft algorithm.
     * @property {BaseRaftState} - This replica's current state.
     */
    this.state = new FollowerState(this);
  }

  /** @method run - Get the replica up and running! */
  run() {
    this.state.run();
  }
}

module.exports = {
  Replica,
};
