var converter = converter || new showdown.Converter();

AdunDocs.controller('blogEditCtrl', ['$scope', '$http', '$routeParams', '$timeout', '$location', function blogEditCtrl($scope, $http, $routeParams, $timeout, $location) {
    if( !$scope.blogReady)
    {
        $location.url('/');
        return;
    }

    var postid  = $routeParams.postid;

    $scope.nameRegExp = /^[^\\/:^\*\?"<>\|]+$/;

    $scope.setName(null, null, null);
    $scope.initStat(null, null, null);

    $scope.inputDirCateogry = "";
    $scope.inputSubCateogry = "";
    $scope.inputTitle       = "";

    $scope.selectFirst = function() {
        if($scope.blogStat.dirCategory != '분류없음' && $scope.inputDirCategory == '분류없음') {
            $scope.inputDirCategory = $scope.blogStat.dirCategory;
            $scope.inputSubCategory = $scope.blogStat.subCategory;
            return;
        }
        $scope.inputSubCategory = Object.keys($scope.blogCategory[$scope.inputDirCategory])[0];

    };

    var editor = $scope.editor = editormd("contents", {
        saveHTMLToTextarea : true,
        path : "/editor.md/lib/",
        htmlDecode : true,
        width: '100%',
        height: '36rem',
        tex: true,
        sequenceDiagram: true,
        flowChart: true,
        placeholder: 'AdunDocs는 MarkDown을 지원합니다...',
        theme: $scope.theme == '/css/style_white.css' ? 'default' : 'dark',
        editorTheme : $scope.theme == '/css/style_white.css' ? 'default' : 'base16-dark',
        previewTheme : $scope.theme == '/css/style_white.css' ? 'default' : 'dark',
        imageUpload    : true,
        imageFormats   : ["jpg", "jpeg", "gif", "png", "bmp", "PNG"],
        imageUploadURL : "/tistory/media",
        onfullscreen : function() {
            $('._container').css('z-index', '100');
        },
        onfullscreenExit : function() {
            $('._container').css('z-index', '1');
        },
        onchange: function() {
            $('img').on('error', function() {
                $(this).attr('src', "/img/tistory_404.png");
            });
        },
        onload: function() {
            $http.post('/tistory/post/' + postid).then(function (response) {

                var result = response.data;

                if( result.result )
                {
                    var data = result.data;

                    console.dir(data.categories);
                    console.dir(data.categories[0]);

                    if( !data.categories[0] )
                    {
                        $scope.setBlogStat(data.dateCreated, data.mt_keywords, data.permaLink, '분류없음', '분류없음', data.title, postid);
                        $scope.inputDirCategory = '분류없음';
                        $scope.inputSubCategory = '분류없음';
                    }
                    else if( data.categories[0].indexOf('/') > 0 )
                    {
                        var splitCategory = data.categories[0].split('/');
                        $scope.setBlogStat(data.dateCreated, data.mt_keywords, data.permaLink, splitCategory[0], splitCategory[1], data.title, postid);
                        $scope.inputDirCategory = splitCategory[0];
                        $scope.inputSubCategory = splitCategory[1];
                    }
                    else
                    {
                        $scope.setBlogStat(data.dateCreated, data.mt_keywords, data.permaLink, data.categories[0], '분류없음', data.title, postid);
                        $scope.inputDirCategory = data.categories[0];
                        $scope.inputSubCategory = '분류없음';
                    }

                    $scope.inputTitle       = data.title;
                    $scope.editor.insertValue(md(data.description));

                    $('#summernote').summernote('code', data.description);
                }
            });
        }
    });

    $('#summernote').summernote({
        height: 500,                 // set editor height
        minHeight: null,             // set minimum height of editor
        maxHeight: null,             // set maximum height of editor
        focus: true,                  // set focus to editable area after initializing summernote
        lang: 'ko-KR'
    });

    $('.modal').on('show.bs.modal', function () {
        $('._container').css('z-index', '100');
    });
    $('.modal').on('hide.bs.modal', function () {
        $('._container').css('z-index', '1');
    });





    $scope.blogEdit = function(event) {
        event.preventDefault();

        var contents = editor.getHTML();

        if( $scope.blogEditForm.$valid && contents )
        {
            $http({
                method  : 'POST',
                url     : '/tistory/edit',
                data    : {
                    postid: postid,
                    dirCategory: $scope.inputDirCategory,
                    subCategory: $scope.inputSubCategory,
                    title: $scope.inputTitle,
                    contents: contents
                },
                headers : {'Content-Type': 'application/json'}
            }).then(function(response) {
                var result = response.data;
                if( result )
                {
                    $scope.setBlog(function() {
                        $location.url('blog/' + $scope.inputDirCategory +'/' + $scope.inputSubCategory + '/' + $scope.inputTitle + '?check=1');

                    });
                }
                else
                {
                    alert('수정 실패');
                }
            });
        }
        else
        {
            alert('꽉꽉 채우자.');
        }

    };


}]);
