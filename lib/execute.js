'use strict'

var Promise = require('promise')
var vm = require('vm')

var toSync = require('./async-to-sync')

module.exports = script
function script(api, src, filename) {
  return Promise.from(src)
    .then(function (src) {
      return toSync(api, function (api) {
        return vm.runInNewContext('(function(){"use strict";' + src + '}())', api, filename)
      })
    })
}