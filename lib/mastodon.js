const axios = require("axios");
const helpers = require("./helpers");
const STATUS_CODES_TO_ABORT_ON = require("./settings").STATUS_CODES_TO_ABORT_ON;

const DEFAULT_REST_ROOT = "https://mastodon.social/api/v1/";
const REQUIRED_FOR_USER_AUTH = ["access_token"];

/**
 * Tusk class for interacting with the Mastodon API.
 */
class Tusk {
    /**
     * Create a new Tusk instance.
     * @param {Object} config - Configuration object.
     */
    constructor(config) {
        this._validateConfigOrThrow(config);
        this.config = config;
        this.apiUrl = config.api_url || DEFAULT_REST_ROOT;
        this._mastodon_time_minus_local_time_ms = 0;
    }

    /**
     * Make a PUT request to the Mastodon API.
     * @param {string} path - API endpoint path.
     * @param {Object} params - Request parameters.
     * @returns {Promise<Object>} - The API response.
     */
    async put(path, params = {}) {
        return this.request("PUT", path, params);
    }

    /**
     * Make a GET request to the Mastodon API.
     * @param {string} path - API endpoint path.
     * @param {Object} params - Request parameters.
     * @returns {Promise<Object>} - The API response.
     */
    async get(path, params = {}) {
        return this.request("GET", path, params);
    }

    /**
     * Make a POST request to the Mastodon API.
     * @param {string} path - API endpoint path.
     * @param {Object} params - Request parameters.
     * @returns {Promise<Object>} - The API response.
     */
    async post(path, params = {}) {
        return this.request("POST", path, params);
    }

    /**
     * Make a PATCH request to the Mastodon API.
     * @param {string} path - API endpoint path.
     * @param {Object} params - Request parameters.
     * @returns {Promise<Object>} - The API response.
     */
    async patch(path, params = {}) {
        return this.request("PATCH", path, params);
    }

    /**
     * Make a DELETE request to the Mastodon API.
     * @param {string} path - API endpoint path.
     * @param {Object} params - Request parameters.
     * @returns {Promise<Object>} - The API response.
     */
    async delete(path, params = {}) {
        return this.request("DELETE", path, params);
    }

    /**
     * Make a request to the Mastodon API.
     * @param {string} method - HTTP method.
     * @param {string} path - API endpoint path.
     * @param {Object} params - Request parameters.
     * @returns {Promise<Object>} - The API response.
     */
    async request(method, path, params = {}) {
        if (!["GET", "POST", "PATCH", "DELETE", "PUT"].includes(method)) {
            throw new Error(`Invalid HTTP method: ${method}`);
        }

        const reqOpts = await this._buildReqOpts(method, path, params);
        return this._doRestApiRequest(reqOpts, method);
    }

    /**
     * Get the client's authentication tokens.
     * @returns {Object} - The authentication tokens.
     */
    getAuth() {
        return {
            access_token: this.config.access_token,
        };
    }

    /**
     * Update the client's authentication tokens.
     * @param {Object} tokens - The new authentication tokens.
     */
    setAuth(tokens) {
        if (tokens && tokens.access_token) {
            this.config.access_token = tokens.access_token;
        } else {
            throw new Error("Invalid tokens: Must include access_token.");
        }
    }

    /**
     * Build request options for an API request.
     * @private
     * @param {string} method - HTTP method.
     * @param {string} path - API endpoint path.
     * @param {Object} params - Request parameters.
     * @returns {Promise<Object>} - The request options.
     */
    async _buildReqOpts(method, path, params) {
        const reqOpts = {
            headers: {
                Accept: "*/*",
                "User-Agent": "tusk-mastodon-client",
                Authorization: `Bearer ${this.config.access_token}`,
            },
            timeout: this.config.timeout_ms,
        };

        try {
            path = helpers.moveParamsIntoPath(params, path);
        } catch (e) {
            throw e;
        }

        reqOpts.url = path.startsWith("http") ? path : `${this.apiUrl}${path}`;

        if (params.file) {
            reqOpts.headers["Content-type"] = "multipart/form-data";
            reqOpts.formData = params;
        } else if (Object.keys(params).length > 0) {
            reqOpts.url += this.formEncodeParams(params);
        }

        return reqOpts;
    }

    /**
     * Perform the actual API request.
     * @private
     * @param {Object} reqOpts - Request options.
     * @param {string} method - HTTP method.
     * @returns {Promise<Object>} - The API response.
     */
    async _doRestApiRequest(reqOpts, method) {
        const maxRetries = 3;
        const retryDelay = 1000;

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

                const body = response.data;

                if (body.error || body.errors) {
                    const err = helpers.makeMastodonError("Mastodon API Error");
                    err.statusCode = response.status;
                    helpers.attachBodyInfoToError(err, body);
                    throw err;
                }

                return { data: body, resp: response };
            } catch (error) {
                const statusCode = error.response ? error.response.status : null;

                if (attempt < maxRetries && (!statusCode || !STATUS_CODES_TO_ABORT_ON.includes(statusCode))) {
                    await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
                    continue;
                }

                const err = helpers.makeMastodonError("Request error");
                err.statusCode = statusCode;
                if (error.response && error.response.data) {
                    helpers.attachBodyInfoToError(err, error.response.data);
                }
                throw err;
            }
        }
    }

    /**
     * URL-encode request parameters.
     * @param {Object} params - Request parameters.
     * @returns {string} - URL-encoded parameters.
     */
    formEncodeParams(params) {
        let encoded = "";
        for (const [key, value] of Object.entries(params)) {
            encoded += encoded ? "&" : "?";
            if (Array.isArray(value)) {
                value.forEach((v) => {
                    encoded += `${encodeURIComponent(key)}[]=${encodeURIComponent(v)}&`;
                });
            } else {
                encoded += `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
            }
        }
        return encoded;
    }

    /**
     * Validate the configuration object.
     * @private
     * @param {Object} config - Configuration object.
     */
    _validateConfigOrThrow(config) {
        if (typeof config !== "object") {
            throw new TypeError(`config must be object, got ${typeof config}`);
        }

        if (config.timeout_ms !== undefined && isNaN(Number(config.timeout_ms))) {
            throw new TypeError(`Tusk config timeout_ms must be a Number. Got: ${config.timeout_ms}.`);
        }

        REQUIRED_FOR_USER_AUTH.forEach((reqKey) => {
            if (!config[reqKey]) {
                throw new Error(`Tusk config must include ${reqKey} when using user auth.`);
            }
        });
    }
}

module.exports = Tusk;
