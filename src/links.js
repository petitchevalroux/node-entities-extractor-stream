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

}



module.exports = LinksExtractor;
