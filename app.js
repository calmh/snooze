/*jslint continue: false, plusplus: false, bitwise: true, plusplus: true,
  newcap: true, maxerr: 50, indent: 4, undef: true, nomen: true, sloppy: true */

var items;
var lastSaveDate;
var nextId = 0;
var maxItems = 8;
var startColor = [255, 0, 0];
var endColor = [230, 230, 0];
var itemTemplate;
var moreItemsTemplate;
var SNOOZE_VERSION = 'no_version'; // To be set by deploydata.js
var SNOOZE_DATE = 'not_deployed'; // To be set by deploydata.js

// Create a new item from information in the form section.
function newItem() {
    var item, id, descr;

    descr = $('#newDescription').val();
    descr = descr.replace(/^\s+/, '').replace(/\s+$/, '');
    if (descr.length === 0) {
        alert('Enter a description to add a new item.');
    } else {
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
}

// Save items to local storage.
function save() {
    lastSaveDate = Math.round(Date.now() / 1000);
    localStorage.setItem('items', JSON.stringify(items));
    localStorage.setItem('lastSaveDate', lastSaveDate);
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
    var now, rendered, ci = 0;

    if (maxItems === items.length - 1) {
        maxItems++;
    }

    // Calculate the number of shades to use
    ns = (items.length <= maxItems) ? items.length : maxItems + 1;
    // Never use less than four shades
    ns = (ns < 4) ? 4 : ns;

    // Add each item to the list.
    $('#items').empty();
    now = Math.round(Date.now() / 1000);
    _.each(items.slice(0, maxItems), function (item, index) {
        var check, extra, params = {};

        params.background = color(start, end, ci++ / ns);
        params.check = due_today(item) ? 'icon-cog' : 'icon-ok';
        params.description = item.description;
        params.id = item.id;
        params.index = index;

        if (due_now(item)) {
            params.descr_class = 'due';
        } else {
            params.descr_class = 'not_due';
        }

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
        params.extra = extra;

        rendered = $(itemTemplate(params));
        rendered.click(expand);

        $('#items').append(rendered);
    });

    // Bind button events.
    $('.button-done').click(markDone);
    $('.button-delete').click(deleteItem);

    // If necessary, add the "Show more items" item.
    if (items.length > maxItems) {
        rendered = $(moreItemsTemplate({
            background: color(start, end, ci++ / ns),
            items: Math.min(items.length, maxItems * 2) - maxItems
        }));
        rendered.click(moreItems);
        $('#items').append(rendered);
    }

    if (ci > 0) {
        // Set the background of the "Add new item" panel so it matches the list.
        $('#new').css('background-color', color(start, end, ci++ / ns));
    }
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

function showDebugInformation() {
    $('#debugVersion').text(SNOOZE_VERSION);
    $('#debugDate').text(SNOOZE_DATE);
    $('#debugNumItems').text(_.size(items).toString());
    $('#debugItemsSize').text(JSON.stringify(items).length.toString() + ' chars');
    if (lastSaveDate) {
        $('#debugLastSave').text(new Date(1000 * lastSaveDate).toString());
    }
    $('#debugInformation').show();
}

function itemsFsck(oldItems) {
    var newItems = {};
    var values = _.values(oldItems);
    _.each(values, function (val, idx) {
        if (val && val.description) {
            val.id = idx;
            val.description = val.description.replace(/^\s+/, '').replace(/\s+$/, '');
            newItems[idx] = val;
            idx++;
        }
    });
    return newItems;
}

$(document).ready(function () {
    // Enforce home screen installation on iDevices.
    if (window.navigator.userAgent.match(/iPhone|iPad/) && !window.navigator.standalone == true) {
        $('#addToHomeScreen').show();
        $('#app').hide();
        return;
    }

    $('#newAdd').click(newItem);

    items = itemsFsck(JSON.parse(localStorage.getItem('items')));
    lastSaveDate = JSON.parse(localStorage.getItem('lastSaveDate'));

    itemTemplate = _.template(document.getElementById('item-template').innerHTML);
    moreItemsTemplate = _.template(document.getElementById('moreItems-template').innerHTML);

    // Display all items.
    _.defer(displayItems);

    if (navigator.userAgent.match(/mobile/i)) {
        // Hide the address bar, if we have enough content to fill the screen
        // and it's currently visible.
        _.defer(function () {
            window.scrollTo(0,1);
        });
    }

    // Set the next item id.
    _.defer(calculateNextId);

    // Show debug information when user shakes device.
    window.addEventListener('shake', showDebugInformation, false);
    // Hide it when clicked.
    $('#debugInformation').click(function() { $('#debugInformation').hide(); });
});
