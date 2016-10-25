'use strict';

var fs = require('fs');
var path = require('path');
var fsFileTree = require("fs-file-tree");
var formidable = require('formidable');
var bodyParser = require('body-parser');



const ARTICLE_PATH = path.normalize('./article');
const ARTICLE_JSON = path.normalize('./public/article.json');
const RESULT_TRUE = {result: true};
const RESULT_FALSE = {result: false};

module.exports = function(app) {
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    // 이미지 업로드
    app.post('/image/upload', function(req, res) {
        res.setHeader('Content-Type', 'application/json');

        var json = {
            success: 0,
            message: 'ddddd',
            url: 'http://www.exampler.com'
        };
        var json2 = {
            success: 1,
            message: 'ddddd',
            url: 'http://www.exampler.com'
        };

        var form = new formidable.IncomingForm();
        var now = String(Date.now()).slice(-4);
        var dir = "public/upload/";

        fs.existsSync(dir) || fs.mkdirSync(dir);

        form.parse(req, function(err, fields, files) {
            if( err ) {
                res.send(JSON.stringify(json));
                return;
            }
            var tmpPath = files['editormd-image-file'].path;
            var fileName = files['editormd-image-file'].name;
            var dest = dir + now + "_" + fileName;

            fs.readFile(tmpPath, function(err, data) {
                if (err) {
                    res.send(JSON.stringify(json));
                    return;
                }

                fs.writeFile(dest, data, function(err) {

                    if (err) {
                        res.send(JSON.stringify(json));
                        return;
                    }

                    json2.url = "http://localhost:3311/upload/" +  now + '_' + fileName;
                    res.send(JSON.stringify(json2));
                });
            });

        });
    });


    // 글 쓰기 (CREATE)
    app.post('/article/write', function(req, res) {
        var dirName  = req.body.dirName,
            subName  = req.body.subName,
            fileName = req.body.fileName,
            fileData = req.body.fileData;

        if( dirName && subName && fileName && fileData )
        {
            var path = makeFilePath(dirName, subName, fileName) + '.md';

            fs.open(path, 'w', function(err, fd) {
                if (err) {
                    res.send(JSON.stringify({result: false, msg: '경로가 잘못되었습니다.'}));
                }

                fs.writeFile(path, fileData, 'utf8', function(error) {
                    res.send(JSON.stringify({result: true}));
                });
            });
        }
        else
        {
            res.send(JSON.stringify({result: false, msg: '파라미터 값이 부족합니다.'}));
        }
    });
    /*----------------------------------------------------------------------------------------------------------------*/

    /*----------------------------------------------------------------------------------------------------------------*/
    // READ
    app.get('/article/:dir/:sub/:file', function(req, res) {
        var path = makeFilePath(req.params.dir, req.params.sub, req.params.file);
        fs.stat(path, function(err, stats) {
            if (err) {
                res.status(404);
                res.send(RESULT_TRUE);
                return;
            }
            if (stats.isFile()) {
                res.sendFile(path);
            }
        });
    });
    /*----------------------------------------------------------------------------------------------------------------*/



    /*----------------------------------------------------------------------------------------------------------------*/
    // UPDATE
    app.put('/article/:dir/:sub/:file', function() {
        var path = makeFilePath(req.params.dir, req.params.sub, req.params.file);

    });
    /*----------------------------------------------------------------------------------------------------------------*/



    /*----------------------------------------------------------------------------------------------------------------*/
    // DELETE
    app.delete('/article/:dir/:sub/:file', function() {
        var path = makeFilePath(req.params.dir, req.params.sub, req.params.file);

    });
    /*----------------------------------------------------------------------------------------------------------------*/

    app.get('/article/list', function(req, res) {
        var file = __dirname + '/public/article.json';
        fs.readFile(file, 'utf8', function(error, fd) {
            if (error) {
                res.send(RESULT_FALSE);
                return;
            }
            res.send(fd);
        });
    });

    app.get('/article/renew', function(req, res) {
        fsFileTree(ARTICLE_PATH, function(err, tree) {
            fs.open(ARTICLE_JSON, 'w', function(err, fd) {
                if (err) {
                    res.send(RESULT_FALSE);
                }

                fs.writeFile(ARTICLE_JSON, JSON.stringify(tree), 'utf8', function(error) {
                    res.send(RESULT_TRUE);
                });
            });
        });
    });
};


function makeFilePath(dir, sub, file) {
    return __dirname + '/article/' + dir + '/' + sub + '/' + file;
}
