"use strict";
const {
        Transform
    } = require("stream"), {
        Buffer
    } = require("buffer"),
    cheerio = require("cheerio"),
    Promise = require("bluebird");
class EntitiesExtractorStream extends Transform {
    constructor(options) {
        options.readableObjectMode = true;
        super(options);
        this.mappings = options.mappings || [];
    }

    _transform(chunk, encoding, callback) {
        let body = "";
        if (Buffer.isBuffer(chunk)) {
            body = chunk.toString();
        } else if (chunk.body) {
            body = chunk.body;
        } else {
            body = chunk;
        }
        const self = this;
        this.getItemsFromContent(body, (err, items) => {
            if (err) {
                return callback(err);
            }
            Promise
                .all(items.map((item) => {
                    return self.transformItem(chunk, item);
                }))
                .then((items) => {
                    return self.filterItems(items);
                })
                .then((items) => {
                    callback(null, items);
                    return items;
                })
                .catch((err) => {
                    callback(err);
                });
        });
    }

    transformItem(chunk, item) {
        return Promise.resolve(item);
    }

    getItemsFromContent(content, callback) {
        try {
            const domContext = cheerio.load(content);
            const items = [];
            this.mappings.forEach(function(typeMapping) {
                domContext(typeMapping.selector)
                    .each(function(i, selectedItem) {
                        let outItem = {
                            "type": typeMapping.type
                        };
                        selectedItem = domContext(selectedItem);
                        Object.getOwnPropertyNames(typeMapping.properties)
                            .forEach(function(property) {
                                var rule = typeMapping.properties[
                                    property];
                                var value = null;
                                var ruleItem = selectedItem;
                                if (rule.selector) {
                                    ruleItem = domContext(
                                        rule.selector,
                                        selectedItem
                                    );
                                }
                                if (rule.from ===
                                    "attribute") {
                                    value = ruleItem.attr(
                                        rule.name);
                                } else if (rule.from ===
                                    "text") {
                                    value = ruleItem.text();
                                }
                                if (typeof(value) ===
                                    "string") {
                                    outItem[property] =
                                        value;
                                }
                            });
                        items.push(outItem);
                    });
            });
            callback(null, items);
        } catch (err) {
            callback(err);
        }
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

}


module.exports = EntitiesExtractorStream;
