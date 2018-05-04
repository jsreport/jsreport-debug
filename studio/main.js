/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _jsreportStudio = __webpack_require__(1);
	
	var _jsreportStudio2 = _interopRequireDefault(_jsreportStudio);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var debug = false;
	var preview = function preview() {
	  debug = true;
	  _jsreportStudio2.default.preview();
	};
	
	_jsreportStudio2.default.addApiSpec({
	  options: { debug: { logsToResponse: true, logsToResponseHeader: true } }
	});
	
	_jsreportStudio2.default.addToolbarComponent(function (props) {
	  return React.createElement(
	    'div',
	    {
	      className: 'toolbar-button ' + (!props.canRun ? 'disabled' : ''), onClick: function onClick() {
	        return preview();
	      } },
	    React.createElement('i', { className: 'fa fa-bug' }),
	    ' Debug'
	  );
	});
	
	_jsreportStudio2.default.previewListeners.push(function (request, entities) {
	  if (debug) {
	    request.options.debug = { logsToResponse: true };
	  }
	  debug = false;
	});

/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports = Studio;

/***/ }
/******/ ]);