/**
 * For each `/:param` fragment in path, move the value in params
 * at that key to path. If the key is not found in params, throw.
 *
 * @param  {Object} params  Object used to build path.
 * @param  {string} path   String to transform.
 * @return {string} Modified path
 */
exports.moveParamsIntoPath = (params, path) => {
    const rgxParam = /\/:(\w+)/g;

    return path.replace(rgxParam, (hit) => {
        const paramName = hit.slice(2);
        const suppliedVal = params[paramName];
        if (!suppliedVal) {
            throw new Error(`Mastodon: Params object is missing a required parameter for this request: ${paramName}`);
        }
        delete params[paramName];
        return `/${suppliedVal}`;
    });
};

/**
 * Attach error information from the response body to the error object.
 *
 * @param  {Error} err   Error instance to which body info will be attached.
 * @param  {Object} body JSON object that is the deserialized HTTP response body received from Mastodon.
 */
exports.attachBodyInfoToError = (err, body) => {
    err.mastodonReply = body;
    if (!body) return;

    err.allErrors = err.allErrors || []; // Ensure allErrors is an array

    if (body.error) {
        err.message = body.error;
        err.allErrors.push(body);
    } else if (body.errors && body.errors.length) {
        err.message = body.errors[0].message;
        err.code = body.errors[0].code;
        err.allErrors.push(...body.errors);
    }
};

/**
 * Create a new Mastodon error object.
 *
 * @param  {string} [message] Optional error message.
 * @return {Error} A new error object.
 */
exports.makeMastodonError = (message) => {
    const err = new Error(message || "");
    err.code = null;
    err.allErrors = [];
    err.mastodonReply = null;
    return err;
};
