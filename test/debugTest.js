require('should')
const core = require('jsreport-core')
const debug = require('../')

describe('debug', () => {
  let reporter

  function init (options) {
    reporter = core(options)
    reporter.use(debug())
    reporter.use({
      name: 'test',
      main: (reporter, definition) => reporter.beforeRenderListeners.add('test', (request, response) => request.logger.info('test'))
    })

    return reporter.init()
  }

  it('should add logs to the response', async () => {
    await init()
    const response = await reporter.render({template: {content: 'foo', engine: 'none', recipe: 'html'}})
    response.logs.filter(m => m.message === 'test').should.have.length(1)
  })

  it('should add logs to header if options.debug.logsToResponseHeader', async () => {
    await init()
    const response = await reporter.render({
      template: {content: 'foo', engine: 'none', recipe: 'html'},
      options: {debug: {logsToResponseHeader: true}}
    })

    JSON.parse(response.headers['Debug-Logs']).filter((m) => m.message === 'test').should.have.length(1)
  })

  it('should put logs to response if logsToResponse', async () => {
    await init()
    const response = await reporter.render({
      template: {content: 'foo', engine: 'none', recipe: 'html'},
      options: {debug: {logsToResponse: true}}
    })

    response.content.toString().should.containEql('test')
  })

  it('should cut response header for options.debug.logsToResponseHeader using configuration.debug.maxLogResponseHeaderSize', async () => {
    await init({
      debug: {
        maxLogResponseHeaderSize: 150
      }
    })
    const response = await reporter.render({
      template: {content: 'foo', engine: 'none', recipe: 'html'},
      options: {debug: {logsToResponseHeader: true}}
    })
    const logs = JSON.parse(response.headers['Debug-Logs'])
    logs.should.have.length(2)
    logs[1].message.should.containEql('HPE_HEADER_OVERFLOW')
  })
})
