/*!
 * Copyright(c) 2016 Jan Blaha
 *
 * Collect and serve logs with request scope
 */

var os = require('os')

function paddingRight (str, length) {
  var padding = (new Array(Math.max(length - str.length + 1, 0))).join(' ')
  return str + padding
}

var requestLogs = {

}

module.exports = function (reporter, definition) {
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

    function logsToFormattedString (request) {
      var start = request.logs[0].timestamp.getTime()
      return request.logs.map(function (m) {
        var time = (m.timestamp.getTime() - start)
        var paddedTime = paddingRight(time + '', 7)
        return '+' + paddedTime + m.message
      }).join(os.EOL)
    }

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
        response.headers['Debug-Logs'] = JSON.stringify(response.logs)
      }

      if (request.options.debug && request.options.debug.logsToResponse) {
        response.headers['Content-Type'] = 'text/plain'
        response.headers['Content-Disposition'] = 'inline; filename="log.txt"'
        response.headers['File-Extension'] = 'txt'

        response.content = new Buffer(logsToFormattedString(request))
      }
    })
  })
}
