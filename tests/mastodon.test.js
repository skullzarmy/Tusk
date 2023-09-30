import { expect, test, describe, mock, beforeEach } from "bun:test";
import Tusk from "../lib/mastodon";

// Mocking axios functions
const axiosGetMock = mock();
const axiosPostMock = mock();
const axiosPutMock = mock();

// Manually replace axios calls in Tusk with our mocks
Tusk.prototype.get = axiosGetMock;
Tusk.prototype.post = axiosPostMock;
Tusk.prototype.put = axiosPutMock;

describe("Tusk Mastodon API Wrapper", () => {
    let tusk;

    beforeEach(() => {
        tusk = new Tusk({ access_token: "sample_token" });
    });

    test("Tusk instance creation", () => {
        expect(tusk).toBeInstanceOf(Tusk);
    });

    test("Tusk default API URL", () => {
        expect(tusk.apiUrl).toBe("https://mastodon.social/api/v1/");
    });

    test("Tusk custom API URL", () => {
        const customTusk = new Tusk({ access_token: "sample_token", api_url: "https://custom.url/api/v1/" });
        expect(customTusk.apiUrl).toBe("https://custom.url/api/v1/");
    });

    test("Tusk GET request", async () => {
        axiosGetMock.mockReturnValueOnce({ data: {}, headers: {}, status: 200 });
        const response = await tusk.get("statuses");
        expect(response.data).toEqual({});
        expect(axiosGetMock).toHaveBeenCalled();
        expect(axiosGetMock).toHaveBeenCalledTimes(1);
    });

    test("Tusk POST request", async () => {
        axiosPostMock.mockReturnValueOnce({ data: {}, headers: {}, status: 200 });
        const response = await tusk.post("statuses", { status: "Hello Mastodon!" });
        expect(response.data).toEqual({});
        expect(axiosPostMock).toHaveBeenCalled();
        expect(axiosPostMock).toHaveBeenCalledTimes(1);
    });

    test("Tusk PUT request", async () => {
        axiosPutMock.mockReturnValueOnce({ data: {}, headers: {}, status: 200 });
        const response = await tusk.put("statuses/1", { status: "Updated status!" });
        expect(response.data).toEqual({});
        expect(axiosPutMock).toHaveBeenCalled();
        expect(axiosPutMock).toHaveBeenCalledTimes(1);
    });

    test("Tusk formEncodeParams", () => {
        const encoded = tusk.formEncodeParams({ key1: "value1", key2: "value2" });
        expect(encoded).toBe("?key1=value1&key2=value2");
    });

    test("Tusk request with invalid HTTP method", async () => {
        try {
            await tusk.request("INVALID", "statuses");
        } catch (e) {
            expect(e.message).toBe("Invalid HTTP method: INVALID");
        }
    });

    test("Tusk request with API error", async () => {
        axiosGetMock.mockRejectedValueOnce(new Error("Mastodon API Error"));
        try {
            await tusk.get("statuses");
        } catch (e) {
            expect(e.message).toBe("Mastodon API Error");
        }
    });
});
