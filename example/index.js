var fs = require('fs')
var Promise = require('promise')
var barrage = require('barrage')
var hyperquest = require('hyperquest')
var execute = require('../')

function get(url) {
  console.log('==get==')
  return barrage(hyperquest(url)).buffer('buffer')
}
function writeFile(path, data) {
  console.log('==write==')
  return Promise.denodeify(fs.writeFile)(__dirname + '/' + path, data)
}
function mkdir(path) {
  console.log('==mkdir==')
  return Promise.denodeify(fs.mkdir)(__dirname + '/' + path)
}
execute(fs.readFileSync(__dirname + '/octocats.js', 'utf8'), {
  get: get,
  writeFile: writeFile,
  mkdir: mkdir,
  console: console
}, '/example/octocats.js').done()
