var path = require('path'),
	_ = require('../../../lib/alloy/underscore')._,
	uglifyjs = require('uglify-js'),
	logger = require('../../../common/logger'),
	U = require('../../../utils');

var EXCLUDE = ['backbone','CFG','underscore'];
var BUILTINS_PATH = path.join(__dirname,'..','..','..','builtins');
var loaded = [];

function appendExtension(file, extension) {
	extension = '.' + extension;
	file = U.trim(file);

	var len = extension.length;
	if (file.substring(file.length - extension.length) !== extension) {
		return file + extension;
	} else {
		return file;
	}
}

exports.process = function(ast, config) {
	var rx = /^alloy\/(.+)$/;
	var match;

	ast.walk(new uglifyjs.TreeWalker(function(node) {
		if (node instanceof uglifyjs.AST_Call) {
			if (node.expression.name === 'require' &&               // Is this a require call?
				node.args[0] && _.isString(node.args[0].value) &&   // Is the 1st param a literal string?
				(match = node.args[0].value.match(rx)) !== null &&  // Is it an alloy module?
				!_.contains(EXCLUDE, match[1]) &&                   // Make sure it's not excluded.
				!_.contains(loaded, match[1])                       // Make sure we didn't find it already              
			) {
				var name = appendExtension(match[1], 'js');
				var source = path.join(BUILTINS_PATH,name);
				if (!path.existsSync(source)) {
					return;
				}

				var dest = path.join(config.dir.resources,'alloy',name);
				logger.debug('  - [' + name + '] --> "' + dest + '"');
				U.copyFileSync(source, dest);

				loaded = _.union(loaded, [name]);
			}
		}
	}));
	return ast;
}