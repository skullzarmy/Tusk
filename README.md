#twit

Twitter API Client for node

#Installing

```
npm install twit
```

##Usage:

```javascript
var Twit = require('twit')

var T = new Twit({
  consumer_key:         '...',
  consumer_secret:      '...',
  access_token:         '...',
  access_token_secret:  '...',
  timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
})

//
//  tweet 'hello world!'
//
T.post('statuses/update', { status: 'hello world!' }, function(err, data, response) {
  console.log(data)
})

//
//  search twitter for all tweets containing the word 'banana' since July 11, 2011
//
T.get('search/tweets', { q: 'banana since:2011-07-11', count: 100 }, function(err, data, response) {
  console.log(data)
})

//
//  get the list of user id's that follow @tolga_tezel
//
T.get('followers/ids', { screen_name: 'tolga_tezel' },  function (err, data, response) {
  console.log(data)
})

//
// Twit has promise support; you can use the callback API,
// promise API, or both at the same time.
//
T.get('account/verify_credentials', { skip_status: true })
  .catch(function (err) {
    console.log('caught error', err.stack)
  })
  .then(function (result) {
    // `result` is an Object with keys "data" and "resp".
    // `data` and `resp` are the same objects as the ones passed
    // to the callback.
    // See https://github.com/ttezel/twit#tgetpath-params-callback
    // for details.

    console.log('data', result.data);
  })

//
//  retweet a tweet with id '343360866131001345'
//
T.post('statuses/retweet/:id', { id: '343360866131001345' }, function (err, data, response) {
  console.log(data)
})

//
//  destroy a tweet with id '343360866131001345'
//
T.post('statuses/destroy/:id', { id: '343360866131001345' }, function (err, data, response) {
  console.log(data)
})

//
// get `funny` twitter users
//
T.get('users/suggestions/:slug', { slug: 'funny' }, function (err, data, response) {
  console.log(data)
})

//
// post a tweet with media
//
var b64content = fs.readFileSync('/path/to/img', { encoding: 'base64' })

// first we must post the media to Twitter
T.post('media/upload', { media_data: b64content }, function (err, data, response) {
  // now we can assign alt text to the media, for use by screen readers and
  // other text-based presentations and interpreters
  var mediaIdStr = data.media_id_string
  var altText = "Small flowers in a planter on a sunny balcony, blossoming."
  var meta_params = { media_id: mediaIdStr, alt_text: { text: altText } }

  T.post('media/metadata/create', meta_params, function (err, data, response) {
    if (!err) {
      // now we can reference the media and post a tweet (media will attach to the tweet)
      var params = { status: 'loving life #nofilter', media_ids: [mediaIdStr] }

      T.post('statuses/update', params, function (err, data, response) {
        console.log(data)
      })
    }
  })
})

//
// post media via the chunked media upload API.
// You can then use POST statuses/update to post a tweet with the media attached as in the example above using `media_id_string`.
// Note: You can also do this yourself manually using T.post() calls if you want more fine-grained
// control over the streaming. Example: https://github.com/ttezel/twit/blob/master/tests/rest_chunked_upload.js#L20
//
var filePath = '/absolute/path/to/file.mp4'
T.postMediaChunked({ file_path: filePath }, function (err, data, response) {
  console.log(data)
})
```

# twit API:

##`var T = new Twit(config)`

Create a `Twit` instance that can be used to make requests to Twitter's APIs.

If authenticating with user context, `config` should be an object of the form:
```
{
    consumer_key:         '...'
  , consumer_secret:      '...'
  , access_token:         '...'
  , access_token_secret:  '...'
}
```

If authenticating with application context, `config` should be an object of the form:
```
{
    consumer_key:         '...'
  , consumer_secret:      '...'
  , app_only_auth:        true
}
```
Note that Application-only auth will not allow you to perform requests to API endpoints requiring
a user context, such as posting tweets. However, the endpoints available can have a higher rate limit.

##`T.get(path, [params], callback)`
GET any of the REST API endpoints.

**path**

The endpoint to hit. When specifying `path` values, omit the **'.json'** at the end (i.e. use **'search/tweets'** instead of **'search/tweets.json'**).

**params**

(Optional) parameters for the request.

**callback**

`function (err, data, response)`

- `data` is the parsed data received from Twitter.
- `response` is the [http.IncomingMessage](http://nodejs.org/api/http.html#http_http_incomingmessage) received from Twitter.

##`T.post(path, [params], callback)`

POST any of the REST API endpoints. Same usage as `T.get()`.

##`T.postMediaChunked(params, callback)`

Helper function to post media via the POST media/upload (chunked) API. `params` is an object containing a `file_path` key. `file_path` is the absolute path to the file you want to upload.

```js
var filePath = '/absolute/path/to/file.mp4'
T.postMediaChunked({ file_path: filePath }, function (err, data, response) {
  console.log(data)
})
```

You can also use the POST media/upload API via T.post() calls if you want more fine-grained control over the streaming; [see here for an example](https://github.com/ttezel/twit/blob/master/tests/rest_chunked_upload.js#L20).

##`T.getAuth()`
Get the client's authentication tokens.

##`T.setAuth(tokens)`
Update the client's authentication tokens.

-------

Go here to create an app and get OAuth credentials (if you haven't already): https://dev.twitter.com/apps/new

#Advanced

You may specify an array of trusted certificate fingerprints if you want to only trust a specific set of certificates.
When an HTTP response is received, it is verified that the certificate was signed, and the peer certificate's fingerprint must be one of the values you specified. By default, the node.js trusted "root" CAs will be used.

eg.
```js
var twit = new Twit({
  consumer_key:         '...',
  consumer_secret:      '...',
  access_token:         '...',
  access_token_secret:  '...',
  trusted_cert_fingerprints: [
    '66:EA:47:62:D9:B1:4F:1A:AE:89:5F:68:BA:6B:8E:BB:F8:1D:BF:8E',
  ]
})
```

#Contributing

- Make your changes
- Make sure your code matches the style of the code around it
- Add tests that cover your feature/bugfix
- Run tests
- Submit a pull request

#How do I run the tests?

Create two files: `config1.js` and `config2.js` at the root of the `twit` folder. They should contain two different sets of oauth credentials for twit to use (two accounts are needed for testing interactions). They should both look something like this:

```
module.exports = {
    consumer_key: '...'
  , consumer_secret: '...'
  , access_token: '...'
  , access_token_secret: '...'
}
```

Then run the tests:

```
npm test
```

You can also run the example:

```
node examples/rtd2.js
```

![iRTD2](http://dl.dropbox.com/u/32773572/RTD2_logo.png)

The example is a twitter bot named [RTD2](https://twitter.com/#!/iRTD2) written using `twit`. RTD2 tweets about **github** and curates its social graph.

-------

[FAQ](https://github.com/ttezel/twit/wiki/FAQ)

-------

## License

(The MIT License)

Copyright (c) by Tolga Tezel <tolgatezel11@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
