"use strict";
const path = require("path"),
    Entities = require(path.join(__dirname, "entities")),
    urlModule = require("url");
class LinksExtractor extends Entities {
    constructor(options) {
        options = Object.assign({}, options || {});
        if (!options.mappings) {
            options.mappings = [];
        }
        options.mappings.push({
            "type": "links",
            "selector": "a",
            "properties": {
                "url": {
                    "from": "attribute",
                    "name": "href"
                },
                "anchor": {
                    "from": "text"
                },
                "rel": {
                    "from": "attribute",
                    "name": "rel"
                }
            }
        });
        super(options);
        this.onlyHttp = options.onlyHttp || false;
        this.uniqueUrl = options.uniqueUrl || false;
    }

    transformItem(chunk, item) {
        return super
            .transformItem(chunk, item)
            .then((link) => {
                if (link.type !== "links") {
                    return null;
                }
                delete link.type;
                link.dofollow = !link.rel || !link.rel.match(
                    new RegExp("\\bnofollow\\b", "i"));
                if (chunk.baseUrl && link.url) {
                    link.url = urlModule.resolve(chunk.baseUrl,
                        link.url);
                }
                delete link.rel;
                return link;
            });
    }

    filterItems(items) {
        const self = this;
        return super
            .filterItems(items)
            .then((items) => {
                if (!self.uniqueUrl) {
                    return items;
                }
                const uniqSet = new Set();
                return items.filter((item) => {
                    if (uniqSet.has(item.url)) {
                        return false;
                    }
                    uniqSet.add(item.url);
                    return true;
                });
            });
    }

    isValidItem(item) {
        if (!super.isValidItem(item)) {
            return false;
        }
        if (!this.onlyHttp) {
            return true;
        }
        try {
            const parsedUrl = urlModule.parse(item.url);
            if (!parsedUrl.protocol) {
                return false;
            }
            return parsedUrl.protocol === "http:" ||
                parsedUrl.protocol === "https:";
        } catch (err) {
            return false;
        }
    }

}



module.exports = LinksExtractor;
