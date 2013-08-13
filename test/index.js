var assert = require('assert')
var fs = require('fs')
var Promise = require('promise')
var script = require('../')

var src = fs.readFileSync(__dirname + '/fixture/script.js', 'utf8')

var a = {}, b = {}, c = {}
var ac = 0, bc = 0, cc = 0
script(src, {
  first: function () {
    ac++
    return new Promise(function (resolve) {
      setTimeout(function () {
        resolve(a)
      }, 100)
    })
  },
  second: function () {
    bc++
    return new Promise(function (resolve) {
      setTimeout(function () {
        resolve(b)
      }, 100)
    })
  },
  third: function () {
    cc++
    return c
  },
}, '/test/fixture/script.js')
.then(function (res) {
  assert(res[0] === a)
  assert(res[1] === b)
  assert(res[2] === c)
  assert(ac === 2)
  assert(bc === 2)
  assert(cc === 2)
})
  .then(function () {
    var src = fs.readFileSync(__dirname + '/fixture/err-handler.js', 'utf8')

    var a = {}, b = {}, c = {}
    var ac = 0, bc = 0, cc = 0
    return script(src, {
        cache: function () {
          ac++
          return new Promise(function (resolve, reject) {
            setTimeout(function () {
              reject(a)
            }, 100)
          })
        },
        server: function () {
          bc++
          return new Promise(function (resolve, reject) {
            setTimeout(function () {
              reject(b)
            }, 100)
          })
        }
      }, '/test/fixture/script.js')
    .then(function (res) {
      assert(res === 'default')
      assert(ac === 1)
      assert(bc === 1)
      console.log('Tests Passed')
    })
  })
  .done()