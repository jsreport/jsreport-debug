require('should')
var core = require('jsreport-core')
var debug = require('../')

describe('debug', function () {
  var reporter

  function init (options) {
    reporter = core(options)
    reporter.use(debug())
    reporter.use({
      name: 'test',
      main: function (reporter, definition) {
        reporter.beforeRenderListeners.add('test', function (request, response) {
          request.logger.info('test')
        })
      }
    })

    return reporter.init()
  }

  it('should add logs to the response', function () {
    return init().then(function () {
      return reporter.render({template: {content: 'foo', engine: 'none', recipe: 'html'}})
    }).then(function (response) {
      response.logs.filter(function (m) {
        return m.message === 'test'
      }).should.have.length(1)
    })
  })

  it('should add logs to header if options.debug.logsToResponseHeader', function () {
    return init().then(function () {
      return reporter.render({
        template: {content: 'foo', engine: 'none', recipe: 'html'},
        options: {debug: {logsToResponseHeader: true}}
      })
    }).then(function (response) {
      JSON.parse(response.headers['Debug-Logs']).filter(function (m) {
        return m.message === 'test'
      }).should.have.length(1)
    })
  })

  it('should put logs to response if logsToResponse', function () {
    return init().then(function () {
      return reporter.render({
        template: {content: 'foo', engine: 'none', recipe: 'html'},
        options: {debug: {logsToResponse: true}}
      })
    }).then(function (response) {
      response.content.toString().should.containEql('test')
    })
  })

  it('should cut response header for options.debug.logsToResponseHeader using configuration.debug.maxLogResponseHeaderSize', function () {
    return init({
      debug: {
        maxLogResponseHeaderSize: 150
      }
    }).then(function () {
      return reporter.render({
        template: {content: 'foo', engine: 'none', recipe: 'html'},
        options: {debug: {logsToResponseHeader: true}}
      })
    }).then(function (response) {
      var logs = JSON.parse(response.headers['Debug-Logs'])
      logs.should.have.length(2)
      logs[1].message.should.containEql('HPE_HEADER_OVERFLOW')
    })
  })
})
