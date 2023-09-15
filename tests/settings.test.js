import { expect, test } from "bun:test";
import { STATUS_CODES_TO_ABORT_ON } from "../lib/settings"; // Assuming the file is in the `lib` directory

test("STATUS_CODES_TO_ABORT_ON should contain expected status codes", () => {
    const expectedStatusCodes = [400, 401, 403, 404, 406, 410, 422];
    expect(STATUS_CODES_TO_ABORT_ON).toEqual(expectedStatusCodes);
});
