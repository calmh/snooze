/*jslint continue: false, bitwise: true, plusplus: true, newcap: true, maxerr: 50, indent: 4,
  nomen: true, sloppy: true, browser: true */
/*global _: false, $: false, alert: false, moment: false, confirm: false */

var items;
var lastSaveDate;
var nextId = 0;
var maxItems = 8;
var itemTemplate;
var moreItemsTemplate;
var SNOOZE_VERSION = 'no_version'; // To be set by deploydata.js
var SNOOZE_DATE = 'not_deployed'; // To be set by deploydata.js

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
    var today, compare;

    today = new Date();
    today.setHours(23);
    today.setMinutes(59);
    today.setSeconds(59);

    compare = Math.floor(today.getTime() / 1000);

    return due(item) < compare;
}

// Check if a given item is due to be done.
function due_now(item) {
    var compare = Math.round(Date.now() / 1000);
    return due(item) < compare;
}

function expandItemView() {
    var clicked = $(this);
    if (clicked.children('.extra').is(':visible')) {
        clicked.removeClass('expanded');
    } else {
        $('.expanded').removeClass('expanded');
        clicked.addClass('expanded');
    }
}

function showMoreItems() {
    maxItems *= 2;
    displayItems();
}

// Display the list of items.
function displayItems() {
    var now, rendered, itemlist;

    itemlist = _.sortBy(_.values(items), due);

    if (maxItems === itemlist.length - 1) {
        maxItems++;
    }

    $('#items').empty();
    now = Math.round(Date.now() / 1000);

    // Add each item to the list.
    _.each(itemlist.slice(0, maxItems), function (item, index) {
        var params = {}, tmp;

        params.check = due_today(item) ? 'icon-cog' : 'icon-ok';
        params.descr_class = due_now(item) ? 'due' : 'not_due';
        params.description = item.description;
        params.id = item.id;
        params.index = index;

        params.extra = 'Due ' + moment(due(item) * 1000).fromNow() + '.';
        if (item.done && item.done.length > 0) {
            tmp = item.done.slice(0).reverse().slice(0, 3);
            params.extra += ' Done ' + _.map(tmp, function (x) { return moment(1000 * x).fromNow(); }).join(', ');
            if (item.done.length > 3) {
                params.extra += ', &#x2026;'; // …
            } else {
                params.extra += '.';
            }
        }

        rendered = $(itemTemplate(params));
        rendered.click(expandItemView);

        $('#items').append(rendered);
    });

    // Bind button events.
    $('.button-done').click(markDone);
    $('.button-delete').click(deleteItem);

    if (itemlist.length > maxItems) {
        // Add the "Show more items" item.
        rendered = $(moreItemsTemplate({
            items: Math.min(itemlist.length, maxItems * 2) - maxItems
        }));
        rendered.click(showMoreItems);
        $('#items').append(rendered);
    }
}

// Save items to local storage.
function save() {
    lastSaveDate = Math.round(Date.now() / 1000);
    localStorage.setItem('items', JSON.stringify(items));
    localStorage.setItem('lastSaveDate', lastSaveDate);
}

// Delete an item.
function deleteItem() {
    var id = $(this).attr('data-id');

    if (confirm('Delete "' + items[id].description + '"?')) {
        delete items[id];
        _.defer(displayItems);
        _.defer(save);
    }
}

// Create a new item from information in the form section.
function newItem() {
    var item, id, descr;

    descr = $('#newDescription').val();
    descr = descr.replace(/^\s+/, '').replace(/\s+$/, '');

    if (descr.length === 0) {
        alert('Enter a description to add a new item.');
        throw new Error('Adding item without description');
    }

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

// Mark an item as done.
function markDone() {
    var id = $(this).attr('data-id');

    items[id].done.push(Math.round(Date.now() / 1000));

    _.defer(displayItems);
    _.defer(save);
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

// Fix any known problems with items that might have been
// cause by legacy versions and rewrite indexes.
function itemsFsck(oldItems) {
    var newItems = {}, values;

    values = _.values(oldItems);
    values = _.sortBy(values, due);
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

// Load items from localStorage and calculate the nextId counter.
function loadItems() {
    items = JSON.parse(localStorage.getItem('items'));
    lastSaveDate = JSON.parse(localStorage.getItem('lastSaveDate'));

    items = itemsFsck(items);

    nextId = 0;
    _.each(items, function (item, id) {
        nextId = id >= nextId ? id + 1 : nextId;
    });
}

// Enforce home screen installation on iDevices.
function enforceAppMode() {
    if (window.navigator.userAgent.match(/iPhone|iPad/) && !window.navigator.standalone) {
        $('#addToHomeScreen').show();
        $('#app').hide();
        // Throw to stop initialization;
        throw new Error("Unsupported environment");
    }
}

// Create template functions for the fragments defined
// in the HTML file.
function loadTemplates() {
    itemTemplate = _.template(document.getElementById('item-template').innerHTML);
    moreItemsTemplate = _.template(document.getElementById('moreItems-template').innerHTML);
}

// Hide the address bar, if we have enough content to fill the screen
// and it's currently visible.
function hideAddressBar() {
    if (navigator.userAgent.match(/mobile/i)) {
        window.scrollTo(0, 1);
    }
}

function setupEvents() {
    $('#newAdd').click(newItem);

    // Show debug information when user shakes device.
    window.addEventListener('shake', showDebugInformation, false);

    // Hide it when clicked.
    $('#debugInformation').click(function () {
        $('#debugInformation').hide();
    });
}

$(document).ready(function () {
    enforceAppMode();
    loadItems();
    loadTemplates();
    setupEvents();

    _.defer(displayItems);
    _.defer(hideAddressBar);
});
