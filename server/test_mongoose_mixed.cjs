const mongoose = require('mongoose');

// Minimal schema to test the Mixed update
const userSchema = new mongoose.Schema({
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

const User = mongoose.model('TestUser2', userSchema);

async function run() {
  try {
    const user = new User({ metadata: {} });
    
    // Simulate the update from ContextualProfile
    user.metadata = {
      "identity.first_name": "Neha",
      "identity.last_name": "Sharma"
    };
    
    // Test validation
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
