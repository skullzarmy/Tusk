import { expect, test, describe, beforeEach } from "bun:test";
import * as helpers from "../lib/helpers";

describe("Helpers for Mastodon API Wrapper", () => {
    let params, path, err;

    beforeEach(() => {
        params = { id: "123", user: "alice" };
        path = "/posts/:id/user/:user";
        err = helpers.makeMastodonError();
    });

    describe("moveParamsIntoPath", () => {
        test("should replace path parameters with values from params object", () => {
            const newPath = helpers.moveParamsIntoPath(params, path);
            expect(newPath).toBe("/posts/123/user/alice");
        });

        test("should throw error when required parameter is missing", () => {
            delete params.user;
            expect(() => helpers.moveParamsIntoPath(params, path)).toThrow(
                "Mastodon: Params object is missing a required parameter for this request: user"
            );
        });
    });

    describe("attachBodyInfoToError", () => {
        test("should attach error info from body to error object", () => {
            const body = { error: "Something went wrong" };
            helpers.attachBodyInfoToError(err, body);
            expect(err.mastodonReply).toEqual(body);
            expect(err.message).toBe("Something went wrong");
        });

        test("should handle null body gracefully", () => {
            helpers.attachBodyInfoToError(err, null);
            expect(err.mastodonReply).toBeNull();
            expect(err.message).toBe("");
        });

        test("should attach multiple error objects from body to error object", () => {
            const body = {
                errors: [
                    { message: "Error 1", code: 101 },
                    { message: "Error 2", code: 102 },
                ],
            };
            helpers.attachBodyInfoToError(err, body);
            expect(err.mastodonReply).toEqual(body);
            expect(err.message).toBe("Error 1");
            expect(err.code).toBe(101);
            expect(err.allErrors).toEqual(body.errors);
        });
    });

    describe("makeMastodonError", () => {
        test("should create a Mastodon error with provided message", () => {
            const message = "Custom error message";
            const customErr = helpers.makeMastodonError(message);
            expect(customErr.message).toBe(message);
            expect(customErr.code).toBeNull();
            expect(customErr.allErrors).toEqual([]);
            expect(customErr.mastodonReply).toBeNull();
        });

        test("should create a Mastodon error without a message", () => {
            expect(err.message).toBe("");
            expect(err.code).toBeNull();
            expect(err.allErrors).toEqual([]);
            expect(err.mastodonReply).toBeNull();
        });
    });
});
