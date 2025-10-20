// fix-react-scripts.js
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const reactScriptsBin = path.join(__dirname, "node_modules", ".bin", "react-scripts");

// Only run chmod if we're on Linux/macOS
if (process.platform !== "win32") {
  exec(`chmod +x "${reactScriptsBin}"`, (err) => {
    if (err) {
      console.warn("⚠️ Failed to chmod react-scripts:", err.message);
    } else {
      console.log("✅ react-scripts binary fixed with chmod +x");
    }
  });
} else {
  // On Windows, no chmod needed
  console.log("ℹ️ Skipping chmod (Windows detected)");
}
