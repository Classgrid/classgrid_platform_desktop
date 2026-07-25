const mongoose = require('mongoose');

// Minimal schema to test the Map update
const userSchema = new mongoose.Schema({
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

const User = mongoose.model('TestUser', userSchema);

async function run() {
  try {
    const user = new User({ metadata: {} });
    
    // Simulate the update from ContextualProfile
    user.metadata = {
      "identity.first_name": "Neha",
      "identity.last_name": "Sharma"
    };
    
    const err = user.validateSync();
    if (err) {
      console.error("FAILED WITH ERROR:", err.message);
    } else {
      console.log("SUCCESS!");
    }
  } catch (error) {
    console.error("FAILED WITH EXCEPTION:", error.message);
  } finally {
    process.exit(0);
  }
}

run();
