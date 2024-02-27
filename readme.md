Introducting.... project RAFT !!

We implemented a distributed key-value database following the RAFT protocol. https://3700.network/docs/projects/raft/

The program is organized using the state pattern design. https://refactoring.guru/design-patterns/state

The replica class is the "context" and it will represent each replica. Each replica has a 'state' property that represents the state it is in, Follower, Candidate, or Leader. The implementations of these classes are derived from out base class BaseRaftState to encapsulate common functionality. 
