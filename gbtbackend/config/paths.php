<?php
class Paths
{
    public static $uploadDir = __DIR__ . '/../storage/apps/';

    public static function initStorage()
    {
        if (!is_dir(self::$uploadDir)) {
            @mkdir(self::$uploadDir, 0777, true);
        }
        if (is_dir(self::$uploadDir) && !is_writable(self::$uploadDir)) {
            @chmod(self::$uploadDir, 0777);
        }
    }
}
