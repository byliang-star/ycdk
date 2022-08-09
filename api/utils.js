// 此模块放公用的方法



/**
 * @description: 区域滑动寻找控件，可以设置超时时间
 * @param {UiSelector} findSelector 要找的控件选择器
 * @param {UiSelector} firstSelector 滑动范围中第一个控件选择器
 * @param {UiSelector} lastSelector 滑动范围中最后一个控件选择器
 * @param {array} region 给定一个区域
 * @param {number} orientation 设置滑动方向，1为从左到右，-1为从右到左，2为从上到下，-2为从下到上
 * @param {number} timeout 设置超时时间，单位毫秒
 * @return {object} 如果找到，就返回true，否则返回false
 */
function swipeForUiSelector(findSelector, firstSelector, lastSelector, region, orientation, timeout) {
    if (findSelector.exists()) {
        return findSelector;
    }
    region = dealReagion(region);
    let sTime = Date.now();

    // 没找到，滑动断续找
    let x1, x2, y1, y2, points, curOrientation = orientation;
    do {
        if (Date.now() - sTime >= timeout) {
            log('滑动找控件超时');
            return null;
        }
        if (firstSelector.exists()) {
            curOrientation = orientation;
        }
        if (lastSelector.exists()) {
            curOrientation = -orientation;
        }
        points = getRandSwipePoint(region, curOrientation);
        ({ x: x1, y: y1 } = points.startP);
        ({ x: x2, y: y2 } = points.endP);
        swipe(x1, y1, x2, y2, by_getRand(500, 1000));

        sleep(1000);

        if (findSelector.exists()) {
            return findSelector;
        }



    } while (true);


    




    function getRandSwipePoint(region, orientation) {
        let [x1, y1, x2, y2] = region,
            startP = {},
            endP = {},
            minDis, maxDis, swipeDis
        if (orientation === 1) {
            // 从左到右滑动
            startP.x = by_getRand(x1, (x1 + x2) / 2);
            startP.y = by_getRand((y2 + y1) / 4, (y2 + y1) * 3 / 4);
            minDis = (x2 - startP.x) > 100 ? (x2 - startP.x) / 5 : 20;
            maxDis = (x2 - startP.x) * 3 / 4 <= minDis ? minDis : (x2 - startP.x) * 3 / 4;
            swipeDis = by_getRand(minDis, maxDis);
            endP.x = startP.x + swipeDis;
            endP.y = by_getRand(startP.y - 15, startP.y + 15)
        } else if (orientation === -1) {
            // 从右到左滑动
            startP.x = by_getRand((x1 + x2) / 2, x2);
            startP.y = by_getRand((y2 + y1) / 4, (y2 + y1) * 3 / 4);
            minDis = (startP.x - x1) > 100 ? (startP.x - x1) / 5 : 20;
            maxDis = (startP.x - x1) * 3 / 4 <= minDis ? minDis : (startP.x - x1) * 3 / 4;
            swipeDis = by_getRand(minDis, maxDis);
            endP.x = startP.x - swipeDis;
            endP.y = by_getRand(startP.y - 15, startP.y + 15);
        } else if (orientation === 2) {
            // 从上到下滑动
            startP.x = by_getRand((x2 + x1) / 4, (x2 + x1) * 3 / 4);
            startP.y = by_getRand(y1, (y1 + y2) / 2);
            minDis = (y2 - startP.y) > 100 ? (y2 - startP.y) / 5 : 20;
            maxDis = (y2 - startP.y) * 3 / 4 <= minDis ? minDis : (y2 - startP.y) * 3 / 4;
            swipeDis = by_getRand(minDis, maxDis);
            endP.x = by_getRand(startP.x - 15, startP.x + 15);
            endP.y = startP.y + swipeDis;
        } else {
            // 从下到上滑动
            startP.x = by_getRand((x2 + x1) / 4, (x2 + x1) * 3 / 4);
            startP.y = by_getRand((y1 + y2) / 2, y2);
            minDis = (startP.y - y1) > 100 ? (startP.y - y1) / 5 : 20;
            maxDis = (startP.y - y1) * 3 / 4 <= minDis ? minDis : (startP.y - y1) * 3 / 4;
            swipeDis = by_getRand(minDis, maxDis);
            endP.x = by_getRand(startP.x - 15, startP.x + 15);
            endP.y = startP.y - swipeDis;
        }
        return { startP: startP, endP: endP }
    }


}

function by_clickWidget(widget, timeout) {
    if(!widget) return;
    timeout = timeout || 2000;
    let time = Date.now();
    while (Date.now() - time < timeout) {
        if (widget.click()) {
            return true;
        }
        sleep(300);
    }
    return false;
}
function by_getRand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//将[x1,y1,x2,y2]的转换为全分辨率[x1,y1,x2,y2]的区域
function dealReagion(region) {
    let [x1, y1, x2, y2] = region,
        _x = device.width / 1080,
        _y = device.height / 2400;
    x1 = x1 * _x;
    x2 = x2 * _x;
    y1 = y1 * _y;
    y2 = y2 * _y;
    return [x1, y1, x2, y2];
}

function waitForUiSelector(uiSelector, timeout) {
    let time = Date.now();
    while (!uiSelector.exists()) {
        if (Date.now() - time >= timeout) {
            return false;
        }
        sleep(300);
    }
    return true;
}

function by_equals(x, y) {
    var f1 = x instanceof Object;
    var f2 = y instanceof Object;
    if (!f1 || !f2) {
        return x === y
    }
    if (Object.keys(x).length !== Object.keys(y).length) {
        return false
    }
    for (var p in x) {
        var a = x[p] instanceof Object;
        var b = y[p] instanceof Object;
        if (a && b) {
            if (!by_equals(x[p], y[p])) {
                return false;
            }
        } else if (x[p] !== y[p]) {
            return false;
        }
    }
    return true;
}
//判断是否是数组
function by_isArray(obj) {
    return Object.prototype.toString.call(obj) == '[object Array]';
}
//判断是否是对象
function by_isObject(obj) {
    return Object.prototype.toString.call(obj) == '[object Object]';
}
// 对象，数组和基本数据类型的深拷贝
function by_deepClone(o) {
    let res;
    if (o instanceof Object) {
        res = by_isArray(o) ? [] : {};
        for (let key in o) {
            if (Object.hasOwnProperty.call(o, key)) {
                res[key] = by_deepClone(o[key]);
            }
        }
    } else {
        res = o;
    }
    return res;
}


// 事件防抖
function by_trigger(fn, delay) {
    // 设置time为定时器，初始为 null
    var time = null;
    // 闭包原理，返回一个函数
    return function () {
        // 如果定时器存在清空定时器
        if (time) {
            clearTimeout(time);
        }
        // 设置定时器，规定时间后执行真实要执行的函数
        time = setTimeout(() => {
            // 将参数传递给真实执行的函数，因为箭头函数继承父级作用域，所以可以用arguments

            fn.apply(this, arguments);
        }, delay);
    };
}

// 将时间格式化为**yyyy-mm-dd hh:mm:ss**
function by_getFormTime(time) {
    time = time || new Date();
    let year = time.getFullYear(),
        month = time.getMonth() + 1,
        day = time.getDate(),
        hour = time.getHours(),
        minute = time.getMinutes(),
        second = time.getSeconds();
    return `**${year}-${by_zeroFill(month)}-${by_zeroFill(day)} ${by_zeroFill(hour)}:${by_zeroFill(minute)}:${by_zeroFill(second)}**`;
}

// 将日期格式化为yyyy-mm-dd
function by_formDate(date) {
    date = date || new Date();
    let y = date.getFullYear(),
        m = date.getMonth(),
        d = date.getDate();
    return y + "-" + (m + 1) + "-" + d;
}
function by_zeroFill(num) {
    num = Number(num);
    if (typeof num != 'number' || num < 0) {
        return;
    }
    if (parseInt(num) != num) {
        return;
    }
    if (num >= 0 && num < 10) {
        return "0" + num;
    } else {
        return "" + num;
    }
}
// 封装点击一个控件直到另一个控件存在
function by_clickUntilFindWidget(clickWidget, findSelector, timeout) {
    let time = Date.now();
    while (Date.now() - time < timeout) {
        if (findSelector.exists()) {
            return true;
        }
        clickWidget.click();
        sleep(500);
    }
    return false;
}

function isDeviceActive() {
    // 判断手机当前是否是解锁状态
    return !packageName("com.android.systemui").exists();
}

/**
 * 获取内置资源的Drawable
 * @param {*} resName
 * @param {*} size
 */
function by_getResDrawable(resName, size) {
    let oldBmp = BitmapFactory.decodeResource(resources, by_getResDrawableID(resName));
    let newBmp = Bitmap.createScaledBitmap(oldBmp, dp2px(size), dp2px(size), true);
    let drawable = new BitmapDrawable(resources, newBmp);
    oldBmp.recycle();
    return drawable;
}

/**
 * 获取内质资源 DrawableID
 * @param {*} name
 */
function by_getResDrawableID(name) {
    return resources.getIdentifier(name, "drawable", context.getPackageName());
}

/**
 * Dp转Px
 * @param {*} dp
 * @returns
 */
function dp2px(dp) {
    return parseInt(Math.floor(dp * scale + 0.5));
}

/**
 * Px转Dp
 * @param {*} px
 * @returns
 */
function px2dp(px) {
    return parseInt(Math.floor(px / scale + 0.5));
}


function lockDevice() {
    let p;
    while (device.isScreenOn()) {
        if (quickSettings()) {
            sleep(600);
            if (text("锁屏").exists()) {
                p = text("锁屏").findOne().parent().parent().parent().bounds();
                click(p.centerX(), p.centerY());
            }
        }
        sleep(500);
    }
    log("已锁屏")
}
function unlock(password) {
    if (isDeviceActive()) {
        // 一开始就在解锁唤醒状态
        // log(auto.rootInActiveWindow);//获取当前活跃的窗口（获取到焦点、正在触摸的窗口）的布局根元素
        return;
    }
    if (!device.isScreenOn()) {
        // 屏幕未唤醒
        device.wakeUp()
        sleep(1000);
        if (!device.isScreenOn()) {
            // 屏幕无法唤醒
            throw new Error("无法唤醒屏幕");
        }

    }
    // 屏幕已唤醒，上滑解锁
    swipe(500, 2000, 500, 1500, 210);
    sleep(500)
    if (isDeviceActive()) {
        // 没有密码，不需要解锁
        return;
    }
    // 有密码，需要解锁
    for (var i = 0; i < password.length; i++) {
        var p = text(password[i].toString()).findOne().bounds();
        press(p.centerX(), p.centerY(), by_getRand(3, 8));
    }
    sleep(600);
    if (!isDeviceActive()) {
        throw new Error("密码错误，解锁失败");
    }

}


module.exports = {
    unlock: unlock,
    lockDevice: lockDevice,
    swipeForUiSelector: swipeForUiSelector,
    waitForUiSelector: waitForUiSelector,
    by_equals: by_equals,
    by_deepClone: by_deepClone,
    by_trigger: by_trigger,
    by_formDate: by_formDate,
    by_clickUntilFindWidget: by_clickUntilFindWidget,
    isDeviceActive: isDeviceActive,
    by_zeroFill: by_zeroFill,
    by_getFormTime: by_getFormTime,
    by_getResDrawable: by_getResDrawable,
    by_clickWidget: by_clickWidget
}