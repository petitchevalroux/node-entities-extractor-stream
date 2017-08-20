"use strict";
const path = require("path"),
    fs = require("fs"),
    {
        Buffer
    } = require("buffer");

module.exports = {
    "getSampleFileContent": (file, callback) => {
        fs.readFile(path.join(__dirname, "samples", file), (err,
            content) => {
            if (err) {
                return callback(err);
            }
            if (Buffer.isBuffer(content)) {
                content = content.toString();
            }
            callback(null, content);
        });
    }
};
