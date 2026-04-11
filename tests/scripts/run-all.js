const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const testDirs = ['infra', 'judge', 'scenarios'];

console.log("========================================");
console.log("   CODE CLASH - UNIFIED TEST RUNNER   ");
console.log("========================================\n");

let passed = 0;
let total = 0;

for (const dir of testDirs) {
    const dirPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(dirPath)) continue;

    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.js'));
    if (files.length === 0) continue;

    console.log(`\n--- [Category: ${dir.toUpperCase()}] ---`);
    for (const file of files) {
        if (file === 'run-all.js') continue;
        total++;
        const filePath = path.join(dirPath, file);
        console.log(`\nRunning: ${file}...`);
        
        try {
            // Use node to run the test
            const output = execSync(`node "${filePath}"`, { stdio: 'inherit', timeout: 30000 });
            passed++;
            console.log(`✅ ${file} PASSED`);
        } catch (error) {
            console.log(`❌ ${file} FAILED`);
            // We don't exit here, we want to run all tests
        }
    }
}

console.log("\n\n========================================");
console.log(`   FINAL RESULTS: ${passed}/${total} PASSED`);
console.log("========================================");

if (passed < total) process.exit(1);
