const express = require("express");

const app = express();

app.post("/init", (req, res) => {
  return res.redirect(
    "https://login.microsoftonline.com/d3bc342a-1f65-46e4-b1f3-6969e7cf61a0/saml2"
  );
});

app.listen(5000, () => {
  console.log("Server listing on port 5000");
});
