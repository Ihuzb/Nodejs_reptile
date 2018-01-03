const http = require("http");
const cheerio = require("cheerio");
const iconv = require('iconv-lite');
const Promise = require("bluebird");
const fs = require('fs');
const mkdirp = require('mkdirp');
const maoyanUrl = 'http://maoyan.com';

function getMoviceImage(html, path) {
    let allDate = [];
    html.forEach((item) => {
        const $ = cheerio.load(item);
        const chapter = $('.banner');
        let imageHref = chapter.find('.avatar-shadow').find('img').attr('src');
        let moviceName = chapter.find('.name').text();
        let moviceContent = $('.container').find('.dra').text();
        console.log(moviceContent);
        console.log(moviceName);
        console.log(imageHref);
        let moviceData = {
            moviceName: moviceName,
            moviceContent: moviceContent,
        }
        allDate.push(moviceData);
        http.get(imageHref, (res) => {
            let imgData = "";
            res.setEncoding("binary");
            res.on('data', (data) => imgData += data);
            res.on('end', () => {
                fs.writeFile('./' + path + '/' + moviceName + '.jpg', imgData, "binary", (err) => {
                    if (err) {
                        console.log(`下载失败《${moviceName}》`);
                    } else {
                        console.log(`下载成功《${moviceName}》`);
                    }
                })
            })
        }).on('error', (e) => console.log('有错误！！'))
    });
    consoleCourseData(allDate, path);
}


function filterChapters(html) {
    const $ = cheerio.load(html);
    const chapters = $('.movie-list').find('dd');
    let courseData = [];
    chapters.each(function (item) {
        var chapter = $(this);
        // var Href = chapter.find('tbody').children('tr').eq(1).find('a').eq(1).attr('href') != undefined ? chapter.find('tbody').children('tr').eq(1).find('a').eq(1) : chapter.find('tbody').children('tr').eq(1).find('a')
        // var chapterTitle = chapter.find('b').text().replace(/(^\s+)|(\s+$)|\n/g, "");
        // var Movicetimes = chapter.find('font').text().replace(/(^\s+)|(\s+$)|\n/g, "");
        // var Tables = chapter.find('tbody').children('tr').eq(3).text().replace(/(^\s+)|(\s+$)|\n/g, "")
        var moviceHref = chapter.find('a').attr('href');
        var chapterData = {
            moviceHref: maoyanUrl + moviceHref
        }
        courseData.push(chapterData)
    })
    return courseData
}

function consoleCourseData(courseData, table) {
    let tes = '';
    courseData.forEach((item) => {
        let {moviceName, downloadLink, moviceContent} = item
        // console.log('电影名称:' + item.chapterTitle)
        // console.log('时间' + item.videos)
        // console.log('简介:' + item.children + '\n')
        tes += `电影名:《${moviceName}》\r电影简介:${moviceContent}\n\r`
    })
    fs.writeFileSync(table + '.txt', tes)
}

function getMovice(urls) {
    return new Promise((resolve, reject) => {
        console.log('获取到新页面正在爬取图片' + urls);
        http.get(urls, (res) => {
            // var chunks = [];
            let html = '';
            res.on('data', (data) => {
                // chunks.push(data)
                html += data;
            })
            res.on('end', () => {
                // var html = iconv.decode(Buffer.concat(chunks), 'gb2312');
                resolve(html)
            })
        }).on('error', (e) => {
            reject(e);
            console.log('有错误！！!')
        })

    })
}

function getPageAsync(url, l) {
    return new Promise((resolve, reject) => {
        console.log('正在爬取' + url);
        http.get(url, (res) => {
            // var chunks = [];
            let html = '';
            res.on('data', (data) => {
                // chunks.push(data)
                html += data
            })
            res.on('end', () => {
                // var html = iconv.decode(Buffer.concat(chunks), 'gb2312');
                resolve([html, l])

            })
        }).on('error', (e) => {
            reject(e);
            console.log('有错误！！')
        })
    })
}

let fetArray = [];
for (let i = 0; i <= 150; i = i + 30) {
    const url = maoyanUrl + '/films?offset=' + i;
    fetArray.push(getPageAsync(url, i));
}


Promise
    .all(fetArray)
    .then((movice) => {
        let movicePage = [];
        movice.forEach((html) => {
            let [htmls, path] = html;
            //创建制定文件夹
            mkdirp('./' + path, (err) => {
                if (err) {
                    return Promise.reject(err)
                }
            });
            const courseData = filterChapters(htmls);
            let getMovices = [];
            courseData.forEach((va) => {
                let {moviceHref} = va;
                getMovices.push(getMovice(moviceHref))
            })
            Promise.all(getMovices)
                .then((htmls) => getMoviceImage(htmls, path))
                .catch((err) => console.log('出错了'))
        })
    }).catch((err) => console.log('出错了'));