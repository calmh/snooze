var express = require('express');
var riak = require('riak-js');
var db = riak.getClient();
var app = express.createServer();

app.use(express.bodyParser());

app.options('/:id', function (req, res) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.end();
});

app.get('/:id', function(req, res){
    res.contentType('application/json');
    res.header('Access-Control-Allow-Origin', '*');
    db.get('snooze', req.params.id, { debug: true }, function (error, result) {
        res.send(JSON.stringify(result));
    });
});

app.put('/:id', function(req, res){
    res.header('Access-Control-Allow-Origin', '*');
    db.save('snooze', req.params.id, req.body, { debug: true }, function (error, result) {
        res.end();
    });
});

app.listen(3344);

