const fs = require("fs");
const esbuild = require("./client/node_modules/esbuild");
const source = fs.readFileSync("./client/src/App.jsx", "utf8");

esbuild.transform(source, { loader: "jsx" })
  .then(() => console.log("Syntax OK"))
  .catch(error => {
    for (const item of error.errors || []) {
      console.log("ERROR:", item.text);
      console.log("LOCATION:", item.location);
    }
  });
