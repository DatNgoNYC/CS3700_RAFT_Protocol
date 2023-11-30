// Types.js

const { Replica } = require('./Replica'); // Adjust the path as needed
const { BaseRaftState } = require('./States/BaseRaftState'); // Adjust the path as needed
const { FollowerState } = require('./States/Follower'); // Adjust the path as needed
const { CandidateState } = require('./States/Candidate'); // Adjust the path as needed
const { LeaderState } = require('./States/Leader'); // Adjust the path as needed

module.exports = {
  Replica,
  BaseRaftState,
  FollowerState,
  CandidateState,
  LeaderState,
  // Add other types as needed
};
