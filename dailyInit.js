

let settings = JSON.parse(files.read('./config/options.json'));
let offHour = settings.offTime.split(":")[0];
let offMinute = settings.offTime.split(":")[1];
settings.clockProgress = []; //清零打卡进度
log("进度清零");
if (settings.workTime == "白班现场" && (offHour != 20 || (offHour == 20 && offMinute != 0))) {
    settings.offTime = "20:00"; //恢复默认的下班时间
    // 恢复默认的定时任务
    try {
        settings.offTask && $timers.removeTimedTask(settings.offTask);
        settings.offTask = $timers.addDailyTask({
            path: "/sdcard/脚本/ycdk_foot/ycdk.js",
            time: new Date(0, 0, 0, 19, 56, 0)
        }).id;
        log("已恢复正常下班打卡时间");
    } catch (error) {
        log("恢复定时任务失败" + error, error);
    }
} else if (settings.workTime == "夜班现场" && (offHour != 8 || (offHour == 8 && offMinute != 0))) {
    settings.offTime = "08:00"; //恢复默认的下班时间
    // 恢复默认的定时任务
    try {
        settings.offTask && $timers.removeTimedTask(settings.offTask);
        settings.offTask = $timers.addDailyTask({
            path: "/sdcard/脚本/ycdk_foot/ycdk.js",
            time: new Date(0, 0, 0, 7, 56, 0)
        }).id;

        log("已恢复正常下班打卡时间");
    } catch (error) {
        log("恢复定时任务失败" + error, error);
    }
}

files.write('./config/options.json', JSON.stringify(settings), 'utf-8');