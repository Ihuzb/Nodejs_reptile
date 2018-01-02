var http = require("http");
var cheerio = require("cheerio");
var iconv = require('iconv-lite');
var Promise = require("bluebird")
var label = ['oumei', 'china'];
var fs = require('fs');
var mkdirp = require('mkdirp');

// var url = 'http://www.ygdy8.net';

function getMoviceImage(html, path) {
    var allDate = [];
    html.forEach(function (item) {
        var $ = cheerio.load(item);
        var chapter = $('.co_area2');
        var imageHref = chapter.find('#Zoom').find('span').find('img').attr('src');
        var moviceName = chapter.find('.title_all').text().replace(/\》.*[\u4e00-\u9fa5]*/g, '').replace(/.*[\u4e00-\u9fa5]\《/g, '')
        var downloadLink = chapter.find('#Zoom').find('span').find('table').find('a').text()
        var moviceContent = chapter.find('#Zoom').find('span').text().split("◎").pop().replace(/\s/g, '').replace(/\【.*/g, '').replace('简介', '')
        // console.log(moviceContent)
        // console.log(downloadLink)
        // console.log(moviceName)
        // console.log(imageHref)
        var moviceData = {
            moviceName: moviceName,
            moviceContent: moviceContent,
            downloadLink: downloadLink
        }
        allDate.push(moviceData)
        http.get(imageHref, function (res) {
            var imgData = "";
            res.setEncoding("binary");
            res.on('data', function (data) {
                imgData += data;
            })
            res.on('end', function () {
                fs.writeFile('./' + path + '/' + moviceName.replace(/[ -~]/g, '') + imageHref.replace(/http:\/\/www.imageto.org\/images\//g, ''), imgData, "binary", function (err) {
                    if (err) {
                        console.log("down fail");
                    }
                    console.log("down success");
                })
            }).on('error', function (e) {
                console.log('有错误！！')
            })
        })

    })
    consoleCourseData(allDate, path);
}


function filterChapters(html) {
    var $ = cheerio.load(html);
    var chapters = $('.tbspan');
    var courseData = [];
    chapters.each(function (item) {
        var chapter = $(this);
        var Href = chapter.find('tbody').children('tr').eq(1).find('a').eq(1).attr('href') != undefined ? chapter.find('tbody').children('tr').eq(1).find('a').eq(1) : chapter.find('tbody').children('tr').eq(1).find('a')
        var chapterTitle = chapter.find('b').text().replace(/(^\s+)|(\s+$)|\n/g, "");
        var Movicetimes = chapter.find('font').text().replace(/(^\s+)|(\s+$)|\n/g, "");
        var Tables = chapter.find('tbody').children('tr').eq(3).text().replace(/(^\s+)|(\s+$)|\n/g, "")
        var moviceHref = Href.attr('href');
        var chapterData = {
            chapterTitle: chapterTitle,
            videos: Movicetimes,
            children: Tables,
            moviceHref: moviceHref
        }
        courseData.push(chapterData)
    })
    return courseData
}

function consoleCourseData(courseData, table) {
    var tes = ''
    courseData.forEach(function (item) {
        // console.log('电影名称:' + item.chapterTitle)
        // console.log('时间' + item.videos)
        // console.log('简介:' + item.children + '\n')
        tes += '电影名:' + item.moviceName + '\r'
            + '下载地址:' + item.downloadLink + '\r'
            + '电影简介:' + item.moviceContent + '\n\r'
    })
    fs.writeFileSync(table + '.txt', tes)
}

function getMovice(urls) {
    return new Promise(function (resolve, reject) {
        console.log('获取到新页面正在爬取图片' + urls);
        http.get(urls, function (res) {
            var chunks = [];
            res.on('data', function (data) {
                chunks.push(data)
            })
            res.on('end', function () {
                var html = iconv.decode(Buffer.concat(chunks), 'gb2312');
                resolve(html)
            })
        }).on('error', function (e) {
            reject(e);
            console.log('有错误！！')
        })

    })
}

function getPageAsync(url, l) {
    return new Promise(function (resolve, reject) {
        console.log('正在爬取' + url);
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

var fetArray = [];
label.forEach(function (l) {
    var url = 'http://www.ygdy8.net/html/gndy/' + l + '/index.html';
    fetArray.push(getPageAsync(url, l))
})

Promise
    .all(fetArray)
    .then(function (movice) {
        var movicePage = [];
        movice.forEach(function (html) {
            //创建制定文件夹
            mkdirp('./' + html[1], function (err) {
                if (err) {
                    return Promise.reject(err)
                }
            });
            var courseData = filterChapters(html[0]);
            var getMovices = [];
            courseData.forEach(function (va) {
                var url = 'http://www.ygdy8.net' + va.moviceHref;
                getMovices.push(getMovice(url))
            })
            Promise.all(getMovices).then(function (htmls) {
                getMoviceImage(htmls, html[1])
            }).catch(function (err) {
                console.log('出错了')
            })
        })
    }).catch(function (err) {
    console.log('出错了')
})