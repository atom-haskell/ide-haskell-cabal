BuilderBase = require './base'

module.exports =
class BuilderCabal extends BuilderBase
  constructor: ->
  build: -> {exitCode: 0, hasError: false}
