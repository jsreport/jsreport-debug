/*!
 * Copyright(c) 2016 Jan Blaha
 *
 * Collect and serve logs with request scope
 */

var os = require('os')

function padding_right (str, length) {
  var padding = (new Array(Math.max(length - str.length + 1, 0))).join(' ')
  return str + padding
}

module.exports = function (reporter, definition) {
  reporter.initializeListener.add('request-log', function () {
    reporter.beforeRenderListeners.insert(0, 'request-log', function (request, response) {
      request.logs = []
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
        message: 'Starting rendering request'
      })
    })

    reporter.afterRenderListeners.add('request-log', function (request, response) {
      request.logs.push({
        timestamp: new Date(),
        level: 'info',
        message: 'Rendering request finished'
      })

      response.logs = request.logs

      if (request.options.debug && request.options.debug.logsToResponseHeader) {
        response.headers['Debug-Logs'] = JSON.stringify(response.logs)
      }

      if (request.options.debug && request.options.debug.logsToResponse) {
        response.headers['Content-Type'] = 'text/plain'
        response.headers['Content-Disposition'] = 'inline; filename=\"log.txt\"'
        response.headers['File-Extension'] = 'txt'

        var start = request.logs[0].timestamp.getTime()
        response.content = new Buffer(request.logs.map(function (m) {
          var time = (m.timestamp.getTime() - start)
          var paddedTime = padding_right(time + '', 7)
          return '+' + paddedTime + m.message
        }).join(os.EOL))
      }
    })
  })
}
