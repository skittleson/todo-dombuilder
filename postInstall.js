const fs = require("fs");

fs.copyFile("./node_modules/@kanmf/dombuilder/index.mjs", "./src/dombuilder.mjs", (err) => {
  if (err) {
    console.log("Error Occurred:", err);
  } else {
    console.log("File Copied Successfully!");
  }
});
