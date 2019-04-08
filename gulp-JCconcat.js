var through = require('through2');
var concat = require('gulp-concat');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var gulp = require('gulp');

// 常量
const PLUGIN_NAME = 'gulp-JCconcat';

function modify(modifier) {
    return through.obj(function(file, encoding, done) {
        var content = modifier(String(file.contents));
        file.contents = new Buffer(content);
        this.push(file);
        done();
    });
}

function cssInJs(data) {
    data = data.replace(/\n/g, '').replace(/(?=[^\;]*\;)\s+/g, ' ');
    data = 'var STYLE_CSS = "' + data + '";'; // 请注意css中如果需要引号，请使用单引号

    var writeTxt = "(function (){" + data + "var style = document.createElement('style');style.innerHTML = STYLE_CSS;document.querySelector('head').appendChild(style);})();";
    return writeTxt;
}

function cssToJs(jsStream, cssStream) {
    var content = cssStream.pipe(modify(cssInJs));
    return content.pipe(through.obj(function(file, encoding, done) {
        var contentTxt = String(file.contents);
        var self = this;
        jsStream.pipe(through.obj(function(file1, encoding1, done1) {
            contentTxt += String(file1.contents);

            file.contents = new Buffer(contentTxt);
            self.push(file);
            done1();
            done();
        }))
    }));
}

function getJsStream(arr) {
    if (arr.length >= 1) {
        return gulp.src(arr)
            .pipe(concat('all.js'))
    } else {
        return;
    }
}

function getCssStream(arr) {
    if (arr.length >= 1) {
        return gulp.src(arr)
            .pipe(concat('all.css'))
            // .pipe(uglify())
    } else {
        return;
    }
}
// 插件级别函数 (处理文件)
function gulpJCconcat(arr) {
    if (!arr) {
        throw new PluginError(PLUGIN_NAME, 'Missing files path!');
    }
    var js_arr = [];
    var css_arr = [];
    var reg = /.*?\.js/ig;
    var reg2 = /.*?\.css/ig;

    for (var i = 0; i < arr.length; i++) {
        if (arr[i].match(reg)) {
            js_arr.push(arr[i]);
        } else if (arr[i].match(reg2)) {
            css_arr.push(arr[i]);
        }
    }

    var cssStream = getCssStream(css_arr);
    var jsStream = getJsStream(js_arr);

    if (cssStream && jsStream) {
        // 定义转换内容的 streamer
        var streamer = cssToJs(jsStream, cssStream);
    } else {
        var streamer = jsStream ? jsStream : cssStream;
    }

    // 返回 streamer
    return streamer;
}

// 暴露（export）插件的主函数
module.exports = gulpJCconcat;