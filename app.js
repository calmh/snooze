/*jslint continue: false, plusplus: false, bitwise: true, plusplus: true,
  newcap: true, maxerr: 50, indent: 4, undef: true, nomen: true, sloppy: true */

var items;
var nextId = 0;
var animation = 150;

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

function expand() {
    var par, el;
    par = $(this);
    el = par.children('.extra');
    if (el.is(':visible')) {
        el.slideUp(animation);
    } else {
        $('.extra').hide(animation);
        el.slideDown(animation);
    }
}

function color(start, end, pct) {
    var res, i;
    res = [];
    for (i = 0; i < 3; i++) {
        res.push(Math.round(start[i] + (end[i] - start[i]) * pct));
    }
    return 'rgb(' + res.join(',') + ')';
}

function addItems(items, div, start, end) {
    div.empty();
    _.each(items, function (item, index) {
        d1 = $(document.createElement('div'));
        d1.css('background-color', color(start, end, index/items.length));

        el = $('<div>' + index + '</div>');
        el.addClass('index');
        el.css('color', color(start, end, (index + 1)/items.length));
        d1.append(el);

        el = $('<span>' + item.description + '</span>');
        el.addClass('description');
        d1.append(el);

        el2 = $(document.createElement('div'));
        el2.addClass('extra');
        el2.hide();
        d1.append(el2);

        el = $('<div>Due ' + moment(due(item) * 1000).fromNow() + '</span>');
        el.addClass('when');
        el2.append(el);

        el = $('<button>Done</button>');
        el.attr('data-id', item.id);
        el.addClass('button-done');
        el.click(markDone);
        el2.append(el);

        el = $('<button>Delete</button>');
        el.attr('data-id', item.id);
        el.addClass('button-delete');
        el.click(deleteItem);
        el2.append(el);

        d1.addClass('item');
        d1.click(expand);

        div.append(d1);
    });
}

// Display the list of items.
function displayItems() {
    var now, remaining, el, el2, d1;

    now = Math.round(Date.now() / 1000);

/*
 * Use two lists. This turned out to be less pleasing.
    itemlist = _.groupBy(_.sortBy(_.values(items), due), function (i) { return due(i) < now });
    addItems(itemlist[true], $('#items-due'), [255, 0, 0], [220, 220, 0]);
    addItems(itemlist[false], $('#items-future'), [160, 160, 220], [0, 0, 240]);
*/
    itemlist = _.sortBy(_.values(items), due);
    addItems(itemlist, $('#items-due'), [255, 0, 0], [220, 220, 0]);
}

function calculateNextId() {
    var changed;
    _.each(items, function (item, id) {
        nextId = id >= nextId ? id + 1 : nextId;
    });
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
