const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const JWT_SECRET = "klfjsldkjflskdjflskdjfsldfjlsk";

const db = require("./db");
const {
  createSSOIdentityProvider,
  createSSOServiceProvider,
} = require("./saml-config");

const app = express();

app.use(cors());

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());
app.use(cookieParser());

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
    // const domain = email.split("@")[1];
    // if (!domain) throw new Error("Email with Domain is required!");
    const user = await db.user.findUnique({
      where: {
        email,
      },
      select: {
        email: true,
        id: true,
        name: true,
        tenant: true,
      },
    });

    if (!user) throw new Error("User not registered!");
    const tenant = user.tenant;
    if (tenant.auth_type !== "SSO")
      throw new Error("Your tenant not support the SSO authentication!");

    // const tenant = await db.tenant.findUnique({
    //   where: {
    //     domain,
    //   },
    // });

    const idp = createSSOIdentityProvider(
      tenant.login_url,
      tenant.logout_url,
      tenant.certificates,
      email
    );
    const sp = createSSOServiceProvider(tenant.id);
    sp.create_login_request_url(idp, {}, function (err, login_url, request_id) {
      if (err != null) throw new Error(err?.message);
      return res.redirect(login_url);
    });

    // if (tenant) {

    // } else throw new Error("SSO not registered!");
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
        await db.session.delete({
          where: {
            name_id: saml_response.user.name_id,
            session_index: saml_response.user.session_index,
          },
        });

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

      const tokenPayload = {
        id: user.id,
        email: user.email,
        tenant_id: user.tenant_id,
      };

      console.log(JWT_SECRET);

      const accessToken = jwt.sign(tokenPayload, JWT_SECRET, {
        expiresIn: "15m",
      });
      const refreshToken = jwt.sign(tokenPayload, JWT_SECRET, {
        expiresIn: "7d",
      });

      const session = await db.session.create({
        data: {
          user_id: user.id,
          name_id: saml_response.user.name_id,
          session_index: saml_response.user.session_index,
          refresh_token: refreshToken,
        },
      });

      res.cookie("access_token", accessToken, { httpOnly: true });
      res.cookie("refresh_token", refreshToken, { httpOnly: true });

      return res.json({
        success: true,
        data: session,
      });
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.get("/logout", async function (req, res) {
  try {
    console.log(
      req.headers["cf-connecting-ip"] ||
        req.headers["x-real-ip"] ||
        req.headers["x-forwarded-for"] ||
        req.socket.remoteAddress ||
        null
    );
    if (req.cookies?.refresh_token) {
      await db.session.delete({
        where: {
          refresh_token: req.cookies.refresh_token,
        },
      });

      res.clearCookie("access_token");
      res.clearCookie("refresh_token");

      return res.json({
        success: true,
        message: "Logout Successfull!",
      });
    }
    throw new Error("No Session Found!");
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.listen(5000, () => {
  console.log("Server listing on port 5000");
});
