"use strict";
const path = require("path"),
    assert = require("assert"),
    {
        LinksExtractor
    } = require(path.join(__dirname, "..")),
    testsUtil = require(path.join(__dirname, "util")),
    {
        PassThrough
    } = require("stream");

describe("LinksExtractor", () => {
    it("should extract absolute links from html", function(done) {
        testsUtil.getSampleFileContent("links-external.html", (
            err, content) => {
            if (err) {
                return;
            }
            const extractor = new LinksExtractor();
            let outputs = [];
            extractor.on("data", (data) => {
                outputs = data;
            });
            extractor.on("finish", () => {
                assert.deepEqual(outputs, [{
                    url: "http://www.iana.org/domains/example",
                    dofollow: true,
                    anchor: "More information..."
                },
                {
                    url: "http://www.iana.org/",
                    dofollow: false,
                    anchor: "Iana nofollow"
                },
                {
                    "anchor": "Iana NOFOLLOW",
                    "dofollow": false,
                    "url": "http://www.iana.org/"
                },
                {
                    "anchor": "Iana nofollowfake",
                    "dofollow": true,
                    "url": "http://www.iana.org/"
                }
                ]);
                done();
            });
            const input = new PassThrough();
            input.pipe(extractor);
            input.write(content);
            input.end();
        });
    });

    it("should resolve relative absolute links from html", function(
        done) {
        testsUtil.getSampleFileContent("links-internal.html", (
            err, content) => {
            if (err) {
                return;
            }
            const extractor = new LinksExtractor({
                "writableObjectMode": true
            });
            let outputs = [];
            extractor.on("data", (data) => {
                outputs = data;
            });

            extractor.on("finish", () => {
                assert.deepEqual(outputs, [{
                    url: "http://example.com/1.html",
                    dofollow: true,
                    anchor: "Article 1"
                },
                {
                    url: "http://example.com/2.html",
                    dofollow: true,
                    anchor: "Article 2"
                },
                {
                    "anchor": "External",
                    "dofollow": true,
                    "url": "http://example.com/"
                }
                ]);
                done();
            });
            const input = new PassThrough({
                "objectMode": true
            });
            input.pipe(extractor);
            input.write({
                "body": content,
                "baseUrl": "http://example.com"
            });
            input.end();
        });
    });

    it("should extract only http links from html", function(done) {
        testsUtil.getSampleFileContent("links-http.html", (
            err, content) => {
            if (err) {
                return;
            }
            const extractor = new LinksExtractor({
                "writableObjectMode": true,
                "onlyHttp": true
            });
            let outputs = [];
            extractor.on("data", (data) => {
                outputs = data;
            });

            extractor.on("finish", () => {
                assert.deepEqual(outputs, [{
                    url: "http://www.iana.org/domains/example",
                    anchor: "http",
                    dofollow: true
                },
                {
                    url: "https://www.iana.org/",
                    anchor: "https",
                    dofollow: true
                },
                {
                    url: "http://example.com/relative.html",
                    anchor: "relative",
                    dofollow: true
                }
                ]);
                done();
            });
            const input = new PassThrough({
                "objectMode": true
            });
            input.pipe(extractor);
            input.write({
                "body": content,
                "baseUrl": "http://example.com"
            });
            input.end();
        });
    });
});
