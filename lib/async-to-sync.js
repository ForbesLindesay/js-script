'use strict'

var Promise = require('promise')

module.exports = execPromise
function execPromise(api, fn) {
  var thrown = []
  var results = []
  var index = 0
  var stopped = false
  function block(fn) {
    return function () {
      if (stopped) throw new Error('stopped')
      if (index < results.length) {
        if (thrown[index]) throw results[index++]
        else return results[index++]
      } else {
        stopped = true
        var self = this
        var args = Array.prototype.slice.call(arguments)
        thrown.push(null)
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
        if (thrown[index]) throw results[index++]
        else return results[index++]
      } else {
        index++
        var res
        try {
          res = fn.apply(this, arguments)
        } catch (ex) {
          thrown.push(true)
          results.push(ex)
          throw ex
        }
        thrown.push(false)
        results.push(res)
        return res
      }
    }
  }
  api = api(block, lazy)
  function attempt(res) {
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
        var updated = Promise.from(null)
        for (var i = 0; i < results.length; i++) {
          (function (i) {
            if (thrown[i] === null) {
              updated = updated.then(function() {
                return results[i]
              })
              .then(function (result) {
                thrown[i] = false
                results[i] = result
              }, function (result) {
                thrown[i] = true
                results[i] = result
              })
            }
          }(i))
        };
        resolve(updated.then(attempt))
      } else {
        resolve(result)
      }
    })
  }
  return attempt()
}