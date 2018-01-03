# Nodejs_reptile
使用Nodejs爬取猫眼电影网站页面电影信息
# 技术概括
使用http模块请求页面，获得的页面结构数据有编码问题，使用iconv-lite模块转换器编码，正常中文。<br>
使用bluebird来实现Promise，并发爬取页面数据。<br>
使用fs模块的writeFileSync将爬取的文本分别保存到不同的分类文件中，同时将图片下载到本地<br>
使用ES6开发
# 使用方法
下载两个文件<br>
npm install 安装模块
node crewler.js 即可爬取
