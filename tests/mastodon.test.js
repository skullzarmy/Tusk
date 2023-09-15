import { expect, test, describe, mock } from "bun:test";
import Tusk from "../lib/mastodon";

// Mocking axios functions
const axiosGetMock = mock();
const axiosPostMock = mock();

// Manually replace axios calls in Tusk with our mocks
Tusk.prototype.get = axiosGetMock;
Tusk.prototype.post = axiosPostMock;

describe("Tusk Mastodon API Wrapper", () => {
    test("Tusk instance creation", () => {
        const tusk = new Tusk({ access_token: "sample_token" });
        expect(tusk).toBeInstanceOf(Tusk);
    });

    test("Tusk default API URL", () => {
        const tusk = new Tusk({ access_token: "sample_token" });
        expect(tusk.apiUrl).toBe("https://mastodon.social/api/v1/");
    });

    test("Tusk custom API URL", () => {
        const tusk = new Tusk({ access_token: "sample_token", api_url: "https://custom.url/api/v1/" });
        expect(tusk.apiUrl).toBe("https://custom.url/api/v1/");
    });

    test("Tusk GET request", async () => {
        axiosGetMock.mockReturnValueOnce({ data: {}, headers: {}, status: 200 });
        const tusk = new Tusk({ access_token: "sample_token" });
        const response = await tusk.get("statuses");
        expect(response.data).toEqual({});
        expect(axiosGetMock).toHaveBeenCalled();
        expect(axiosGetMock).toHaveBeenCalledTimes(1);
    });

    test("Tusk POST request", async () => {
        axiosPostMock.mockReturnValueOnce({ data: {}, headers: {}, status: 200 });
        const tusk = new Tusk({ access_token: "sample_token" });
        const response = await tusk.post("statuses", { status: "Hello Mastodon!" });
        expect(response.data).toEqual({});
        expect(axiosPostMock).toHaveBeenCalled();
        expect(axiosPostMock).toHaveBeenCalledTimes(1);
    });

    // ... Add more tests for PATCH, DELETE, and other methods ...

    test("Tusk formEncodeParams", () => {
        const tusk = new Tusk({ access_token: "sample_token" });
        const encoded = tusk.formEncodeParams({ key1: "value1", key2: "value2" });
        expect(encoded).toBe("?key1=value1&key2=value2");
    });

    // ... Add more tests for other utility methods ...
});
