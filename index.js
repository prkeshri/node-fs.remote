#!/usr/bin/env node
const fs = require('fs');
const request = require('sync-request');
const child_process = require('child_process');
var which = require('which')

const http = require('http'), https = require('https');

const oldFsReadFile = fs.readFile;
fs.readFile = function(url, options, callback) {
    if(typeof options === 'function') {
        callback = options;
        options = {};
    }
    let send;
    if(url.indexOf('http:') > -1) {
        send = http.request;
    } else if(url.indexOf('https:') > -1) {
        send = https.request;
    } else {
        return oldFsReadFile.apply(fs, arguments);
    }
    send(url, function(res) {
        if(parseInt(res.statusCode/100) !== 2) {
            return callback(new Error(res.statusMessage));
        }
        let d = '';
        res.on('data', function(data) {
            d += data;
        });

        res.on('end', function() {
            callback(null, Buffer.from(d));
        });
    });
};

const oldFsReadFileSync = fs.readFileSync;
fs.readFileSync = function(url, encoding = 'utf-8') {
    if(url.indexOf('http:') > -1 || url.indexOf('https:') > -1) {
        const r = request('GET', url);
        return r.getBody(encoding);
    } else {
        return oldFsReadFileSync.apply(fs, arguments);
    }
};

if (require.main !== module) {
    return;
}

let [node, me, req, ...argv] = process.argv;

if(!req) {
    console.log(`Must provide a sub-executable when invoked from command line!`);
    process.exit(1);
}

req = which.sync(req);

argv.unshift(node, req);

process.argv = argv;
require(req);