  /**
   * STATE
   * 
   * The state can be one of Candidate, Follower, or Leader.
   * 
   * Javascript does not have traditional interfaces so we're going to have impelemet the state pattern abstraction with javascript's restrictions in mind. The state will be represented by variables of the same name which we place in their own modules, likewise named, also in the current directory. The states will all implement the functions described below following the raft protocol.
   * 
   * run() - Continue normal operations.
   * activateTimeout() - depending on the state, the timeout will either be an election timeout if it is a follower/candidate or heartbeat if a leader.
   */