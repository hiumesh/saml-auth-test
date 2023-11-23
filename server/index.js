const express = require("express");

const { sp, idp } = require("./saml-config");

const app = express();

app.get("/", (req, res) => {
  res.send("Hi from this side");
});

app.get("/saml/metadata", function (req, res) {
  res.type("application/xml");
  res.send(sp.create_metadata());
});

app.get("/saml/login", function (req, res) {
  sp.create_login_request_url(idp, {}, function (err, login_url, request_id) {
    if (err != null) return res.send(500);
    res.redirect(login_url);
  });
});

app.post("/assert", function (req, res) {
  var options = { request_body: req.body };
  sp.post_assert(idp, options, function (err, saml_response) {
    if (err != null) return res.send(500);

    // Save name_id and session_index for logout
    // Note:  In practice these should be saved in the user session, not globally.
    name_id = saml_response.user.name_id;
    session_index = saml_response.user.session_index;

    res.send("Hello #{name_id}! session_index: #{session_index}.");
  });
});

app.listen(5000, () => {
  console.log("Server listing on port 5000");
});
