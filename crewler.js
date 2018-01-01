var http = require("http");
var cheerio = require("cheerio");
var iconv = require('iconv-lite');
var Promise = require("bluebird")
var label = ['dyzz', 'oumei', 'china']
var fs = require('fs')

// var url = 'http://www.dytt8.net/html/gndy/dyzz/index.html';

function filterChapters(html) {
    var $ = cheerio.load(html);
    var chapters = $('.tbspan');
    var courseData = [];
    chapters.each(function (item) {
        var chapter = $(this);
        var chapterTitle = chapter.find('b').text().replace(/(^\s+)|(\s+$)|\n/g, "");
        var Movicetimes = chapter.find('font').text().replace(/(^\s+)|(\s+$)|\n/g, "");
        var Tables = chapter.find('tbody').children('tr').eq(3).text().replace(/(^\s+)|(\s+$)|\n/g, "")
        var chapterData = {
            chapterTitle: chapterTitle,
            videos: Movicetimes,
            children: Tables
        }
        courseData.push(chapterData)
    })
    return courseData
}

function consoleCourseData(courseData, table) {
    var tes = ''
    courseData.forEach(function (item) {
        console.log('电影名称:' + item.chapterTitle)
        console.log('时间' + item.videos)
        console.log('简介:' + item.children + '\n')
        tes += item.chapterTitle + '\r' + item.videos + '\r' + item.children + '\r\n'
    })
    fs.writeFileSync(table+'.txt', tes)
}

function getPageAsync(url, l) {
    return new Promise(function (resolve, reject) {
        console.log('正在爬取' + url)
        http.get(url, function (res) {
            var chunks = [];

            res.on('data', function (data) {
                chunks.push(data)
            })
            res.on('end', function () {
                var html = iconv.decode(Buffer.concat(chunks), 'gb2312');
                resolve([html, l])

            })
        }).on('error', function (e) {
            reject(e);
            console.log('有错误！！')
        })
    })
}

var fetArray = []
label.forEach(function (l) {
    var url = 'http://www.dytt8.net/html/gndy/' + l + '/index.html'
    fetArray.push(getPageAsync(url, l))
})
Promise
    .all(fetArray)
    .then(function (movice) {
        var movicePage = [];
        movice.forEach(function (html) {
            var courseData = filterChapters(html[0]);
            consoleCourseData(courseData, html[1])
        })
    })