require('should')
var core = require('jsreport-core')
var debug = require('../')

describe('debug', function () {
  var reporter

  function init () {
    reporter = core()
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

  it('should add logs to the response', function (done) {
    init().then(function () {
      return reporter.render({template: {content: 'foo', engine: 'none', recipe: 'html'}})
    }).then(function (response) {
      response.logs.filter(function (m) {
        return m.message === 'test'
      }).should.have.length(1)
      done()
    }).catch(done)
  })

  it('should add logs to header if options.debug.logsToResponseHeader', function (done) {
    init().then(function () {
      return reporter.render({
        template: {content: 'foo', engine: 'none', recipe: 'html'},
        options: {debug: {logsToResponseHeader: true}}
      })
    }).then(function (response) {
      JSON.parse(response.headers['Debug-Logs']).filter(function (m) {
        return m.message === 'test'
      }).should.have.length(1)
      done()
    }).catch(done)
  })

  it('should put logs to response if logsToResponse', function (done) {
    init().then(function () {
      return reporter.render({
        template: {content: 'foo', engine: 'none', recipe: 'html'},
        options: {debug: {logsToResponse: true}}
      })
    }).then(function (response) {
      response.content.toString().should.containEql('test')
      done()
    }).catch(done)
  })
})

