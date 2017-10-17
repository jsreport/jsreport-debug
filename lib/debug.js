/*!
 * Copyright(c) 2016 Jan Blaha
 *
 * Collect and serve logs with request scope
 */

var os = require('os')
var Buffer = require('safe-buffer').Buffer

function paddingRight (str, length) {
  var padding = (new Array(Math.max(length - str.length + 1, 0))).join(' ')
  return str + padding
}

function logsToFormattedString (request) {
  var start = request.logs[0].timestamp.getTime()
  return request.logs.map(function (m) {
    var time = (m.timestamp.getTime() - start)
    var paddedTime = paddingRight(time + '', 7)
    return '+' + paddedTime + m.message
  }).join(os.EOL)
}

function cutResponseHeader (logs, maxLogResponseHeaderSize, logger) {
  var headerSize = 4
  var logsCut = []
  for (var i = 0; i < logs.length && headerSize < maxLogResponseHeaderSize; i++) {
    var log = logs[i]
    headerSize += JSON.stringify(log).length + 2
    if (headerSize < maxLogResponseHeaderSize) {
      logsCut.push(logs[i])
    }
  }

  if (logsCut.length !== logs.length) {
    logger.warn('The size of the debug logs which should have been written to the response header exceeded the limit. The content of the response header ' +
    ' was cut to avoid HPE_HEADER_OVERFLOW errors. To avoid this message, please decrease the number of console.log calls in the template.')
    logsCut.push({
      timestamp: new Date(),
      level: 'warn',
      message: 'The further logs have been cut to prevent HPE_HEADER_OVERFLOW error. You can set request.options.debug.logsToResponse=true to read full logs in the output stream.'
    })
  }

  return logsCut
}

var requestLogs = {

}

module.exports = function (reporter, definition) {
  reporter.options.debug = Object.assign({}, { maxLogResponseHeaderSize: 60 * 1024 }, definition.options)
  reporter.initializeListeners.add('request-log', function () {
    reporter.beforeRenderListeners.insert(0, 'request-log', function (request, response) {
      if (!request.options.isChildRequest) {
        request.options.parentId = request.id
      }

      requestLogs[request.options.parentId || request.id] = request.logs = requestLogs[request.options.parentId || request.id] || []
      request.logger.rewriters.push(function (level, msg, meta) {
        request.logs.push({
          timestamp: meta.timestamp || new Date(),
          level: level,
          message: msg
        })
        return meta
      })
      request.logs.push({
        timestamp: new Date(),
        level: 'info',
        message: 'Starting rendering request ' + request.id
      })
    })

    reporter.renderErrorListeners.add('request-log', function (request, res, e) {
      if (request.options.debug && request.options.debug.logsToResponse) {
        e.message += os.EOL + 'logs' + (request.options.isChildRequest ? ' (child request):' : ':') + os.EOL + logsToFormattedString(request)
      }
    })

    reporter.afterRenderListeners.add('request-log', function (request, response) {
      request.logs.push({
        timestamp: new Date(),
        level: 'info',
        message: 'Rendering request finished ' + request.id
      })

      response.logs = request.logs

      if (request.options.isChildRequest) {
        return
      }

      if (request.options.debug && request.options.debug.logsToResponseHeader) {
        response.headers['Debug-Logs'] = JSON.stringify(cutResponseHeader(response.logs, reporter.options.debug.maxLogResponseHeaderSize, request.logger))
      }

      if (request.options.debug && request.options.debug.logsToResponse) {
        response.headers['Content-Type'] = 'text/plain'
        response.headers['Content-Disposition'] = 'inline; filename="log.txt"'
        response.headers['File-Extension'] = 'txt'

        response.content = Buffer.from(logsToFormattedString(request))
      }
    })
  })
}
