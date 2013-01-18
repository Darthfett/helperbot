var itemdb = require('mineflayer').items;

/**
  * lookupItemName takes a string name and a database mapping to item data.
  */
function lookupItemName(name, database) {
    if (database == undefined) {
        database = itemdb;
    }

    function filter_using_comparator(name_parts, comparator) {
        var matches = [];

        // loop over all the items
        for (i in database) {
            var item = database[i];
            if (item.displayName === undefined) {
                continue;
            }
            var existing_name_parts = item.displayName.split(" ");
            var found_all_name_parts = true;
            for (j = 0; j < name_parts.length; j++) {
                var item_name = name_parts[j];
                var found_name = false;
                for (k = 0; k < existing_name_parts.length; k++) {
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
            function(s1, s2) { return s1.toLowerCase() == s2.toLowerCase(); },
            function(s1, s2) { return s1.slice(0, s2.length).toLowerCase() == s2.toLowerCase(); },
            function(s1, s2) { return s1.toLowerCase().indexOf(s2.toLowerCase()) != -1; },
        ];
        var results = [];
        for (i = 0; i < comparators.length; i++) {
            var temp = filter_using_comparator(name_parts, comparators[i]);
            for (j = 0; j < temp.length; j++) {
                results.push(temp[j]);
            }
            if (results.length !== 0) {
                return results;
            }
        }
        return results;
    }
    var name_parts = name.split(' ');
    var results = searchForNameParts(name_parts);

    var number_or_words_results = [];

    if (results.length > 1) {
        // try to resolve ambiguity by number of words
        for (i = 0; i < results.length; i++) {
            var result = results[i];
            if (result.displayName.split(' ').length === name_parts.length) {
                number_or_words_results.push(result);
            }
        }
    }

    if (number_or_words_results.length === 1) {
        return number_or_words_results;
    }
    return results;
}

exports.lookupItemName = lookupItemName;
