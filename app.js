/*jslint continue: false, plusplus: false, bitwise: true, plusplus: true,
  newcap: true, maxerr: 50, indent: 4, undef: true, nomen: true, sloppy: true */

var items;
var nextId = 0;

// Create a new item from information in the form section.
function newItem() {
    var item, id;
    item = {};
    id = nextId++;
    item.id = id;
    item.description = $('#newDescription').val();
    item.interval = parseInt($('#newInterval option:selected').val(), 10) * 86400;
    item.done = [];
    items[id] = item;
    $('#newDescription').val('');

    _.defer(displayItems);
    _.defer(save);
}

// Save items to local storage.
function save() {
    localStorage.setItem('items', JSON.stringify(items));
}

// Mark an item as done.
function markDone() {
    var id, item;
    id = $(this).attr('data-id');
    item = items[id];
    if (confirm('Mark "' + item.description + '" as done for this interval?')) {
        if (!item.done) {
            item.done = [];
        }
        item.done.push(Math.round(Date.now() / 1000));
        item.due = Math.round(Date.now() / 1000 + item.interval);
        _.defer(displayItems);
        _.defer(save);
    }
}

// Delete an item.
function deleteItem() {
    var id;
    id = $(this).attr('data-id');
    if (confirm('Delete "' + items[id].description + '"?')) {
        delete items[id];
        _.defer(displayItems);
        _.defer(save);
    }
}

// Calculate when a given item is due to be done.
function due(item) {
    if (!item.done || item.done.length < 1) {
        return Math.round(Date.now() / 1000) - item.interval;
    } else {
        return _.last(item.done) + item.interval;
    }
}

// Display the list of items.
function displayItems() {
    var div, now, remaining, el, el2, d1;
    div = $('#items');
    div.empty();

    now = Math.round(Date.now() / 1000);
    itemlist = _.sortBy(_.values(items), due);
    _.each(itemlist, function (item, index) {
        remaining = due(item) - now;
        d1 = $(document.createElement('div'));

        el = $('<div>' + index + '</div>');
        el.addClass('index');
        d1.append(el);

        el = $('<span>' + item.description + '</span>');
        el.addClass('description');
        d1.append(el);

        el = $('<span> ' + moment(due(item) * 1000).fromNow() + '</span>');
        el.addClass('when');
        d1.append(el);

        el2 = $(document.createElement('div'));
        el2.addClass('buttons');
        d1.append(el2);

        el = $('<button>Done!</button>');
        el.attr('data-id', item.id);
        el.click(markDone);
        el2.append(el);

        el = $('<button>Delete</button>');
        el.attr('data-id', item.id);
        el.click(deleteItem);
        el2.append(el);

        d1.addClass('item');

        if (remaining < 0) {
            d1.addClass('overdue');
        } else if (remaining < item.interval / 7) {
            d1.addClass('due');
        }

        if (index % 2 === 0) {
            d1.addClass('even');
        } else {
            d1.addClass('odd');
        }

        div.append(d1);
    });
}

function calculateNextId() {
    var changed;
    _.each(items, function (item, id) {
        nextId = id >= nextId ? id + 1 : nextId;

        // Schema upgrade, remove 'due'
        if (item.due) {
            changed = true;
            if (!item.done) {
                item.done = [ item.due - item.interval ];
            }
            item.due = undefined;
        }
    });

    if (changed) {
        _.defer(save);
    }
}

$(document).ready(function () {
    $('#newAdd').click(newItem);

    items = JSON.parse(localStorage.getItem('items'));
    if (!items) {
        items = {};
    }

    _.defer(displayItems);
    _.defer(calculateNextId);
});
