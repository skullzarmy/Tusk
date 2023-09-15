import { expect, test, describe } from "bun:test";
import * as helpers from "../lib/helpers";

describe("Helpers for Mastodon API Wrapper", () => {
    describe("moveParamsIntoPath", () => {
        test("should replace path parameters with values from params object", () => {
            const params = { id: "123", user: "alice" };
            const path = "/posts/:id/user/:user";
            const newPath = helpers.moveParamsIntoPath(params, path);
            expect(newPath).toBe("/posts/123/user/alice");
        });

        test("should throw error when required parameter is missing", () => {
            const params = { id: "123" };
            const path = "/posts/:id/user/:user";
            expect(() => helpers.moveParamsIntoPath(params, path)).toThrow(
                "Mastodon: Params object is missing a required parameter for this request: `user`"
            );
        });
    });

    describe("attachBodyInfoToError", () => {
        test("should attach error info from body to error object", () => {
            const err = helpers.makeMastodonError(); // Ensure the error object is created using makeMastodonError
            const body = { error: "Something went wrong" };
            helpers.attachBodyInfoToError(err, body);
            expect(err.mastodonReply).toEqual(body);
            expect(err.message).toBe("Something went wrong");
        });

        test("should attach multiple error objects from body to error object", () => {
            const err = helpers.makeMastodonError(); // Ensure the error object is created using makeMastodonError
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
            const err = helpers.makeMastodonError(message);
            expect(err.message).toBe(message);
            expect(err.code).toBeNull();
            expect(err.allErrors).toEqual([]);
            expect(err.mastodonReply).toBeNull();
        });

        test("should create a Mastodon error without a message", () => {
            const err = helpers.makeMastodonError();
            expect(err.message).toBe("");
            expect(err.code).toBeNull();
            expect(err.allErrors).toEqual([]);
            expect(err.mastodonReply).toBeNull();
        });
    });
});
