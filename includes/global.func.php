<?php

//打印数组
function p() {
	$argvs = func_get_args();
	echo "<div style=\"text-align: left;\">\r\n";
	foreach ($argvs as $v) {
		echo "<xmp>";
		print_r($v);
		echo "</xmp>\r\n";
	}
	echo "\r\n</div>\r\n";
}

?>