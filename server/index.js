const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const db = require("./db");
const {
  createSSOIdentityProvider,
  createSSOServiceProvider,
} = require("./saml-config");

const app = express();

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());

app.get("/", (req, res) => {
  return res.send("Hi from this side");
});

app.get("/saml/:tenantId/metadata", function (req, res) {
  const sp = createSSOServiceProvider(req.params.tenantId);
  res.type("application/xml");
  return res.send(sp.create_metadata());
});

app.get("/saml/login", async function (req, res) {
  try {
    const email = req.query.email;
    if (!email) throw new Error("Email is required!");
    const domain = email.split("@")[1];
    if (!domain) throw new Error("Email with Domain is required!");
    const tenant = await db.tenant.findUnique({
      where: {
        domain,
      },
    });

    if (tenant) {
      const idp = createSSOIdentityProvider(
        tenant.login_url,
        tenant.logout_url,
        tenant.certificates
      );
      const sp = createSSOServiceProvider(tenant.id);
      sp.create_login_request_url(
        idp,
        {},
        function (err, login_url, request_id) {
          if (err != null) return res.send(500);
          return res.redirect(login_url);
        }
      );
    } else throw new Error("SSO not registered!");
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.post("/saml/:tenantId/assert", async function (req, res) {
  try {
    const options = { request_body: req.body };
    const tenantId = Number.parseInt(req.params.tenantId, 10);
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) throw new Error("Tenant with the specified Id not found!");

    const sp = createSSOServiceProvider(tenant.id);
    const idp = createSSOIdentityProvider(
      tenant.login_url,
      tenant.logout_url,
      tenant.certificates
    );
    sp.post_assert(idp, options, async function (err, saml_response) {
      if (err != null) throw new Error(err.message);

      if (saml_response.type == "logout_response") {
        req.session.name_id = null;
        req.session.session_index = null;
        req.session.userName = null;
        return res.json({
          success: true,
          message: "logout successfull!",
        });
      }

      const email = saml_response.user.attributes?.emailaddress
        ? saml_response.user.attributes.emailaddress[0]
        : null;
      if (!email)
        throw new Error(
          "Email not provided by the Identity Provider response!"
        );

      const user = await db.user.findUnique({
        where: {
          email,
        },
      });

      if (!user) throw new Error("User not registered in the Database!");

      const session = await db.session.create({
        data: {
          user_id: user.id,
          name_id: saml_response.user.name_id,
          session_index: saml_response.user.session_index,
        },
      });

      return res.json({
        success: true,
        data: saml_response,
      });
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.get("/saml/logout", function (req, res) {
  var options = {
    name_id: req.session.name_id,
    session_index: req.session.session_index,
  };

  sp.create_logout_request_url(idp, options, function (err, logout_url) {
    if (err != null) return res.send(500);
    res.redirect(logout_url);
  });
});

app.listen(5000, () => {
  console.log("Server listing on port 5000");
});
