"use strict";
const {
        Transform
    } = require("stream"), {
        Buffer
    } = require("buffer"),
    cheerio = require("cheerio"),
    Promise = require("bluebird"),
    contentType = require("content-type");
class EntitiesExtractorStream extends Transform {
    constructor(options) {
        options.readableObjectMode = true;
        super(options);
        this.mappings = options.mappings || [];
        this.validContentTypes = options.validContentTypes || [];
    }

    _transform(chunk, encoding, callback) {
        const self = this;
        this
            .isValidChunk(chunk)
            .then((validChunk) => {
                return !validChunk ?
                    null : self
                        .getContentFromChunk(chunk)
                        .then((content) => {
                            return self.getItemsFromContent(content)
                                .then((items) => {
                                    return Promise
                                        .all(items.map((item) => {
                                            return self.transformItem(
                                                chunk,
                                                item);
                                        }));
                                })
                                .then((items) => {
                                    return self.filterItems(items);
                                });
                        });
            })
            .then((items) => {
                return callback(null, items);
            })
            .catch((err) => {
                callback(err);
            });
    }

    transformItem(chunk, item) {
        return Promise.resolve(item);
    }

    getItemsFromContent(content) {
        const self = this;
        return new Promise((resolve) => {
            const domContext = cheerio.load(content);
            const items = [];
            self.mappings.forEach(function(typeMapping) {
                domContext(typeMapping.selector)
                    .each(function(i, selectedItem) {
                        let outItem = {
                            "type": typeMapping.type
                        };
                        selectedItem = domContext(
                            selectedItem);
                        Object.getOwnPropertyNames(
                            typeMapping.properties)
                            .forEach(function(property) {
                                var rule =
                                    typeMapping.properties[
                                        property];
                                var value = null;
                                var ruleItem =
                                    selectedItem;
                                if (rule.selector) {
                                    ruleItem =
                                        domContext(
                                            rule.selector,
                                            selectedItem
                                        );
                                }
                                if (rule.from ===
                                    "attribute") {
                                    value =
                                        ruleItem.attr(
                                            rule.name
                                        );
                                } else if (rule.from ===
                                    "text") {
                                    value =
                                        ruleItem.text();
                                }
                                if (typeof(value) ===
                                    "string") {
                                    outItem[
                                        property
                                    ] =
                                        value;
                                }
                            });
                        items.push(outItem);
                    });
            });
            resolve(items);
        });
    }

    filterItems(items) {
        const self = this;
        return Promise.resolve(items.filter((item) => {
            return self.isValidItem(item);
        }));
    }

    isValidItem(item) {
        return item !== null;
    }

    isValidChunk(chunk) {
        const self = this;
        return new Promise((resolve) => {
            // we can't/don't need check content type we asume it's valid
            if (!self.validContentTypes.length || !chunk || !chunk
                .headers ||
                !chunk.headers["content-type"]) {
                return resolve(true);
            }
            resolve(self
                .validContentTypes
                .indexOf(
                    contentType
                        .parse(chunk.headers["content-type"].replace(
                            new RegExp(";$"), ""))
                        .type
                ) > -1
            );
        });
    }

    getContentFromChunk(chunk) {
        return new Promise((resolve) => {
            if (Buffer.isBuffer(chunk)) {
                return resolve(chunk.toString());
            }
            if (chunk.body) {
                return resolve(chunk.body);
            }
            resolve(chunk);
        });
    }
}


module.exports = EntitiesExtractorStream;
