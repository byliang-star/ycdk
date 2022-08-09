/*
 * @Author: byliang-star byliang09@163.com
 * @Date: 2022-06-23 06:38:03
 * @LastEditors: byliang-star byliang09@163.com
 * @LastEditTime: 2022-06-30 18:25:04
 * @FilePath: \ycdk_foot\const.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const QYWX = {
    common: {
        pageFlag1: id("kz6").className("TextView"),
        pageFlag2: id("j2d")
    },
    // 工作台
    workbench: {
        mark: id("kze").className("TextView").text("工作台"),
        entry: id("gb9").className("TextView").text("工作台"),
        firstSelector: id("h93").className("TextView").text("上下游"),
        lastSelector: id("h93").className("TextView").text("上门服务"),
        clockIn: id("h93").className("TextView").text("打卡"),
        scrollRegion: [106, 270, 996, 2203]
    },
    popClockIn: {
        clockIn: id("i38").className("TextView").text("立即打卡"),
        takePhoto: id("b05").className("TextView").text("取消"),
    },
    clockIn: {

        origin: id("jem").className("TextView").text("选班次打卡"),
        workShift: id("kt3").className("TextView"),
        selectIcon: id("bg7").className("ImageView"),
        confirm: id("kzm").className("TextView").text("确定"),
        workOn: id("bhb").className("TextView").text("上班打卡"),
        workOff: id("bhb").className("TextView").text("下班打卡"),
        overWorkOn: id("bhb").className("TextView").text("加班上班"),
        outRegion: id("h_d").className("TextView").text("不在打卡范围内"),
        inRegion: id("mh").className("TextView").text("你已在打卡范围内"),
        clockHour: id("cia").className("TextView"),
        clockMinute: id("cib").className("TextView"),
        onComplete: id("sr").className("TextView").text("上班·正常"),
        offComplete: id("sr").className("TextView").text("下班·正常"),
        complete: id("bhf").className("TextView").text("今日打卡已完成"),
        nonnet: id("cjj").className("TextView").text("网络错误"),
        nonlocate: id("cjj").className("TextView").text("定位失败"),
        failConfirm: id("cjg").className("TextView").text("确定"),
        outRegionPop: id("kmq").className("TextView").text("不在打卡范围内"),
        outRegionCancel: id("b05").className("TextView").text("取消"),
        locating: id("mh").className("TextView").text("定位中"),
    }
}
let workTime = {
    "白班现场": {
        normal: [
            new Date(0, 0, 0, 7, 40, 0),//早晨上班卡7:30-8:00
            new Date(0, 0, 0, 11, 56, 0),//中午下班卡12:01-12:30
            new Date(0, 0, 0, 13, 10, 0),//中午上班卡12:50-13:30
            new Date(0, 0, 0, 17, 26, 0),//下午下班卡17:31-17:40
            new Date(0, 0, 0, 17, 40, 0),//晚上加班卡17:45-18:00
        ],
        offtime: new Date(0, 0, 0, 19, 56, 0),//晚上下班卡20:01-20:30，
        initTime: new Date(0, 0, 0, 23, 56, 0),//00:01初始化，
    },
    "夜班现场": {
        normal: [
            new Date(0, 0, 0, 19, 25, 0),//晚上上班卡19:30-20:00
        ],
        offtime: new Date(0, 0, 0, 7, 56, 0),//早上下班卡8:01-8:30
        initTime: new Date(0, 0, 0, 11, 56, 0),//12:01初始化，
    },
    "休息": { initTime: new Date(0, 0, 0, 23, 56, 0) },//00:01初始化，
}

let defaultTime = {
    "t1": { "h1": "07", "m1": "30" },
    "t2": { "h2": "12", "m2": "01" },
    "t3": { "h3": "13", "m3": "15" },
    "t4": { "h4": "17", "m4": "31" },
    "t5": { "h5": "17", "m5": "50" },
    "t6": { "h6": "20", "m6": "01" },
    "t7": { "h7": "19", "m7": "30" },
    "t8": { "h8": "08", "m8": "01" },
}
module.exports = {
    qywx: QYWX,
    wt: workTime,
    defaultTime: defaultTime
}