#node-mastodon

Mastodon API Client for node

#Installing

```
npm install mastodon
```

##Usage:

```javascript
var Mastodon = require('mastodon')

var M = new Masto({
  access_token:         '...',
  timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
})
```

# node-mastodon API:

##`var M = new Mastodon(config)`

Create a `Mastodon` instance that can be used to make requests to Mastodon's APIs. Currently only supports oauth2 access tokens (no username/password auth) for security reasons.

I advise that you use the [oauth](https://www.npmjs.com/package/oauth) package to get the user's access_token. More information about how to do that is [on the wiki](https://github.com/jessicahayley/node-mastodon/wiki/Getting-an-access_token-with-the-oauth-package).  
You'll need to [register your app](https://github.com/Gargron/mastodon/wiki/API#oauth-apps) on Mastodon first as well.

If authenticating with user context, `config` should be an object of the form:
```
{
  access_token:         '...'
}
```

##`M.get(path, [params], callback)`
GET any of the REST API endpoints.

**path**

The endpoint to hit.

**params**

(Optional) parameters for the request.

**callback**

`function (err, data, response)`

- `data` is the parsed data received from Mastodon.
- `response` is the [http.IncomingMessage](http://nodejs.org/api/http.html#http_http_incomingmessage) received from Mastodon.

##`M.post(path, [params], callback)`

POST any of the REST API endpoints. Same usage as `T.get()`.

##`M.getAuth()`
Get the client's authentication tokens.

##`M.setAuth(tokens)`
Update the client's authentication tokens.

-------

#Advanced

You may specify an array of trusted certificate fingerprints if you want to only trust a specific set of certificates.
When an HTTP response is received, it is verified that the certificate was signed, and the peer certificate's fingerprint must be one of the values you specified. By default, the node.js trusted "root" CAs will be used.

eg.
```js
var M = new Mastodon({
  access_token:         '...',
  trusted_cert_fingerprints: [
    '66:EA:47:62:D9:B1:4F:1A:AE:89:5F:68:BA:6B:8E:BB:F8:1D:BF:8E',
  ]
})
```
