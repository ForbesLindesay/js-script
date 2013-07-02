'use strict'

var Promise = require('promise')

module.exports = execPromise
function execPromise(api, fn) {
  var results = []
  var index = 0
  var stopped = false
  function block(fn) {
    return function () {
      if (stopped) throw new Error('stopped')
      if (index < results.length) {
        return results[index++]
      } else {
        stopped = true
        var self = this
        var args = Array.prototype.slice.call(arguments)
        results.push(new Promise(function (resolve, reject) {
          args.push(function (err, res) {
            if (err) reject(err)
            else resolve(res)
          })
          var res = fn.apply(self, args)
          if (res && (typeof res === 'function' || typeof res === 'object') && typeof res.then === 'function') {
            resolve(res)
          }
        }))
        index++
        throw new Error('stopped')
      }
    }
  }
  function lazy(fn) {
    return function () {
      if (stopped) throw new Error('stopped')
      if (index < results.length) {
        return results[index++]
      } else {
        results.push(fn.apply(this, arguments))
        return results[index++]
      }
    }
  }
  api = api(block, lazy)
  function attempt(res) {
    results = res
    index = 0
    stopped = false
    return new Promise(function (resolve, reject) {
      var result
      try {
        result = fn(api, block, lazy)
      } catch (ex) {
        if (!stopped) {
          return reject(ex)
        }
      }
      if (stopped) {
        resolve(Promise.all(results).then(attempt))
      } else {
        resolve(result)
      }
    })
  }
  return attempt([])
}