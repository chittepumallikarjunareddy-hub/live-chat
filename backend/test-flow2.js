const { io } = require("socket.io-client");

async function test() {
  const alice = io("http://localhost:3001");

  alice.on("connect", () => {
    console.log("Alice connected");
    alice.emit("user:join", { username: "sivion.alice" });
  });

  alice.on("friend:send-result", (data) => {
    console.log("Alice received send-result:", data);
    
    // Now bob logs in
    const bob = io("http://localhost:3001");
    bob.on("connect", () => {
      console.log("Bob connected");
      bob.emit("user:join", { username: "sivion.bob" });
    });

    bob.on("friends:pending", (data) => {
      console.log("Bob received initial pending:", data);
      setTimeout(() => {
        process.exit(0);
      }, 1000);
    });
  });

  setTimeout(() => {
    console.log("Alice sending request to bob...");
    alice.emit("friend:send", { from: "sivion.alice", to: "sivion.bob" });
  }, 2000);
}

test();
