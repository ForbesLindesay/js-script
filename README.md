# js-script

Allow asynchronous APIs to be scripted using pure synchronous JavaScript.

[![Build Status](https://img.shields.io/travis/ForbesLindesay/js-script/master.svg)](https://travis-ci.org/ForbesLindesay/js-script)
[![Dependency Status](https://img.shields.io/gemnasium/ForbesLindesay/js-script.svg)](https://gemnasium.com/ForbesLindesay/js-script)
[![NPM version](https://img.shields.io/npm/v/js-script.svg)](http://badge.fury.io/js/js-script)

## Installation

    npm install js-script

## Usage

See the example folder for a real working example script that appears to synchronously download all the octocats from GitHub.

```javascript
var script = require('js-script')
script(function (block, lazy) {
  var api = {}
  api.first = block(function (input, callback) {
    setTimeout(function () {
      callback(null, input + 'bar')
    }, 1000)
  })
  api.second = block(function (input) {
    return Q.delay(input + 'foo', 1000)
  })
  api.third = lazy(function () {
    return 'ding'
  })
  return api
}, 'return [first('foo'), second('bar'), third()]', 'inline.js')
.nodeify(function (err, res) {
  if (err) throw err
  assert.deepEqual(res, ['foobar', 'barfoo', 'ding'])
})
```

The first parameter passed to `script` should be a function used to generate an API.  The second parameter must be the source code of the script and the third parameter is an optional file name for better stack traces.

The API generator function gets passed two function wrappers, `block` and `lazy`.  Use `block` to wrap any asynchronous methods and `lazy` to wrap any synchronous methods that are computationally expensive, cause side effects or don't always return the same value.

Providing that the script is idempotent and deterministic (except for functions wrapped by `block` and `lazy`) it will appear to work just as if it were synchronous.

## How does it work?

This works by executing the script repeatedly.  Once it gets to the first un-computed result (the first block/lazy) it stops the function, waits until it has computed that result, and starts again.  The second time through, it skips that first block/lazy and just returns the pre-computed result.  This is slow if the function is computationally expensive, but for IO heavy workloads it is fine.  It should also be oted that no garbage collection can occur until the script has finished executing, because the results may need to be re-used.  This means that the octocats example is very inefficient in terms of memory usage, but often the tradeoff in readability is worth it.

## Security

All scripts are run in a `vm` sandbox and with strict mode enabled.  This makes them moderately secure, but the node.js manual recommends you also use a separate process if executing un-trusted code.

## License

  MIT