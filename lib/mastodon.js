//
//  Mastodon API Wrapper
//
const assert = require("assert");
const axios = require("axios");
const util = require("util");
const helpers = require("./helpers");
// set of status codes where we don't attempt reconnecting to Mastodon
const STATUS_CODES_TO_ABORT_ON = require("./settings").STATUS_CODES_TO_ABORT_ON;

const DEFAULT_REST_ROOT = "https://mastodon.social/api/v1/";

const required_for_user_auth = ["access_token"];

//
//  Tusk
//
const Tusk = function (config) {
    if (!(this instanceof Tusk)) {
        return new Tusk(config);
    }

    var self = this;
    var credentials = {
        access_token: config.access_token,
    };

    this.apiUrl = config.api_url || DEFAULT_REST_ROOT;

    this._validateConfigOrThrow(config);
    this.config = config;
    this._mastodon_time_minus_local_time_ms = 0;
};

Tusk.prototype.get = function (path, params, callback) {
    return this.request("GET", path, params, callback);
};

Tusk.prototype.post = function (path, params, callback) {
    return this.request("POST", path, params, callback);
};

Tusk.prototype.patch = function (path, params, callback) {
    return this.request("PATCH", path, params, callback);
};

Tusk.prototype.delete = function (path, params, callback) {
    return this.request("DELETE", path, params, callback);
};

Tusk.prototype.request = function (method, path, params, callback) {
    var self = this;
    assert(method == "GET" || method == "POST" || method == "PATCH" || method == "DELETE");
    // if no `params` is specified but a callback is, use default params
    if (typeof params === "function") {
        callback = params;
        params = {};
    }

    return new Promise(function (resolve, reject) {
        var _returnErrorToUser = function (err) {
            if (callback && typeof callback === "function") {
                callback(err, null, null);
            }
            reject(err);
        };

        self._buildReqOpts(method, path, params, function (err, reqOpts) {
            if (err) {
                _returnErrorToUser(err);
                return;
            }

            var mastoOptions = (params && params.masto_options) || {};

            process.nextTick(function () {
                // ensure all HTTP i/o occurs after the user has a chance to bind their event handlers
                self._doRestApiRequest(reqOpts, mastoOptions, method, function (err, parsedBody, resp) {
                    if (err) {
                        _returnErrorToUser(err);
                        return;
                    }
                    self._updateClockOffsetFromResponse(resp);

                    if (self.config.trusted_cert_fingerprints) {
                        if (!resp.socket.authorized) {
                            // The peer certificate was not signed by one of the authorized CA's.
                            var authErrMsg = resp.socket.authorizationError.toString();
                            var err = helpers.makeMastodonError("The peer certificate was not signed; " + authErrMsg);
                            _returnErrorToUser(err);
                            return;
                        }
                        var fingerprint = resp.socket.getPeerCertificate().fingerprint;
                        var trustedFingerprints = self.config.trusted_cert_fingerprints;
                        if (trustedFingerprints.indexOf(fingerprint) === -1) {
                            var errMsg = util.format(
                                "Certificate untrusted. Trusted fingerprints are: %s. Got fingerprint: %s.",
                                trustedFingerprints.join(","),
                                fingerprint
                            );
                            var err = new Error(errMsg);
                            _returnErrorToUser(err);
                            return;
                        }
                    }

                    if (callback && typeof callback === "function") {
                        callback(err, parsedBody, resp);
                    }

                    resolve({ data: parsedBody, resp: resp });
                    return;
                });
            });
        });
    });
};

Tusk.prototype._updateClockOffsetFromResponse = function (resp) {
    var self = this;
    if (resp && resp.headers && resp.headers.date && new Date(resp.headers.date).toString() !== "Invalid Date") {
        var mastodonTimeMs = new Date(resp.headers.date).getTime();
        self._mastodon_time_minus_local_time_ms = mastodonTimeMs - Date.now();
    }
};

/**
 * Builds and returns an options object ready to pass to Axios
 * @param  {String}   method      "GET", "POST", or "DELETE"
 * @param  {String}   path        REST API resource uri (eg. "statuses/destroy/:id")
 * @param  {Object}   params      user's params object
 * @returns {Undefined}
 *
 * Calls `callback` with Error, Object where Object is an options object ready to pass to Axios.
 *
 * Returns error raised (if any) by `helpers.moveParamsIntoPath()`
 */
Tusk.prototype._buildReqOpts = function (method, path, params, callback) {
    var self = this;
    if (!params) {
        params = {};
    }
    var finalParams = params;
    delete finalParams.masto_options;

    // the options object passed to `request` used to perform the HTTP request
    var reqOpts = {
        headers: {
            Accept: "*/*",
            "User-Agent": "tusk-mastodon-client",
            Authorization: "Bearer " + self.config.access_token,
        },
        gzip: true,
        encoding: null,
    };

    if (typeof self.config.timeout_ms !== "undefined") {
        reqOpts.timeout = self.config.timeout_ms;
    }

    try {
        // finalize the `path` value by building it using user-supplied params
        path = helpers.moveParamsIntoPath(finalParams, path);
    } catch (e) {
        callback(e, null, null);
        return;
    }

    if (path.match(/^https?:\/\//i)) {
        // This is a full url request
        reqOpts.url = path;
    } else {
        // This is a REST API request.
        reqOpts.url = this.apiUrl + path;
    }

    if (finalParams.file) {
        // If we're sending a file
        reqOpts.headers["Content-type"] = "multipart/form-data";
        reqOpts.formData = finalParams;
    } else {
        // Non-file-upload params should be url-encoded
        if (Object.keys(finalParams).length > 0) {
            reqOpts.url += this.formEncodeParams(finalParams);
        }
    }

    callback(null, reqOpts);
    return;
};

/**
 * Make HTTP request to Mastodon REST API.
 * @param  {Object}   reqOpts     options object for the Axios request
 * @param  {Object}   mastoOptions options object containing additional settings like maxRetries and retryDelay
 * @param  {String}   method      "GET", "POST", "PATCH", or "DELETE"
 * @param  {Function} callback    user's callback
 * @return {Undefined}
 */
Tusk.prototype._doRestApiRequest = async function (reqOpts, mastoOptions, method, callback) {
    const maxRetries = mastoOptions.maxRetries || 3;
    const retryDelay = mastoOptions.retryDelay || 1000; // in milliseconds

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await axios({
                method: method.toLowerCase(),
                url: reqOpts.url,
                headers: reqOpts.headers,
                data: reqOpts.formData,
                timeout: reqOpts.timeout,
                responseType: "json",
            });

            let body = response.data;

            if (typeof body === "object" && (body.error || body.errors)) {
                // we got a Mastodon API-level error response
                let err = helpers.makeMastodonError("Mastodon API Error");
                err.statusCode = response ? response.status : null;
                helpers.attachBodyInfoToError(err, body);
                callback(err, body, response);
                return;
            }

            // success case - no errors in HTTP response body
            callback(null, body, response);
            break; // exit the loop since request succeeded
        } catch (error) {
            let statusCode = error.response ? error.response.status : null;

            // Retry the request if the status code is not in the abort list
            if (attempt < maxRetries && (!statusCode || !STATUS_CODES_TO_ABORT_ON.includes(statusCode))) {
                await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
                continue;
            }

            let err = helpers.makeMastodonError("Request error");
            err.statusCode = statusCode;
            err.allErrors = [];
            if (error.response && error.response.data) {
                helpers.attachBodyInfoToError(err, error.response.data);
            }
            callback(err, error.response ? error.response.data : null, error.response);
            break; // exit the loop since max retries reached or status code is in the abort list
        }
    }
};

// the options object passed to `axios()` used to perform the HTTP request
Tusk.prototype.formEncodeParams = function (params, noQuestionMark) {
    var encoded = "";
    for (var key in params) {
        var value = params[key];
        if (encoded === "") {
            if (!noQuestionMark) {
                encoded = "?";
            }
        } else {
            encoded += "&";
        }

        if (Array.isArray(value)) {
            value.forEach(function (v) {
                encoded += encodeURIComponent(key) + "[]=" + encodeURIComponent(v) + "&";
            });
        } else {
            encoded += encodeURIComponent(key) + "=" + encodeURIComponent(value);
        }
    }

    return encoded;
};

Tusk.prototype.setAuth = function (auth) {
    var self = this;
    var configKeys = ["access_token"];

    // update config
    configKeys.forEach(function (k) {
        if (auth[k]) {
            self.config[k] = auth[k];
        }
    });
    this._validateConfigOrThrow(self.config);
};

Tusk.prototype.getAuth = function () {
    return this.config;
};

//
// Check that the required auth credentials are present in `config`.
// @param {Object}  config  Object containing credentials for REST API auth
//
Tusk.prototype._validateConfigOrThrow = function (config) {
    //check config for proper format
    if (typeof config !== "object") {
        throw new TypeError("config must be object, got " + typeof config);
    }

    if (typeof config.timeout_ms !== "undefined" && isNaN(Number(config.timeout_ms))) {
        throw new TypeError("Tusk config `timeout_ms` must be a Number. Got: " + config.timeout_ms + ".");
    }

    var auth_type = "user auth";
    var required_keys = required_for_user_auth;

    required_keys.forEach(function (req_key) {
        if (!config[req_key]) {
            var err_msg = util.format("Tusk config must include `%s` when using %s.", req_key, auth_type);
            throw new Error(err_msg);
        }
    });
};

module.exports = Tusk;
