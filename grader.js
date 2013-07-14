#!/usr/bin/env node
var fs = require('fs');
var sys = require('util')
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function (infile) {
    var instr = infile.toString();
    if (!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var cheerioHtmlFile = function (htmlfile) {
    return cheerio.load(htmlfile);
};

var loadChecks = function (checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function (htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for (var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    console.log(JSON.stringify(out, null, 4));
};

var checkResponse = function(program) {
  return  function(result, response) {
        if (result instanceof Error) {
            console.log('Not a valid url. Exiting');
            process.exit(1);
        } else {
            checkHtmlFile(result, program.checks)
        }
    }
}


var getHtml = function(program) {
    if(program.file) {
      var html = fs.readFileSync(program.file);
      checkHtmlFile(html, program.checks)
    }
    else {
      return rest.get(program.url).on('complete', checkResponse(program))
    }
}



var clone = function (fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if (require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists))
        .option('-u, --url <url>', 'url to index.html')
        .parse(process.argv);
    getHtml(program);
} else {
    exports.checkHtmlFile = checkHtmlFile;
}