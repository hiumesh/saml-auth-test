const saml2 = require("saml2-js");
const fs = require("fs");

const BASE_URL = process.env.BASE_URL;

// var sp_options = {
//   entity_id:
//     "https://5000-hiumesh-samlauthtest-socx4gtsm7q.ws-us106.gitpod.io/saml/metadata",
//   private_key: fs.readFileSync("sp-private-key.pem").toString(),
//   certificate: fs.readFileSync("sp-certificate.pem").toString(),
//   assert_endpoint:
//     "https://5000-hiumesh-samlauthtest-socx4gtsm7q.ws-us106.gitpod.io/saml/assert",
//   allow_unencrypted_assertion: true,
// };

const createSSOServiceProvider = (tenant_id) => {
  var options = {
    entity_id: `${BASE_URL}/saml/${tenant_id}/metadata`,
    private_key: fs.readFileSync("sp-private-key.pem").toString(),
    certificate: fs.readFileSync("sp-certificate.pem").toString(),
    assert_endpoint: `${BASE_URL}/saml/${tenant_id}/assert`,
    allow_unencrypted_assertion: true,
  };

  return new saml2.ServiceProvider(options);
};

// const sp = new saml2.ServiceProvider(sp_options);

// const idp_options = {
//   sso_login_url:
//     "https://login.microsoftonline.com/d3bc342a-1f65-46e4-b1f3-6969e7cf61a0/saml2",
//   sso_logout_url:
//     "https://login.microsoftonline.com/d3bc342a-1f65-46e4-b1f3-6969e7cf61a0/saml2",
//   certificates: [fs.readFileSync("saml-app.cer").toString()],
// };

const createSSOIdentityProvider = (
  sso_login_url,
  sso_logout_url,
  certificates,
  email
) => {
  const options = {
    sso_login_url,
    sso_logout_url,
    certificates,
    login_hint: email,
  };
  return new saml2.IdentityProvider(options);
};

// const idp = new saml2.IdentityProvider(idp_options);

module.exports = {
  createSSOIdentityProvider,
  createSSOServiceProvider,
};
