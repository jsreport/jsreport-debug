require('should')
const core = require('jsreport-core')
const debug = require('../')
const express = require('jsreport-express')

describe('debug', () => {
  let reporter

  function init (options) {
    reporter = core(Object.assign({ templatingEngines: { strategy: 'in-process' } }, options))
    reporter.use(express())
    reporter.use(debug())

    return reporter.init()
  }

  afterEach(() => {
    return reporter.close()
  })

  it('should add logs to header if options.debug.logsToResponseHeader', async () => {
    await init()
    reporter.beforeRenderListeners.add('test', (req) => reporter.logger.info('test', req))
    const response = await reporter.render({
      template: {content: 'foo', engine: 'none', recipe: 'html'},
      options: {debug: {logsToResponseHeader: true}}
    })

    JSON.parse(response.meta.headers['Debug-Logs']).filter((m) => m.message === 'test').should.have.length(1)
  })

  it('should put logs to response if logsToResponse', async () => {
    await init()
    reporter.beforeRenderListeners.add('test', (req) => reporter.logger.info('test', req))

    const response = await reporter.render({
      template: {content: 'foo', engine: 'none', recipe: 'html'},
      options: {debug: {logsToResponse: true}}
    })

    response.content.toString().should.containEql('test')
  })

  it('should cut response header for options.debug.logsToResponseHeader using configuration.debug.maxLogResponseHeaderSize', async () => {
    await init({
      extensions: {
        debug: {
          maxLogResponseHeaderSize: 150
        }
      }
    })
    const response = await reporter.render({
      template: {content: 'foo', engine: 'none', recipe: 'html'},
      options: {debug: {logsToResponseHeader: true}}
    })
    const logs = JSON.parse(response.meta.headers['Debug-Logs'])
    logs.should.have.length(2)
    logs[1].message.should.containEql('cut')
  })

  it('should remove invalid characters when options.debug.logsToResponseHeader', async () => {
    await init()
    reporter.beforeRenderListeners.add('test', (req) => reporter.logger.info('test', req))
    const response = await reporter.render({
      template: {content: 'foo', engine: 'none', recipe: 'html', helpers: `console.log('™©®')`},
      options: {debug: {logsToResponseHeader: true}}
    })

    response.meta.headers['Debug-Logs'].should.not.containEql('™©®')
  })
})
