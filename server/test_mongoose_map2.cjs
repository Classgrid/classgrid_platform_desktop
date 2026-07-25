const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

const User = mongoose.model('TestUser3', userSchema);

async function run() {
  try {
    const user = new User({ metadata: {} });
    user.metadata = {
      "first_name": "Neha",
      "last_name": "Sharma"
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
