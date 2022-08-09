
const timeout = 5000;

function handlerLogin(userInfo) {
    // 登录请求体包含属性有：用户名，密码，登录时间，ip（可空），机器码
    let loginInfo = {
        user: userInfo.user,
        pwd: userInfo.pwd,
        deviceId: device.getAndroidId()
    }
    let thread, timer;
    return new Promise((resolve, reject) => {
        thread = threads.start(function () {
            let res = http.post(getUrl() + '/ycdk/users/login', loginInfo)
            resolve(res.body.json());
        })
        timer = setTimeout(() => {
            thread.interrupt();
            resolve({ code: 10, msg: "连接超时" })
            clearTimeout(timer);
        }, timeout);
    })
}

function handlerRegister(userInfo) {
    // 注册请求体包含属性有：用户名，密码，注册时间（即登录时间），ip（可空），机器码
    let registerInfo = {
        user: userInfo.user,
        pwd: userInfo.pwd1,
        deviceId: device.getAndroidId()
    }
    let thread, timer;
    return new Promise((resolve, reject) => {
        thread = threads.start(function () {
            let res = http.post(getUrl() + '/ycdk/users/register', registerInfo)
            resolve(res.body.json());
        })
        timer = setTimeout(() => {
            thread.interrupt();
            resolve({ code: 10, msg: "连接超时" })
            clearTimeout(timer);
        }, timeout);
    })
}

function handlerToken(token) {
    let thread, timer;
    return new Promise((resolve, reject) => {
        thread = threads.start(function () {
            let res = http.get(getUrl() + "/ycdk?token=" + token);
            resolve(res.body.json());
        })
        timer = setTimeout(() => {
            thread.interrupt();
            resolve({ code: 10, msg: "连接超时" })
            clearTimeout(timer);
        }, timeout);
    })
}

function getUrl() {
    return "192.168.0.199:3000"
    // return JSON.parse(files.read(files.getSdcardPath() + '/脚本/ycdk_foot/config/server.json')).serveCode;
}
module.exports = {
    handlerLogin: handlerLogin,
    handlerRegister: handlerRegister,
    handlerToken: handlerToken
}