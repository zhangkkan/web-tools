<?php

include_once './global.func.php';
include_once './file.func.php';

//获取目录下所有文件
function get_paths($path, &$paths) {
    if(is_dir($path)) {
        $dir = opendir($path);
        while(($file = readdir($dir)) !== false) {
            if($file != "." && $file != ".." && $file != "..") {
                get_paths(rtrim($path, '\\') . '\\' . $file, $paths);
            }
        }
        closedir($dir);
    }
    if(is_file($path)) {
        if(strripos($path, '~$')) {
            echo 'temporary file: ' . $path;
        } else {
            $paths[] = $path;
        }
    }
}

?>