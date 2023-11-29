const { Replica } = require("../Replica");

//
class Follower {
  constructor(replica) {
    /** @type {Replica} - A number representing the milliseconds before the timer (type depends on state) expires. */
    this.replica = replica;

    /** @type {number} - A number representing the milliseconds before the timer (type depends on state) expires. */
    this.election_timeout;
  }

  run() {
    // 
    this.activateTimeout();
    // we should be attach a different event handler for the socker every time the state changes because we interact with the message differently depending on the state.
    this.replica.socket.addListener('message', (buffer) => {
      // we expect the socket to be either receiving a RequestVoteRPC or  
    })
  }

  activateTimeout() {
    this.election_timeout = 150 + Math.random() * 150;
    setTimeout(() => {
      // election timeout so start the election proceeedings so we would BROADCAST the messages. a 
    }, this.election_timeout).
  }
}

module.exports = {
  Follower,
};
