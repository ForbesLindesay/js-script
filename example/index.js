var fs = require('fs')
var barrage = require('barrage')
var hyperquest = require('hyperquest')

function get(url, callback) {
  return barrage(hyperquest(url)).buffer('buffer', callback)
}
function writeFile(path, data, callback) {
  return fs.writeFile(__dirname + '/' + path, data, callback)
}
function mkdir(path, callback) {
  return fs.mkdir(__dirname + '/' + path, callback)
}
execute(function (block, lazy) {
  var csl = {}
  Object.keys(console)
    .forEach(function (key) {
      csl[key] = lazy(console[key].bind(console))
    })
  return {
    get: block(get),
    writeFile: block(writeFile),
    mkdir: block(mkdir),
    console: csl
  }
}, fs.readFileSync(__dirname + '/octocats.js', 'utf8'), '/example/octocats.js').done()
