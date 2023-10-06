# Tusk-Mastodon

[Mastodon](https://github.com/skullzarmy/Tusk) API Client for node - forked from node-mastodon [abandoned]

[Source on GitHub](https://github.com/skullzarmy/Tusk) | [Documentation](https://skullzarmy.github.io/Tusk/)

### Notes

-   I forked this project and fixed the obvious issues / updated the packages, and replaced `request` with `axios`.
-   I added tests using [Bun.sh](https://bun.sh/) runtime and test environment.
-   Introduced individual HTTP methods (get, post, put, etc.) alongside the generic request method.

If you find any bugs please open an issue and I will handle it as soon as I can. Thanks!

[![npm](https://img.shields.io/npm/dw/tusk-mastodon?label=NPM%20INSTALLS&style=for-the-badge)](https://www.npmjs.com/package/tusk-mastodon)

[![Run Tests](https://github.com/skullzarmy/Tusk/actions/workflows/test.yml/badge.svg)](https://github.com/skullzarmy/Tusk/actions/workflows/test.yml)

[![Known Vulnerabilities](https://snyk.io/test/github/skullzarmy/Tusk/badge.svg?style=flat-square)](https://snyk.io/test/github/skullzarmy/Tusk)

[![maintained with hearth by skullzarmy](https://img.shields.io/badge/maintained%20with%20%E2%99%A5%20by-skullzarmy-ff1515.svg)](https://github.com/skullzarmy)

# Installing

```
npm install tusk-mastodon
```

## Usage:

```javascript
var Tusk = require("tusk-mastodon");

var T = new Tusk({
    access_token: "...",
    timeout_ms: 60 * 1000, // optional HTTP request timeout to apply to all requests.
    api_url: "https://mastodon.social/api/v1/", // optional, defaults to https://mastodon.social/api/v1/
});
```

# Tusk API:

## `var T = new Tusk(config)`

Create a `Tusk` instance that can be used to make requests to Mastodon's APIs. Only supports oauth2 access tokens (no username/password auth) for security reasons.

I advise that you use the [oauth](https://www.npmjs.com/package/oauth) package to get the user's access_token. More information about how to do that is [on the node-mastodon wiki](https://github.com/jessicahayley/node-mastodon/wiki/Getting-an-access_token-with-the-oauth-package).  
You'll need to register your app on Mastodon first as well.

If authenticating with user context, `config` should be an object of the form:

```
{
  access_token: '...'
}
```

## `T.get(path, [params], callback)`

GET any of the REST API endpoints.

**path**

The endpoint to hit.

**params**

(Optional) parameters for the request.

**callback**

`function (err, data, response)`

-   `data` is the parsed data received from Mastodon.
-   `response` is the [http.IncomingMessage](http://nodejs.org/api/http.html#http_http_incomingmessage) received from Mastodon.

## `T.post(path, [params], callback)`

POST any of the REST API endpoints. Same usage as `T.get()`.

## `T.getAuth()`

Get the client's authentication tokens.

## `T.setAuth(tokens)`

Update the client's authentication tokens.

# Tests

0. Install Bun

```bash
curl -fsSL https://bun.sh/install | bash # for macOS, Linux, and WSL
```

1. Run Tests

```bash
bun test
```

---

# Examples

### Reading the home timeline

```javascript
T.get("timelines/home", {}).then((resp) => console.log(resp.data));
```

### Upload an image and attach it to a toot

```javascript
var id;
T.post("media", { file: fs.createReadStream("path/to/image.png") }).then((resp) => {
    id = resp.data.id;
    T.post("statuses", { status: "#selfie", media_ids: [id] });
});
```

---

# Advanced

You may specify an array of trusted certificate fingerprints if you want to only trust a specific set of certificates.
When an HTTP response is received, it is verified that the certificate was signed, and the peer certificate's fingerprint must be one of the values you specified. By default, the node.js trusted "root" CAs will be used.

eg.

```js
var T = new Tusk({
    access_token: "...",
    trusted_cert_fingerprints: ["66:EA:47:62:D9:B1:4F:1A:AE:89:5F:68:BA:6B:8E:BB:F8:1D:BF:8E"],
});
```
