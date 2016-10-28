'use strict';

var fs = require('fs');
var path = require('path');
var fsFileTree = require("fs-file-tree");
var formidable = require('formidable');
var bodyParser = require('body-parser');
var secret = require('./secret.js');
/**
secret = {
    pattern     : '...',

    admin       : '...',

    cookieSecret: '...'
};
**/

const ARTICLE_PATH = path.normalize('./article');
const ARTICLE_JSON = path.normalize('./public/article.json');
const RESULT_TRUE  = JSON.stringify({result: true});
const RESULT_FALSE = JSON.stringify({result: false});


module.exports = function(app) {

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(require('cookie-parser')(secret.cookieSecret));
    app.use(require('express-session')({
        resave: false,
        saveUninitialized: true,
        secret: secret.cookieSecret
    }));


    app.post('/article/login', function(req, res) {
        var pattern = req.body.pattern;

        console.log('--------- 로그인 시도 -----------');
        console.log(req.connection.remoteAddress);
        console.log('-------------------------------------');

        if( pattern == secret.pattern ) {
            req.session.admin = secret.admin;
            res.send(RESULT_TRUE)
        } else {
            res.send(RESULT_FALSE);
        }
    });

    app.get('/article/logout', function(req, res) {
        req.session.destroy();
        res.clearCookie('sid');
        res.send(RESULT_TRUE);
    });


    // 이미지 업로드 (IMAGE UPLOAD)
    app.post('/article/upload', function(req, res) {
        res.setHeader('Content-Type', 'application/json');

        if( req.session.admin != secret.admin ) {
            return res.send(JSON.stringify({success: 0, message: '관리자가 아닙니다.'}));
        }

        var form = new formidable.IncomingForm(),
            now = String(Date.now()).slice(-4),
            dir = "public/upload/";

        fs.existsSync(dir) || fs.mkdirSync(dir);

        form.parse(req, function(e, fields, files) {

            if( e ) {
                return res.send(JSON.stringify({success: 0, message: e.message}));
            }

            var tmpPath = files['editormd-image-file'].path,
                fileName = files['editormd-image-file'].name,
                dest = dir + now + "_" + fileName;

            try
            {
                var bf = fs.readFileSync(tmpPath);
                fs.writeFileSync(dest, bf);

                res.send(JSON.stringify({success: 1, message: 'success', url: "http://localhost:3311/upload/" +  now + '_' + fileName}));
            }
            catch(e)
            {
                res.send(JSON.stringify({success: 0, message: e.message}));
            }
        });
    });

    // 갱신 (RENEW)
    app.get('/article/renew', function(req, res) {
            try
            {
                var tree = fsFileTree.sync(ARTICLE_PATH);
                var fd = fs.openSync(ARTICLE_JSON, 'w');
                fs.writeSync(fd, JSON.stringify(tree));

                res.send(JSON.stringify({result: true}));
            }
            catch(e)
            {
                res.send(JSON.stringify({result: false, msg: e.message}));
            }
    });

    // 글 쓰기 (CREATE)
    app.post('/article/write', function(req, res) {
        console.log(req.session.admin);

        if( req.session.admin != secret.admin ) {
            return res.send(JSON.stringify({result: false, msg: '관리자가 아닙니다.'}));
        }

        var dirName  = req.body.dirName,
            subName  = req.body.subName,
            fileName = req.body.fileName,
            fileData = req.body.fileData;

        if( dirName && subName && fileName && fileData )
        {
            var path = makeFilePath(dirName, subName, fileName) + '.md';

            try
            {
                if( fs.existsSync(path) ) {
                    return res.send(JSON.stringify({result: false, msg: '존재하는 파일명입니다.'}));
                }

                var fd = fs.openSync(path, 'w');
                fs.writeSync(fd, fileData);

                res.send(JSON.stringify({result: true}));
            }
            catch(e)
            {
                res.send(JSON.stringify({result: false, msg: e.message}));
            }
        }
        else
        {
            res.send(JSON.stringify({result: false, msg: '파라미터 값이 부족합니다.'}));
        }
    });

    // 글 읽기 (READ)
    app.get('/article/:dir/:sub/:file', function(req, res) {
        var path = makeFilePath(req.params.dir, req.params.sub, req.params.file);

        console.log('---------' + req.params.file + '-------');
        console.log(req.connection.remoteAddress);
        console.log('-------------------------------------');
        try
        {
            if( fs.statSync(path).isFile() )
            {
                res.sendFile(path);
            }
        }
        catch(e)
        {
            res.status(404);
            res.send(RESULT_TRUE);
        }
    });








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






};


function makeFilePath(dir, sub, file) {
    return __dirname + '/article/' + dir + '/' + sub + '/' + file;
}
