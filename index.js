'use strict'

var execute = require('./lib/execute')
var toSync = require('./lib/async-to-sync')
module.exports = execute
module.exports.toSync = toSync