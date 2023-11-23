const saml2 = require("saml2-js");
const fs = require("fs");

var sp_options = {
  entity_id:
    "https://5000-hiumesh-samlauthtest-socx4gtsm7q.ws-us106.gitpod.io/saml/metadata",
  private_key: fs.readFileSync("sp-private-key.pem").toString(),
  certificate: fs.readFileSync("sp-certificate.pem").toString(),
  assert_endpoint:
    "https://5000-hiumesh-samlauthtest-socx4gtsm7q.ws-us106.gitpod.io/assert",
  force_authn: true,
  auth_context: {
    comparison: "exact",
    class_refs: ["urn:oasis:names:tc:SAML:1.0:am:password"],
  },
  nameid_format: "urn:oasis:names:tc:SAML:2.0:nameid-format:transient",
  sign_get_request: false,
  allow_unencrypted_assertion: true,
};

const sp = new saml2.ServiceProvider(sp_options);

const idp_options = {
  sso_login_url:
    "https://login.microsoftonline.com/d3bc342a-1f65-46e4-b1f3-6969e7cf61a0/saml2",
  sso_logout_url:
    "https://login.microsoftonline.com/d3bc342a-1f65-46e4-b1f3-6969e7cf61a0/saml2",
  certificates: [fs.readFileSync("saml-app.cer").toString()],
  force_authn: true,
  sign_get_request: false,
  allow_unencrypted_assertion: false,
};

const idp = new saml2.IdentityProvider(idp_options);

module.exports = {
  sp,
  idp,
};
