/**
 * Defines an array of HTTP status codes that the application should not attempt to reconnect to Mastodon on.
 * @type {number[]}
 */
exports.STATUS_CODES_TO_ABORT_ON = [400, 401, 403, 404, 406, 410, 422];
