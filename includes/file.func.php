<?php

//include_once './global.func.php';

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
//中文路径无法输出，需要将编码转换为utf8
function toUtf8($str) {
	try{
		$encode = mb_detect_encoding($str, array('ASCII','GB2312','GBK','UTF-8'));
		$str = iconv($encode,'utf-8//IGNORE', $str);
		return $str;
	} catch(Exception $e) {
		var_dump($e);
	}
}
function toGb($str) {
	$str = iconv('UTF-8','gbk//IGNORE', $str);
	return $str;
}
function pathToUtf8($path) {
    $path = toUtf8($path);
    if(! file_exists(toGb($path))) {
        $epath = urlencode($path);
        $epath = str_replace('%E3%83%BB', '%C2%B7', $epath);
        $path = urldecode($epath);
        $path = str_replace('――', '——', $path);
    }
    return $path;
}

//根据路径获取文件列表
function getFiles($dir, $result) {
    if(! file_exists($dir)) {
        $result['code'] = 1;
        $result['msg'] = "The directory does not exist.";
    } else {
        $files = array();
        get_paths($dir, $files);
        if(empty($files)) {
             $result['code'] = 1;
             $result['msg'] = "There is no file in this directory.";
         } else {
            $result['files'] = array();
            foreach($files as $file) {
                $result['files'][] = pathToUtf8($file);
            }
         }
     }
     return $result;
 }

//删除单个文件
function oneRemove($file, $result) {
    if(! file_exists($file)) {
        $result['code'] = 1;
        $result['msg'] = "There is no file: $file.";
    } else {
        if (!unlink($file)) {
            $result['code'] = 2;
            $result['msg'] = "Error removing file: $file";
        }
    }
    return $result;
}

//批量删除文件
function batchRemove($files, $result) {
    foreach($files as $file) {
        if(! file_exists($file)) {
            $result['inexistence'][] = $file;
        } else {
            if (!unlink($file)) {
                $result['failRemove'][] = $file;
            } else {
                $result['succRemove'][] = $file;
            }
        }
    }
    return $result;
}

?>