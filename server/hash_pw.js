import bcrypt from 'bcryptjs';
async function run() {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash("Nikhil@5049", salt);
    console.log("HASH:", hash);
}
run();
