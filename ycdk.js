
// 测试机型：Red 10
// 为保证脚本的正常运行，需要设置手机如下：
// 1.手机采用数字密码
// 2.设置→省电与电池→右上角设置图标→应用智能省电→AutoJsPro→无限制
// 3.设置→锁屏→关闭防误触模式
let { swipeForUiSelector, isDeviceActive, lockDevice, unlock, by_clickWidget } = require('./api/utils');
let { qywx } = require('./const');
let { wt } = require('./const');

let settings = JSON.parse(files.read('./config/options.json'));
let offHour = Number(settings.offTime.split(":")[0]);
let offMinute = Number(settings.offTime.split(":")[1]);
let timeout = 2 * 60 * 1000;//设置打卡超时时间为2分钟
let delay = 3 * 60 * 1000; //设置重试打卡间隔时间
let failFlag = "";
let curDate = new Date();
let hour = curDate.getHours(),
    minute = curDate.getMinutes();
let flag = getClockIndex(); //标记是打什么卡
addLog("卡种:" + flag);
if (settings.workTime === "休息") {
    // 休息不打卡
    addLog("今天休息，不打卡");
    exit();

}
if (settings.offMode == "manual") {
    //手动模式下在加班时间段退出脚本，手动打加班卡或不打加班卡
    if (settings.workTime === "白班现场") {
        if (
            (curHours == 17 && curMinutes >= 45) ||
            (curHours >= 18)
        ) {
            addLog("已设置手动打卡");
            exit();
        }
    } else {
        if (curHours != 19 || (curHours == 20 && curMinutes != 0)) {
            addLog("已设置手动打卡");
            exit();
        }
    }
}
if (settings.useVolumeDown) {
    events.observeKey();
    events.onKeyUp('volume_down', function () {
        toast("已停止打卡");
        events.removeAllKeyUpListeners('volume_down');
        exit();
    })
}


let workClockThread = threads.start(workClock); //脚本打卡线程
let listenThread = threads.start(clockListener); //用户打卡监听线程
let alermThread = threads.start(clockAlerm);//警告打卡线程
let failThread = threads.start(failListener); //监听打卡失败
let repeat, isTest = false, isComplete = false;

function workClock() {

    repeat = { page: "", count: 0 };
    let startTime = Date.now();
    events.broadcast.emit("started");
    let clockInSelector, res, errInfo = { errorCount: 0, error: "" };
    while (Date.now() - startTime < timeout) {
        if (errInfo.errorCount > 2) {
            // 3次出错
            if (errInfo.error.indexOf("解锁失败") != -1) {
                back();
            }
            break;
        }
        try {
            if (isComplete) {
                throw new Error("打卡已经结束...");
            }
            unlock(settings.password);
            if (currentPackage() != "com.tencent.wework") {
                verifyRepeat("a");
                res = app.launch('com.tencent.wework');
                if (!res) {
                    throw new Error("启动企业微信失败");
                }
            }
            if (qywx.popClockIn.clockIn.exists()) {
                verifyRepeat("b");
                addLog("打卡弹窗，点击进入打卡");
                qywx.popClockIn.clockIn.findOnce().click();
            } else if (qywx.popClockIn.takePhoto.exists()) {
                verifyRepeat("o");
                addLog("拍照弹窗，点击取消");
                qywx.popClockIn.takePhoto.findOnce().click();
            }
            else if (qywx.clockIn.complete.exists()) {
                verifyRepeat("q");
                addLog("今日打卡已完成");
                exit();
            }
            else if (qywx.workbench.mark.exists()) {
                verifyRepeat("c");
                addLog("工作台界面，滑动寻找工作台并点击进入打卡");
                clockInSelector = swipeForUiSelector(qywx.workbench.clockIn, qywx.workbench.firstSelector, qywx.workbench.lastSelector, qywx.workbench.scrollRegion, -2, 2000);
                if (!clockInSelector) {
                    throw new Error('打卡寻找超时');
                }
                let clock = clockInSelector.findOnce();
                if (clock && !by_clickWidget(clock.parent().parent())) {
                    throw new Error("点击打卡超时");
                }
            } else if (qywx.workbench.entry.exists()) {
                verifyRepeat("d");
                addLog("点击工作台进入工作台界面");
                let wb = qywx.workbench.entry.findOnce();
                if (wb && !by_clickWidget(wb.parent().parent())) {
                    throw new Error("点击工作台超时");
                }


            } else if (qywx.clockIn.origin.exists()) {
                verifyRepeat("e");
                addLog("打卡界面，点击选择打卡班次");
                qywx.clockIn.origin.findOnce().click();
            } else if (qywx.clockIn.workShift.text(settings.workTime).exists()) {
                verifyRepeat("f");
                // 选择打卡班次界面
                addLog("选择打卡班次界面");
                do {
                    verifyRepeat("n");
                    qywx.clockIn.workShift.text(settings.workTime).findOnce().parent().parent().click();
                    sleep(1000);
                } while (!qywx.clockIn.selectIcon.exists());
                qywx.clockIn.confirm.findOnce().click();
            } else if (qywx.clockIn.nonnet.exists() || qywx.clockIn.nonlocate.exists()) {
                verifyRepeat("g");
                addLog("没有网络或无法定位，点击确定");
                let confirm = qywx.clockIn.failConfirm.findOnce();
                if (confirm && !by_clickWidget(confirm)) {
                    throw new Error("点击确定超时");
                }
                

            }
            else if (qywx.clockIn.onComplete.exists() || qywx.clockIn.offComplete.exists()) {
                if (!isComplete) {
                    isComplete = true;
                    addLog("已完成打卡:" + flag);
                    // if (settings.clockProgress.length == 0 || settings.clockProgress[settings.clockProgress.length - 1].item != flag) {
                    if (flag != 'other') {
                        settings.clockProgress.push({ item: flag, clocked: true });
                        files.write('./config/options.json', JSON.stringify(settings), 'utf-8');
                    }

                    // }
                    lockDevice();
                    exit();
                }

                // 如果是加班下班打卡，则根据offTime来判断是否要恢复定时任务
                // if (settings.workTime === "白班现场") {
                //     let hour = new Date().getHours();
                //     let minute = new Date().getMinutes();
                //     if (hour > 18 || (hour == 18 && minute > 0)) {
                //         // 证明是加班下班卡
                //         if (!(hour === 20 && minute <= 30)) {
                //             // 证明是非20点下班卡
                //             try {
                //                 settings.offTask = $timers.addDailyTask({
                //                     path: "/sdcard/脚本/ycdk_foot/ycdk.js",
                //                     time: wt["白班现场"].offtime
                //                 }).id;
                //                 files.write('./config/options.json', JSON.stringify(settings), 'utf-8');
                //                 addLog("已恢复正常加班打卡时间");
                //             } catch (error) {
                //                 addLog("163," + error);
                //             }
                //         }
                //     }
                // }

            }
            else if (qywx.clockIn.workOn.exists() && qywx.clockIn.inRegion.exists()) {
                verifyRepeat("h");
                addLog("在打卡界面并在打卡范围");
                let timeObj = {
                    hour: qywx.clockIn.clockHour.findOnce().text(),
                    minute: qywx.clockIn.clockMinute.findOnce().text()
                }
                // 加一层时间确认，以防定时脚本时间不准
                if (confirmTime(timeObj, true)) {
                    // 时间确认ok，可以正式点击打卡
                    addLog("时间确认ok，可以正式点击打卡上班");
                    // 这段代码为最终测试通过后要启用的代码
                    qywx.clockIn.workOn.findOnce().parent().click();
                } else {
                    throw new Error("不在上班打卡时间段");
                }
            } else if (qywx.clockIn.workOff.exists() && qywx.clockIn.inRegion.exists()) {
                verifyRepeat("i");
                addLog("在打卡界面并在打卡范围")
                // 在打卡界面并在打卡范围，点击下班打卡
                let timeObj = {
                    hour: qywx.clockIn.clockHour.findOnce().text(),
                    minute: qywx.clockIn.clockMinute.findOnce().text()
                }

                if (confirmTime(timeObj, false)) {
                    addLog("时间确认ok，可以正式点击打卡下班");
                    qywx.clockIn.workOff.findOnce().parent().click();
                } else {
                    throw new Error("不在下班打卡时间段");
                }
            } else if (qywx.clockIn.outRegionPop.exists()) {
                verifyRepeat("j")
                addLog("超出了打卡范围");
                if (!by_clickWidget(qywx.clockIn.outRegionCancel.findOnce(), 2000)) {
                    throw new Error("点击确定超出范围超时");
                }
            } else if (qywx.clockIn.outRegion.exists()) {
                verifyRepeat("k")
                addLog("超出了打卡范围");
            } else if (qywx.clockIn.locating.exists()) {
                verifyRepeat("l");
                addLog("定位中");
            }
            else {
                if (qywx.common.pageFlag1.exists() || qywx.common.pageFlag2.exists()) {
                    verifyRepeat("p");
                } else {
                    verifyRepeat("m");
                }
            }
            if (repeat.count > 10 && repeat.page == 'p') {
                addLog("非打卡页");
                back();
            }
            if (repeat.page == 'm' && repeat.count % 5 == 0) {
                addLog("未知界面");
            }
            if (repeat.count > 20) {
                // 卡界面
                throw new Error("卡界面" + repeat.page);
            }
            sleep(500);
        } catch (error) {
            if ((error + "").indexOf("ScriptInterruptedException: null") == -1) {
                addLog("" + error, "error");
                errInfo.errorCount++;
                errInfo.error = error + "";
            }
        }

    }
    sleep(500);
    addLog(`打卡出错或超时，3分钟后重试`);
    events.broadcast.emit("paused");
    lockDevice();
    clockLater(delay);
}
function clockListener() {
    let outTimer, innerTimer;
    (function watchActive() {
        outTimer = setInterval(() => {
            if (isDeviceActive()) {
                // 解锁状态，去除监视解锁的定时器,开启监视打卡的定时器
                clearInterval(outTimer);
                innerTimer = setInterval(() => {
                    if (qywx.clockIn.onComplete.exists() || qywx.clockIn.offComplete.exists()) {
                        if (!isComplete) {
                            isComplete = true;
                            addLog("已检测到打卡:" + flag);
                            // if (settings.clockProgress.length == 0 || settings.clockProgress[settings.clockProgress.length - 1].item != flag) {
                            if (flag != 'other') {
                                settings.clockProgress.push({ item: flag, clocked: true });
                                files.write('./config/options.json', JSON.stringify(settings), 'utf-8');
                            }
                            // }
                            lockDevice();
                            exit();
                        }

                    }
                    if (!device.isScreenOn()) {
                        // 屏幕被关闭了，开启监视解锁的定时器,去除监视打卡的定时器
                        clearInterval(innerTimer);
                        watchActive();
                    }
                }, 300);
            }
        }, 2000);
    })()
}
function clockAlerm() {
    // 到达时间警界线时，提醒用户手动打卡(最后2分钟)
    setInterval(() => {
        if (isTest) {
            alermThread.interrupt();
        }
        let date = new Date();
        let h = date.getHours(),
            m = date.getMinutes();
        if ((h == 7 && m == 58) || (h == 13 && m == 28)) {
            // 提醒用户打上班卡
            alermUser("注意上班打卡！！！");
        } else if ((h == 12 && m == 43) || (h == 17 && m == 43)) {
            // 提醒用户打下班卡
            alermUser("注意下班打卡！！！");
        }
        if (settings.offMode == "auto") {
            if (h == 17 && m == 58) {
                alermUser("注意上班打卡！！！");
            } else if (h == offHour && m >= offMinute + 28) {
                alermUser("注意下班打卡！！！");
            }
        }

    }, 5000);

}

function confirmTime(timeObj, on) {
    let { hour, minute } = timeObj;
    hour = Number(hour);
    minute = Number(minute);
    // 确认上班时间
    if (settings.workTime === "白班现场") {
        if (on) {
            // 上班时间段：7:00-8:00 | 12:45-13:30 
            if (
                hour == 7
                || (hour == 8 && minute == 0)
                || (hour == 12 && minute > 45)
                || (hour == 13 && minute <= 30)
                || (hour == 17 && minute >= 45)
                || (hour == 18 && minute == 0)
            ) {
                return true;
            }
            return false;
        } else {

            // 正常下班时间段：12:01-12:30 | 17:31-17:45 
            if (
                (hour == 12 && minute >= 1 && minute <= 30)
                || (hour == 17 && minute >= 31 && minute <= 45)
            ) {
                return true;
            } else if (hour > 18 || (hour == 18 && minute > 0)) {
                // 加班下班时间：offtime后

                if (offHour === hour && minute >= offMinute)
                    // 在设置的下班时间之后打卡
                    addLog("白班加班到点");
                return true;
            } else {
                return false;
            }

        }
    } else {

        if (on) {
            // 上班时间：19：00-20：00
            if (hour == 19 || (hour == 20 && minute == 0)) {
                return true;
            }
        } else {
            // 下班时间：offtime后
            if (offHour === hour && minute >= offMinute)
                // 在设置的下班时间之后打卡
                addLog("夜班加班到点");
            return true;
        }
        return false
    }
}
function failListener() {
    setInterval(() => {
        let curDate = new Date();
        let hour = curDate.getHours(),
            minute = curDate.getMinutes();
        if (isTest) {
            failThread.interrupt();
        }
        if (hour == 8 && minute > 0 && flag == 'd1') {
            // 上午上班没打卡
            failFlag = "d1";
        } else if (hour == 12 && minute >= 45 && flag == 'd2') {
            // 上午下班没打卡
            failFlag = "d2";
        } else if (hour == 13 && minute > 30 && flag == 'd3') {
            // 下午上班没打卡
            failFlag = "d3";
        } else if (hour == 17 && minute >= 45 && flag == 'd4') {
            // 下午下班没打卡
            failFlag = "d4";
        } else if (hour == 20 && minute > 0 && flag == 'n') {
            // 夜班上班没打卡
            failFlag = "n";
        } else if (hour == 18 && minute > 0 && flag == 'a' && settings.offMode == "auto") {
            // 加班上班没打卡
            failFlag = "a";
        } else if (((hour == offHour && offMinute == 0 && minute > 30) ||
            (hour == offHour + 1 && offMinute == 30 && minute > 0)) &&
            settings.offMode == "auto" && flag == 'o1'
        ) {
            // 白班下班没打卡
            failFlag = "o1";
        } else if (((hour == offHour && offMinute == 0 && minute > 30) ||
            (hour == offHour + 1 && offMinute == 30 && minute > 0)) &&
            settings.offMode == "auto" && flag == 'o2'
        ) {
            // 夜班下班没打卡
            failFlag = "o2";
        }
        if (failFlag != "") {
            settings.clockProgress.push({ item: failFlag, clocked: false });
            files.write('./config/options.json', JSON.stringify(settings), 'utf-8')
            events.broadcast.emit("failClock", failFlag);
            failFlag = "";
            lockDevice();
            addLog("打卡失败", failFlag);
            exit();
        }
    }, 10000);
}
function alermUser(text) {
    try {
        unlock(settings.password);
        toastLog(text);
        device.vibrate(2000);
        alert(text);
        alermThread.interrupt();

    } catch (error) {
        log(error)
    }
}

function verifyRepeat(sign) {

    if (repeat.page != sign) {
        repeat = { page: sign, count: 1 };
    } else {
        repeat.count++
    }
}


events.broadcast.on('start or pause', function (p) {
    if (workClockThread) {
        workClockThread.interrupt();
        workClockThread = null;
        events.broadcast.emit("paused");
    } else {
        workClockThread = threads.start(workClock);
        events.broadcast.emit("started");
    }
})

events.broadcast.on('stop', function () {
    exit();
})

events.on("exit", function () {
    events.broadcast.emit("exited");
    if (isTest) {
        addLog("测试已停止");
    }
    sleep(5000);
})

events.on("checkFloaty", function () {
    events.broadcast.emit("floatyIsActive");
})


function addLog(text, pattern) {
    log(text);
    pattern = pattern || "log";
    events.broadcast.emit('push', {
        type: pattern,
        info: text
    });
}

function getClockIndex() {
    addLog("hour=" + hour + ",minute=" + minute);
    let res;
    if (hour == 7 || (hour == 8 && minute == 0) && settings.workTime == "白班现场") {
        // 早晨上班卡
        res = 'd1';
    } else if ((hour == 12 && minute > 0 && minute < 45) && settings.workTime == "白班现场") {
        // 中午下班卡
        res = 'd2';
    } else if ((hour == 12 && minute >= 45) || (hour == 13 && minute <= 30) && settings.workTime == "白班现场") {
        // 下午上班卡
        res = 'd3';
    } else if (hour == 17 && minute > 30 && minute < 45 && settings.workTime == "白班现场") {
        // 下午下班卡
        res = 'd4';
    } else if ((hour == 17 && minute >= 45) || (hour == 18 && minute == 0) && settings.workTime == "白班现场") {
        // 加班上班卡
        res = 'a';
    } else if ((offHour === hour && minute >= offMinute)) {
        // 下班卡
        res = 'o';
    } else if (hour == 19 || (hour == 20 && minute == 0) && settings.workTime == "夜班现场") {
        // 夜班上班卡
        res = 'n'
    } else {
        res = 'other';
    }
    return res;
}


events.broadcast.on('test', function () {
    isTest = true;
    addLog("卡种: test" + flag);
})


function clockLater() {
    let startTime = Date.now();
    let timer = setInterval(() => {
        if (Date.now() - startTime >= delay) {
            addLog("重新开始打卡");
            workClock();
            clearInterval(timer);
        }
    }, 1000);
}