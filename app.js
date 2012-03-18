/*jslint continue: false, plusplus: false, bitwise: true, plusplus: true,
  newcap: true, maxerr: 50, indent: 4, undef: true, nomen: true, sloppy: true */

var items;
var nextId = 0;
var maxItems = 8;
var startColor = [255, 0, 0];
var endColor = [230, 230, 0];

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
    if (!item.done) {
        item.done = [];
    }
    item.done.push(Math.round(Date.now() / 1000));
    item.due = Math.round(Date.now() / 1000 + item.interval);
    _.defer(displayItems);
    _.defer(save);
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

// Check if a given item is due to be done sometime today.
function due_today(item) {
    var today = new Date();
    today.setHours(23);
    today.setMinutes(59);
    today.setSeconds(59);
    var compare = Math.floor(today.getTime() / 1000);
    return due(item) < compare;
}

// Check if a given item is due to be done.
function due_now(item) {
    var compare = Math.round(Date.now() / 1000);
    return due(item) < compare;
}

function expand() {
    var par, el;
    par = $(this);
    el = par.children('.extra');
    if (!el.is(':visible')) {
        $('.extraVisible').hide()
            .removeClass('extraVisible');

        $('.expanded').css('margin', '0px')
            .css('-webkit-box-shadow', 'none')
            .removeClass('.expanded');

        el.show()
            .addClass('extraVisible');

        par.css('margin', '10px 0px 10px 0px')
            .css('-webkit-box-shadow', '0px 0px 5px #444')
            .addClass('expanded');
    } else {
        el.hide()
            .removeClass('extraVisible');

        par.css('margin', '')
            .css('-webkit-box-shadow', '')
            .removeClass('expanded');
    }
}

function color(start, end, pct) {
    var res, i;
    res = [];

    pct = (pct < 0.0) ? 0.0 : pct;
    pct = (pct > 1.0) ? 1.0 : pct;

    for (i = 0; i < 3; i++) {
        res.push(Math.round(start[i] + (end[i] - start[i]) * pct));
    }
    return "rgb(" + res.join(',') + ")";
}

function moreItems() {
    maxItems *= 2;
    displayItems();
}

function addItems(items, start, end) {
    var now, el, el2, d1, ns, ndue = 0, nfuture = 0, ci = 0;

    if (maxItems === items.length - 1) {
        maxItems++;
    }

    // Calculate the number of shades to use
    ns = (items.length <= maxItems) ? items.length : maxItems + 1;
    // Never use less than four shades
    ns = (ns < 4) ? 4 : ns;

    $('#items-due').empty();
    $('#items-future').empty();
    now = Math.round(Date.now() / 1000);
    _.each(items.slice(0, maxItems), function (item, index) {
        var check, extra, tmp;

        d1 = $(document.createElement('div'));
        d1.css('background-color', color(start, end, ci++ / ns));

        el = $('<div>' + index + '</div>');
        el.addClass('index');
        d1.append(el);

        if (due_today(item)) {
            check = '&#x2610;'; // ☐
        } else {
            check = '&#x2611;'; // ☑
        }
        el = $('<span>' + check + ' ' + item.description + '</span>');
        el.addClass('description');
        d1.append(el);

        el2 = $(document.createElement('div'));
        el2.addClass('extra');
        d1.append(el2);

        extra = 'Due ' + moment(due(item) * 1000).fromNow() + '.';
        if (item.done && item.done.length > 0) {
            tmp = item.done.slice(0).reverse().slice(0, 3);
            extra += ' Done ' + _.map(tmp, function (x) { return moment(1000 * x).fromNow(); }).join(', ');
            if (item.done.length > 3) {
                extra += ', &#x2026;'; // …
            } else {
                extra += '.';
            }
        }
        el = $('<div>' + extra + '</div>');
        el.addClass('when');
        el2.append(el);

        el = $('<button>&#x2713; Done</button>'); // ✓ Done
        el.attr('data-id', item.id);
        el.addClass('button-done');
        el.click(markDone);
        el2.append(el);

        el = $('<button>&#x2717; Delete</button>'); // ✗ Delete
        el.attr('data-id', item.id);
        el.addClass('button-delete');
        el.click(deleteItem);
        el2.append(el);

        d1.addClass('item');
        d1.click(expand);

        if (due_now(item)) {
            $('#items-due').append(d1);
            ndue++;
        } else {
            $('#items-future').append(d1);
            nfuture++;
        }
    });

    if (items.length > maxItems) {
        d1 = $(document.createElement('div'));
        d1.css('background-color', color(start, end, ci++ / ns));
        d1.addClass('item');
        d1.click(moreItems);

        el = $('<span>&#x21bb; Show ' + (items.length - maxItems) + ' more items</span>');
        el.addClass('description');
        d1.append(el);
        $('#items-future').append(d1);
    }

    $('#new').css('background-color', color(start, end, ci++ / ns));
}

// Display the list of items.
function displayItems() {
    var itemlist = _.sortBy(_.values(items), due);
    addItems(itemlist, startColor, endColor);
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
