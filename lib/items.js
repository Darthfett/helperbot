var mf = require('mineflayer');

var itemdb = mf.items;
var blockdb = mf.blocks;

module.exports = {
    lookupItemName: lookupItemName,
    lookupBlockName: lookupBlockName,
}

/**
  * lookupItemName takes a string name and a database mapping to item data.
  */
function lookupItemName(name, greedy, database) {
    if (database == null) {
        database = {};
        for (var it in itemdb) {
            database[it] = itemdb[it];
        }
        for (var block in blockdb) {
            database[block] = blockdb[block];

        }
    }
    if (greedy == null) {
        greedy = false;
    }
    function filter_using_comparator(name_parts, comparator) {
        var matches = [];

        // loop over all the items
        for (var key in database) {
            var item = database[key];

            // Skip any items without display names
            if (item.displayName == null) continue;

            var existing_name_parts = item.displayName.split(" ");
            var found_all_name_parts = true;
            for (var j = 0; j < name_parts.length; j++) {
                var item_name = name_parts[j];
                var found_name = false;
                for (var k = 0; k < existing_name_parts.length; k++) {
                    var existing_name = existing_name_parts[k];
                    if (comparator(existing_name, item_name)) {
                        found_name = true;
                        break;
                    }
                }
                if (!found_name) {
                    found_all_name_parts = false;
                    break;
                }
            }
            if (found_all_name_parts) {
                matches.push(item);
            }
        }
        return matches;
    }
    function searchForNameParts(name_parts) {
        var comparators = [
            function(s1, s2) { return s1.toLowerCase() === s2.toLowerCase(); },
            function(s1, s2) { return s1.toLowerCase().slice(0, s2.length) === s2.toLowerCase(); },
            function(s1, s2) { return s1.toLowerCase().indexOf(s2.toLowerCase()) !== -1; },
        ];
        var results = [];
        for (i = 0; i < comparators.length; i++) {
            var temp = filter_using_comparator(name_parts,comparators[i]);
            for (var j = 0; j < temp.length; j++) {
                results.push(temp[j]);
            }
            if (results.length !== 0 && !greedy) {
                return results;
            }
        }
        return results;
    }
    var name_parts = name.split(' ');
    var results = searchForNameParts(name_parts);
    if (results.length === 0) {
        // try stripping off any s to tolerate plurals
        var did_anything = false;
        for (var i = 0; i < name_parts.length; i++) {
            var part = name_parts[i];
            if (part.toLowerCase().slice(-1) === 's' && part.length > 1) {
                part = part.substr(0, part.length - 1);
                name_parts[i] = part;
                did_anything = true;
            }
        }
        if (did_anything) {
            results = searchForNameParts(name_parts);
        }
    }
    var number_or_words_results = [];
    if (! greedy) {
        if (results.length > 1) {
            // try to resolve ambiguity by number of words
            for (i = 0; i < results.length; i++) {
                var result = results[i];
                if (result.displayName.split(" ").length === name_parts.length) {
                    number_or_words_results.push(result);
                }
            }
        }
    }
    if (number_or_words_results.length === 1) {
        return number_or_words_results;
    }
    return results;
}

function lookupBlockName(name, greedy) {
    return lookupItemName(name, greedy, blockdb);
}
