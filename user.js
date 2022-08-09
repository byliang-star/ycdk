// 用户界面
"ui";

let { by_trigger, by_zeroFill, by_getFormTime, by_getResDrawable, by_equals } = require('./api/utils');
let { wt, defaultTime } = require('./const');
//tabs 数据
let widget_style = {
    title_color: "#000000"
}
let tabs_data = {
    //tabs 背景
    bg: "#ffffff",
    selectColor: {
        //当前页面选中颜色
        on: "#00ffff",
        //当前页面未选中颜色
        off: "#999999"
    },
    //图标大小
    srcSize: 32,
    //字体大小
    textSize: 14,
    //动画缩放比例 未加入动画效果
    zoom: 1.2,
    //是否显示指示器小横条
    tabs_h: true,
    //tabs 按钮数据
    data: [
        ["设置", "@drawable/ic_settings_black_48dp"],
        ["我的打卡", "@drawable/ic_perm_contact_calendar_black_48dp"]
    ],
}

//tabs按钮 布局视图信息
let tabs_view = []
//tabs按钮 当前选中按钮
let selectView = 0;

//自定义控件 tabs按钮
let Tabs_btn_layout = function () {
    //继承ui.Widget
    util.extend(Tabs_btn_layout, ui.Widget);
    function Tabs_btn_layout() {
        //调用父类构造函数
        ui.Widget.call(this);
        //自定义属性data ,定义控件的每个参数 传入值为整数
        this.defineAttr("data", (view, attr, value, defineSetter) => {
            //获取当前控件的参数值 tabs_data.data[value] 赋值到arr数组
            arr = tabs_data.data[value]
            //设定 _text控件文本
            view._text.setText(arr[0])
            //设定 _src控件图片
            view._src.attr("src", arr[1])
            //把当前控件信息集合到tabs_view数组里面
            tabs_view[tabs_view.length] = view
            //如果当前控件为初始值 则设定控件颜色为选中颜色 selectView==value==0 
            if (value == selectView) {
                view._src.attr("tint", tabs_data.selectColor.on)
                view._text.setTextColor(colors.parseColor(tabs_data.selectColor.on))
            }
        });
    }
    Tabs_btn_layout.prototype.render = function () {
        return (
            //1.0.0-1 修改 w="*" 参数 屏幕方向发生变化时 宽度自适配
            <vertical id="_bg" w="*" bg="{{tabs_data.bg}}" padding="0 10" gravity="center" >
                <img w="{{tabs_data.srcSize}}" id="_src" tint="{{tabs_data.selectColor.off}}" />
                <text w="auto" id="_text" textSize="{{tabs_data.textSize}}" textColor="{{tabs_data.selectColor.off}}" />
            </vertical>
        )
    }
    ui.registerWidget("tabs_btn-layout", Tabs_btn_layout);
    return Tabs_btn_layout;
}()

//自定义控件 tabs
let Tabs_layout = function () {
    util.extend(Tabs_layout, ui.Widget);
    function Tabs_layout() {
        ui.Widget.call(this);
        this.defineAttr("data", (view, attr, value, defineSetter) => {
            //遍历 tabs_data.data数组 
            for (let i = 0; i < tabs_data.data.length; i++) {
                time = i
                //1.0.0-1 增加 layout_weight="1"参数 屏幕方向发生变化时 宽度自适配
                ui.inflate(<tabs_btn-layout data="{{time}}" layout_weight="1" />, view._tabs, true)
            }
            //根据tabs_h值设置 _color颜色
            tabs_data.tabs_h ? _color = tabs_data.selectColor.on : _color = "#00000000";
            view.tabs.selectedTabIndicatorColor = colors.parseColor(_color);//设置tabs指示器颜色
        });
    }
    Tabs_layout.prototype.render = function () {
        return (
            <card w="*" h="auto" cardElevation="5" foreground="?selectableItemBackground">
                <horizontal id="_tabs" />
                <tabs id="tabs" />
            </card>
        )
    }
    ui.registerWidget("tabs-layout", Tabs_layout);
    return Tabs_layout;
}()

importClass(android.view.MenuItem);
importClass(android.graphics.Bitmap);
importClass(android.graphics.BitmapFactory);
importClass(android.graphics.drawable.ColorDrawable);
importClass(android.graphics.drawable.BitmapDrawable);

const resources = context.getResources();
const scale = resources.getDisplayMetrics().density;

let offMode = "",
    checkEnableTimer,
    isFloatyActive = false,
    testScript = null,
    useDefined = false,
    clockTime = {};
let settings = {
    workTime: '白班',
    tasks: [],
    password: "0000",
};
let clockedColor = "#11ba17",
    failedColor = "#c50f06",
    normalColor = "#373838";
let allDayClockLines = ['d1', 'd2', 'd3', 'd4', 'a', 'o1'],
    allNightClockLines = ['n', 'o1'];
let allClockLines = allDayClockLines.concat(allNightClockLines);
ui.layout(
    <frame>
        <vertical>
            <appbar w="*" h="auto">
                <toolbar id="toolbar" title="{{tabs_data.data[0][0]}}" />
            </appbar>
            <viewpager w="*" id="viewpager" layout_alignParentBottom="true" >
                <scroll>
                    <vertical padding="10 10 10 80">
                        <card w="*" h="auto" margin="10 5" cardCornerRadius="2dp" cardElevation="1dp" gravity="center_vertical">
                            <vertical padding="18 8" h="auto">
                                <linear>
                                    <Switch id="autoService" text="无障碍服务：" checked="{{auto.service != null}}" w="auto" textStyle="bold" padding="0 8 0 8" />
                                </linear>
                                <linear>
                                    <Switch id="enableOrNot" text="启用脚本" textStyle="bold" padding="0 8 0 8" />
                                </linear>
                                <linear>
                                    <Switch id="floatySwitch" text="启用悬浮窗" textStyle="bold" padding="0 8 0 8" />
                                </linear>
                                <linear>
                                    <Switch id="useVolumeDown" text="使用音量下键停止脚本" textStyle="bold" padding="0 8 0 8" />
                                </linear>
                                <vertical>
                                    <text textStyle="bold" color="{{widget_style.title_color}}" text="请输入锁屏密码，用于打卡时唤醒设备" />
                                    <linear>
                                        <input id="pwd" gravity="center" w="80" inputType="numberPassword" textSize="14sp" />
                                        <button style="Widget.AppCompat.Button.Borderless.Colored" id="updatePwd" w="60" text="更新" />
                                    </linear>
                                </vertical>
                                <vertical>
                                    <Switch id="userDefined" text="自定义打卡时间" textStyle="bold" padding="0 8 0 8" />
                                    <vertical id="dayTime">
                                        <horizontal>
                                            <text text="上午打卡：" />
                                            <input id="h1" text="07" textSize="14sp" gravity="center" paddingLeft="10" paddingRight="10" />
                                            <text text=":" />
                                            <input id="m1" text="30" textSize="14sp"
                                                gravity="center" paddingLeft="10" paddingRight="10" />
                                            <text text="-" />
                                            <input id="h2" text="12" textSize="14sp" gravity="center" paddingLeft="10" paddingRight="10" />
                                            <text text=":" />
                                            <input id="m2" text="01" textSize="14sp" gravity="center" paddingLeft="10" paddingRight="10" />
                                        </horizontal>
                                        <horizontal>
                                            <text text="下午打卡：" />
                                            <input id="h3" text="13" textSize="14sp" gravity="center" paddingLeft="10" paddingRight="10" />
                                            <text text=":" />
                                            <input id="m3" text="10" textSize="14sp" gravity="center" paddingLeft="15" paddingRight="10" />
                                            <text text="-" />
                                            <input id="h4" text="17" textSize="14sp" gravity="center" paddingLeft="10" paddingRight="10" />
                                            <text text=":" />
                                            <input id="m4" text="31" textSize="14sp" gravity="center" paddingLeft="10" paddingRight="10" />
                                        </horizontal>
                                        <horizontal>
                                            <text text="晚上打卡：" />
                                            <input id="h5" text="17" textSize="14sp" gravity="center" paddingLeft="10" paddingRight="10" />
                                            <text text=":" />
                                            <input id="m5" text="50" textSize="14sp" gravity="center" paddingLeft="10" paddingRight="10" />
                                            <text text="-" />
                                            <input id="h6" text="20" textSize="14sp" gravity="center" paddingLeft="10" paddingRight="10" enabled="false" />
                                            <text text=":" />
                                            <input id="m6" text="01" textSize="14sp" gravity="center" paddingLeft="10" paddingRight="10" enabled="false" />
                                        </horizontal>
                                    </vertical>
                                    <horizontal id="nightTime">
                                        <text text="夜班打卡：" />
                                        <input id="h7" text="19" textSize="14sp" gravity="center" paddingLeft="10" paddingRight="10" />
                                        <text text=":" />
                                        <input id="m7" text="30" textSize="14sp" gravity="center" paddingLeft="10" paddingRight="10" />
                                        <text text="-" />
                                        <input id="h8" text="08" textSize="14sp" gravity="center" paddingLeft="10" paddingRight="10" enabled="false" />
                                        <text text=":" />
                                        <input id="m8" text="01" textSize="14sp" gravity="center" paddingLeft="10" paddingRight="10" enabled="false" />
                                    </horizontal>

                                </vertical>
                                <linear>
                                    <text textStyle="bold" color="{{widget_style.title_color}}" text="请选择班次" marginBottom="10" />
                                    <radiogroup id="radios" orientation="horizontal" marginBottom="10">
                                        <radio id="dayshift" text="白班现场" checked="true" />
                                        <radio id="nightshift" text="夜班现场" />
                                        <radio id="dayoff" text="休息" />
                                    </radiogroup>
                                </linear>
                                <vertical id="mode">
                                    <text textStyle="bold" color="{{widget_style.title_color}}" text="请选择加班打卡方式" marginBottom="10" />
                                    <radiogroup id="modeRadio" orientation="horizontal" marginBottom="10" >
                                        <radio id="automode" text="自动打卡" />
                                        <radio id="manualmode" text="手动打卡" />
                                    </radiogroup>
                                    <vertical id="offTime">
                                        <text textStyle="bold" color="{{widget_style.title_color}}" text="下班自动打卡时间" marginBottom="10" />
                                        <timepicker id="timepicker" timePickerMode="spinner" />
                                    </vertical>
                                </vertical>
                                <linear marginTop="20">
                                    <button style="Widget.AppCompat.Button.Colored" id="reset" text="重置" marginLeft="100" />
                                    <button style="Widget.AppCompat.Button.Colored" id="update" text="更新" />
                                </linear>
                            </vertical>
                        </card>
                    </vertical>
                </scroll>
                <vertical>
                    <card margin="5 10 5 5" cardCornerRadius="2dp" cardElevation="1dp" cardBackgroundColor="#d1bdbd" h="auto">
                        <vertical h="auto" padding="20 5 20 5" >
                            <text textSize="18sp" text="打卡信息" textStyle="bold" textColor="#2ebaba" />
                            <linear>
                                <linear layout_weight="1">
                                    <text text="启用状态：" />
                                    <text id="enable" textStyle="bold" text="enable" />
                                </linear>
                                <linear layout_weight="1">
                                    <text text="班次：" />
                                    <text id="workTime" textStyle="bold" text="workTime" />
                                </linear>

                            </linear>
                            <linear>
                                <linear layout_weight="1">
                                    <text text="加班打卡模式：" />
                                    <text id="offMode" textStyle="bold" text="offMode" />
                                </linear>
                                <linear layout_weight="1">
                                    <text text="下班时间：" />
                                    <text id="off" textStyle="bold" text="offTime" />
                                </linear>


                            </linear>
                            <text textSize="18sp" text="今日打卡" textStyle="bold" textColor="#2ebaba" marginTop="10" />
                            <vertical id="clockLine">

                            </vertical>
                        </vertical>
                        <View bg="#2196f3" h="150" w="10" />
                    </card>
                    <scroll padding="20 0 20 80">
                        <vertical id="logs">
                        </vertical>
                    </scroll>
                </vertical>

            </viewpager>
        </vertical>
        <tabs-layout data="" layout_gravity="bottom" />
    </frame>
)
ui.run(function () {
    // 读取配置文件（如果不存在，则使用默认值），获取初始设置值，并初始化UI
    try {
        settings = JSON.parse(files.read('./config/options.json'));
    } catch (error) {
        log(error)
    }
    initsettings();
    initInfos();
    initListener();
    initUi();
    initBroadcast();
})
// 初始化UI界面
function initUi() {
    activity.setSupportActionBar(ui.toolbar);
    ui.tabs.setupWithViewPager(ui.viewpager);//绑定ViewPager到指示器

    //页面更改侦听器
    ui.viewpager.setOnPageChangeListener({
        //已选定页面发生改变时触发
        onPageSelected: function (index) {
            // log("上次选中" + tabs_view[selectView]._text.text())
            //设置selectView上次页面 图案和字体颜色为未选中颜色 tabs_data.selectColor.off
            tabs_view[selectView]._src.attr("tint", tabs_data.selectColor.off)
            tabs_view[selectView]._text.setTextColor(colors.parseColor(tabs_data.selectColor.off))
            //设置当前页面 图案和字体颜色为选中颜色 tabs_data.selectColor.on
            tabs_view[index]._src.attr("tint", tabs_data.selectColor.on)
            tabs_view[index]._text.setTextColor(colors.parseColor(tabs_data.selectColor.on))
            //更改标题 title 内容
            ui.toolbar.setTitle(tabs_view[index]._text.text())
            //设置当前页面为 index
            selectView = index
        }
    })
    ui.emitter.on("create_options_menu", (menu) => {
        //添加按钮
        let item = menu.add(0, 0, 0, "测试");;
        //指定按钮显示的位置
        item.setShowAsAction(MenuItem.SHOW_AS_ACTION_IF_ROOM | MenuItem.SHOW_AS_ACTION_WITH_TEXT);
        //获取指定大小的内置资源Drawable
        let mDrawable = by_getResDrawable("@drawable/ic_touch_app_black_48dp", 32);
        //图片着色
        mDrawable.setTint(colors.parseColor("#FFFFFF"));
        //设置item图标
        item.setIcon(mDrawable);

        //添加按钮
        item = menu.add(0, 0, 0, "日志");;
        //指定按钮显示的位置
        item.setShowAsAction(MenuItem.SHOW_AS_ACTION_IF_ROOM | MenuItem.SHOW_AS_ACTION_WITH_TEXT);
        //获取指定大小的内置资源Drawable
        mDrawable = by_getResDrawable("@drawable/ic_assignment_black_48dp", 32);
        //图片着色
        mDrawable.setTint(colors.parseColor("#FFFFFF"));
        //设置item图标
        item.setIcon(mDrawable);

        //添加按钮
        item = menu.add(0, 0, 0, "清空日志");;
        //指定按钮显示的位置
        item.setShowAsAction(MenuItem.SHOW_AS_ACTION_IF_ROOM | MenuItem.SHOW_AS_ACTION_WITH_TEXT);
        //获取指定大小的内置资源Drawable
        mDrawable = by_getResDrawable("@drawable/ic_delete_black_48dp", 32);
        //图片着色
        mDrawable.setTint(colors.parseColor("#FFFFFF"));
        //设置item图标
        item.setIcon(mDrawable);

        //添加按钮
        item = menu.add(0, 0, 0, "关于");;
        //指定按钮显示的位置
        item.setShowAsAction(MenuItem.SHOW_AS_ACTION_IF_ROOM | MenuItem.SHOW_AS_ACTION_WITH_TEXT);
        //获取指定大小的内置资源Drawable
        mDrawable = by_getResDrawable("@drawable/ic_info_outline_black_48dp", 32);
        //图片着色
        mDrawable.setTint(colors.parseColor("#FFFFFF"));
        //设置item图标
        item.setIcon(mDrawable);


        item = menu.add(0, 0, 0, "关闭");;
        //指定按钮显示的位置
        item.setShowAsAction(MenuItem.SHOW_AS_ACTION_IF_ROOM | MenuItem.SHOW_AS_ACTION_WITH_TEXT);
        //获取指定大小的内置资源Drawable
        mDrawable = by_getResDrawable("ic_close_black_48dp", 32);
        //图片着色
        mDrawable.setTint(colors.parseColor("#FFFFFF"));
        //设置item图标
        item.setIcon(mDrawable);
        return true;
    });
    ui.emitter.on("options_item_selected", (e, item) => {
        switch (item.getTitle()) {
            case "关闭":
                exit();
                break;
            case "关于":
                if (!$floaty.checkPermission()) {
                    toast("本脚本需要悬浮窗权限来显示悬浮窗，请在随后的界面中允许并重新运行本脚本。");
                    $floaty.requestPermission();
                } else {
                    showInfo();
                }
                break;
            case "测试":
                if (auto.service == null) {
                    toast("请先启用无障碍服务");
                    break;
                }
                toast("开始测试打卡，可以按音量下键终止测试");
                if (testScript) {
                    testScript.getEngine().forceStop();
                }

                testScript = engines.execScriptFile('./ycdk.js');
                setTimeout(() => {
                    events.broadcast.emit('test');
                }, 1000);
                break;
            case "日志":
                engines.execScriptFile('./log.js');
                break;
            case "清空日志":
                files.write('./config/log.txt', '', 'utf-8');
                toast("已清空日志");
                break;
        }
        e.consumed = true;
    });
}
// 初始化监听器
function initListener() {
    // 监听密码修改按钮
    ui.updatePwd.on('click', function () {
        // if (!$floaty.checkPermission()) {
        //     toast("本脚本需要悬浮窗权限来显示悬浮窗，请在随后的界面中允许并重新运行本脚本。");
        //     $floaty.requestPermission();
        // } else {
        //     dialogs.rawInput("请输入", settings.password)
        //         .then(pwd => {
        //             if (pwd.length < 4) {
        //                 toast("解屏密码不能小于四位");
        //             } else {
        //                 settings.password = pwd;
        //                 files.write('./config/options.json', JSON.stringify(settings), 'utf-8');
        //             }
        //         })
        // }

        ui.pwd.clearFocus();
        if (settings.password != ui.pwd.getText()) {
            settings.password = ui.pwd.getText();
            files.write('./config/options.json', JSON.stringify(settings), 'utf-8');
            toast("密码更改成功");
        }

    })
    // 监听班次切换
    ui.radios.setOnCheckedChangeListener((radioGroup, radioId) => {
        if (radioId === ui.dayshift.getId()) {
            ui.timepicker.setCurrentHour(20);
            ui.timepicker.setCurrentMinute(0);
        } else {
            ui.timepicker.setCurrentHour(8);
            ui.timepicker.setCurrentMinute(0);
        }
    })
    // 监听无障碍按钮
    ui.autoService.on("check", function (checked) {
        // 用户勾选无障碍服务的选项时，跳转到页面让用户去开启
        if (checked) {
            if (auto.service == null) {
                app.startActivity({
                    action: "android.settings.ACCESSIBILITY_SETTINGS"
                })
            }
        } else {
            if (auto.service != null) {
                auto.service.disableSelf(); //关闭无障碍
            }
        }
    })
    // 监听是否用音量下键关闭脚本
    ui.useVolumeDown.on('check', function (checked) {
        if (checked) {
            settings.useVolumeDown = true;
        } else {
            settings.useVolumeDown = false;
        }
        files.write('./config/options.json', JSON.stringify(settings), 'utf-8');
    })

    // 监听用户自定义打卡时间
    ui.userDefined.on('check', function (checked) {
        if (checked) {
            useDefined = true;
            ui.dayTime.attr('visibility', 'visible');
            ui.nightTime.attr('visibility', 'visible');
        } else {
            useDefined = false;
            ui.dayTime.attr('visibility', 'gone');
            ui.nightTime.attr('visibility', 'gone');
        }
    })

    // 监听回到界面
    ui.emitter.on('resume', function () {
        // 此时根据无障碍的开启情况，同步开关的状态
        ui.autoService.checked = auto.service != null;
        // ui.floatySwitch.checked = useFloaty;
    })
    // 监听悬浮窗开关
    ui.floatySwitch.setOnCheckedChangeListener(function (widget, checked) {
        if (!widget.isPressed()) {
            return;
        }
        if (checked) {
            // if(isFloatyActive) return;
            if (!$floaty.checkPermission()) {
                // 没有悬浮窗权限，提示用户并跳转请求
                toast("本脚本需要悬浮窗权限来显示悬浮窗，请在随后的界面中允许并重新运行本脚本。");
                $floaty.requestPermission();
            } else {
                engines.execScriptFile('./floaty.js');
                isFloatyActive = true;
            }
        } else {
            events.broadcast.emit("hideFloaty"); //向悬浮窗脚本发送广播，通知其退出脚本
        }
    })

    // 监听加班模式
    ui.modeRadio.setOnCheckedChangeListener((radioGroup, radioId) => {
        if (radioId === ui.manualmode.getId()) {
            // 手动模式
            offMode = "manual";
            ui.offTime.attr('visibility', 'gone');
        } else {
            // 自动模式
            offMode = "auto";
            ui.offTime.attr('visibility', 'visible');
        }
    })
    // 监听重置按钮
    ui.reset.on('click', by_trigger(initsettings, 500));
    // 监听更新按钮
    ui.update.on('click', by_trigger(updatesettings, 500));

    // 监听脚本启用开关

    ui.enableOrNot.on('check', function (checked) {
        if (checkEnableTimer) {
            clearTimeout(checkEnableTimer);
        }
        checkEnableTimer = setTimeout(() => {
            // 更新选项的可用状态
            enablesettings(checked);
            initInfos();
            initClockLine();
            // 启用或停止脚本
            if (checked) {
                if (auto.service == null) {
                    toast("请注意，您还未启用无障碍服务，打卡功能无法正常使用！");
                }
                // if (settings.tasks.length < 1) {

                // }
                // if (settings.initTask == null) {
                //     settings.initTask = $timers.addDailyTask({
                //         path: files.path('./dailyInit.js'),
                //         time: wt[settings.workTime].initTime
                //     }).id;
                // }
                toast('已开启定时打卡');
                // addTask();
                updateTask();

            } else if (!checked) {
                // if (settings.tasks.length > 0) {
                //     toast("已关闭定时打卡");
                //     removeTask();
                // }
                // if (settings.initTask != null) {
                //     $timers.removeTimedTask(settings.initTask);
                //     settings.initTask = null;
                // }
                toast("已关闭定时打卡");
                removeTask();
            }

            files.write('./config/options.json', JSON.stringify(settings), 'utf-8');
        }, 500);
    })
}

// 初始化打卡信息
function initInfos() {
    ui.enable.setText(ui.enableOrNot.checked ? "已启用" : "未启用");
    ui.workTime.setText(settings.workTime);
    ui.offMode.setText(settings.offMode == "auto" ? "自动" : "手动");
    ui.off.setText(settings.offTime);
    if (ui.enable.getText() == "已启用") {
        ui.enable.attr("textColor", "#2fa305");
    } else {
        ui.enable.attr("textColor", "#e91111");
    }
}
function initClockLine() {
    let inflateXml;
    let clockProgress = settings.clockProgress;
    ui.clockLine.removeAllViews();
    switch (settings.workTime) {
        case "白班现场":
            inflateXml =
                <vertical>
                    <linear>
                        <text text="08:00" id="d1" />
                        <text text="--->>" textColor="#a95a90" />
                        <text text="12:00" id="d2" />
                        <text text="--->>" textColor="#a95a90" />
                        <text text="13:30" id="d3" />
                        <text text="--->>" textColor="#a95a90" />
                        <text text="17:30" id="d4" />
                    </linear>
                    <linear>
                        <text text="--->>" textColor="#a95a90" />
                        <text id="a" text="18:00" />
                        <text text="--->>" textColor="#a95a90" />
                        <text id="o1" text="20:00" />
                    </linear>
                </vertical>;
            break;
        case "夜班现场":
            inflateXml =
                <linear>
                    <text text="20:00" id="n" />
                    <text text="--->>" textColor="#a95a90" />
                    <text id="o2" text="08:00" />
                </linear>;
            break;
        case "休息":
            inflateXml = <text text="休息" />;

            break;
    }

    ui.inflate(inflateXml, ui.clockLine, true);

    let clockedItems = [], failedItems = [];
    for (let i = 0; i < clockProgress.length; i++) {
        if (clockProgress[i].clocked) {
            clockedItems.push(clockProgress[i].item);
        } else {
            failedItems.push(clockProgress[i].item);
        }
    }
    for (let i = 0; i < allClockLines.length; i++) {
        if (ui[allClockLines[i]]) {
            if (clockedItems.indexOf(allClockLines[i]) != -1) {
                ui[allClockLines[i]].attr('textColor', clockedColor);
            } else if (failedItems.indexOf(allClockLines[i]) != -1) {
                ui[allClockLines[i]].attr('textColor', failedColor);
            } else {
                ui[allClockLines[i]].attr('textColor', normalColor);
            }
        }

    }
    if (settings.workTime == "白班现场") {
        ui.o1.setText(settings.offTime);
        if (settings.offMode == 'manual') {
            ui.a.attr('textColor', "#9a9699");
            ui.o1.attr('textColor', "#9a9699");
        }
    } else if (settings.workTime == "夜班现场") {
        ui.o2.setText(settings.offTime);
        if (settings.offMode == 'manual') {
            ui.o2.attr('textColor', "#9a9699");
        }
    }

}
// 初始化设置
function initsettings() {
    if (settings.tasks.length > 0) {
        ui.enableOrNot.setChecked(true);
        initClockLine();
        // 初始化时间线着色
        // for (let i = 0; i < settings.clockProgress.length; i++) {
        //     ui[settings.clockProgress[i].item].attr("textColor", clockedColor);
        // }
    } else {
        ui.enableOrNot.setChecked(false);
    }
    ui.pwd.setText(settings.password);
    offMode = settings.offMode;
    if (offMode == "auto") {
        ui.automode.checked = true;
        ui.offTime.attr('visibility', 'visible');
    } else {
        ui.manualmode.checked = true;
        ui.offTime.attr('visibility', 'gone');
    }
    if (settings.useVolumeDown) {
        ui.useVolumeDown.setChecked(true);
    } else {
        ui.useVolumeDown.setChecked(false);
    }
    switch (settings.workTime) {
        case "白班现场":
            ui.dayshift.checked = true;
            break;
        case "夜班现场":
            ui.nightshift.checked = true;
            break;
        case "休息":
            ui.dayoff.checked = true;
            break;
    }

    let offHour = Number(settings.offTime.split(':')[0]);
    let offMinute = Number(settings.offTime.split(':')[1]);
    // 下班时间的初始化
    ui.timepicker.setIs24HourView(true);
    ui.timepicker.setCurrentHour(offHour);
    ui.timepicker.setCurrentMinute(offMinute);

    if (auto.service == null) {
        ui.autoService.setChecked(false);
    } else {
        ui.autoService.setChecked(true);
    }

    useDefined = settings.useDefined;
    if (useDefined) {
        ui.userDefined.setChecked(true);
        clockTime = settings.userDefinedTime;
        for (let i = 1; i <= 8; i++) {
            ui["h" + i].setText(clockTime["t" + i]["h" + i]);
            ui["m" + i].setText(clockTime["t" + i]["m" + i]);
        }
        ui.dayTime.attr('visibility', 'visible');
        ui.nightTime.attr('visibility', 'visible');
        if (settings.workTime == "白班现场") {
            ui.h6.setText(by_zeroFill(offHour));
            ui.m6.setText(by_zeroFill(offMinute + 1));
        } else if (settings.workTime == "夜班现场") {
            ui.h8.setText(by_zeroFill(offHour));
            ui.m8.setText(by_zeroFill(offMinute + 1));
        }


    } else {
        ui.userDefined.setChecked(false);
        ui.dayTime.attr('visibility', 'gone');
        ui.nightTime.attr('visibility', 'gone');
    }

    enablesettings(!!settings.tasks.length);

}
function initBroadcast() {
    events.broadcast.on('push', function (data) {
        let fontColor;
        switch (data.type) {
            case "log":
                fontColor = "#000000"
                break;
            case "success":
                fontColor = "#0aad1d"
                break;
            case "error":
                fontColor = "#e60505"
                break;
            case "warn":
                fontColor = "#e8cf0f"
                break;

        }
        let textView = $ui.inflate(
            <text textSize="14sp" />
            , $ui.logs);
        textView.attr("text", by_getFormTime() + data.info);
        textView.attr("textColor", fontColor);
        $ui.logs.addView(textView);

        //完成打卡，将相应的打卡线的时间变绿

        if (data.info.indexOf("已完成打卡") != -1 || data.info.indexOf("已检测到打卡") != -1) {
            let flag = data.info.split(":")[1];

            switch (flag) {
                case 'd1':
                    startClock = true;
                    ui.d1.attr('textColor', clockedColor);
                    break;
                case 'd2':
                    ui.d2.attr('textColor', clockedColor);
                    break;
                case 'd3':
                    ui.d3.attr('textColor', clockedColor);
                    break;
                case 'd4':
                    ui.d4.attr('textColor', clockedColor);
                    break;
                case 'a':
                    ui.a.attr('textColor', clockedColor);
                    break;
                case 'n':
                    startClock = true;
                    ui.n.attr('textColor', clockedColor);
                    break;
                case 'o':
                    startClock = false;
                    ui.o1 && ui.o1.attr('textColor', clockedColor);
                    ui.o2 && ui.o2.attr('textColor', clockedColor);
                    break;
            }
        }

    })


    events.broadcast.on('started', function () {
        let textView = $ui.inflate(
            <text textColor="#000000" textSize="14sp" />
            , $ui.logs);
        textView.attr("text", by_getFormTime() + "开始打卡");
        $ui.logs.addView(textView);
    })


    events.broadcast.on('paused', function () {
        let textView = $ui.inflate(
            <text textColor="#000000" textSize="14sp" />
            , $ui.logs);
        textView.attr("text", by_getFormTime() + "暂停打卡");
        $ui.logs.addView(textView);
    })

    events.broadcast.on('exited', function () {
        let textView = $ui.inflate(
            <text textColor="#000000" textSize="14sp" />
            , $ui.logs);
        textView.attr("text", by_getFormTime() + "停止打卡");
        $ui.logs.addView(textView);
    })

    events.broadcast.on('floatyIsActive', function () {
        isFloatyActive = true;
    })


    events.broadcast.on("closeFloaty", function () {
        isFloatyActive = false;
    })

    // 监听打卡失败
    events.broadcast.on('failClock', function (failFlag) {
        if (ui[failFlag] && ui[failFlag].attr('textColor') != failedColor) {
            ui[failFlag].attr('textColor', failedColor);
        }
    })

    setInterval(() => {
        events.broadcast.emit("checkFloaty");
        if (ui.floatySwitch.checked && !isFloatyActive) {
            ui.floatySwitch.setChecked(false);
        } else if (!ui.floatySwitch.checked && isFloatyActive) {
            ui.floatySwitch.setChecked(true);
        }
    }, 300);
}
// 添加定时任务
// function addTask() {
//     if (settings.workTime != "休息") {
//         // 启动自动打卡脚本并将任务信息写入配置文件
//         let taskTime = getTaskTime();
//         let times = wt[settings.workTime].normal, task;
//         for (let i = 0; i < times.length; i++) {
//             task = $timers.addDailyTask({
//                 path: files.path('./ycdk.js'),
//                 time: times[i],
//                 delay: 0,
//                 loopTimes: 1,
//                 interval: 0
//             });
//             settings.tasks.push(task.id);
//         }
//         settings.offTask = $timers.addDailyTask({
//             path: files.path('./ycdk.js'),
//             time: wt[settings.workTime].offtime
//         }).id;
//     }
// }
// 初始化界面控件状态
function enablesettings(enable) {
    for (let i = 0; i < ui.radios.getChildCount(); i++) {
        ui.radios.getChildAt(i).setEnabled(enable);
    }
    ui.reset.enabled = enable;
    ui.update.enabled = enable;
    for (let i = 0; i < ui.modeRadio.getChildCount(); i++) {
        ui.modeRadio.getChildAt(i).setEnabled(enable);
    }
    ui.userDefined.setEnabled(enable);
}
// 更新设置
function updatesettings() {
    let isUpdate = false, timeChanged = false;
    let workTimeId = ui.radios.getCheckedRadioButtonId();
    let newWorkTime = ui.findView(workTimeId).text;
    let workTimeChange = false
    if (settings.workTime != newWorkTime) {
        settings.workTime = newWorkTime;
        isUpdate = true;
        initClockLine();
        updateTask();
        workTimeChange = true;
    }

    if (offMode != settings.offMode) {
        settings.offMode = offMode;
        isUpdate = true;
        // initClockLine();
        if (settings.offMode == 'manual') {
            ui.a && ui.a.attr('textColor', "#9a9699");
            ui.o1 && ui.o1.attr('textColor', "#9a9699");
            ui.o2 && ui.o2.attr('textColor', "#9a9699");
        }
    }

    let hour = Number(settings.offTime.split(":")[0]),
        minute = Number(settings.offTime.split(":")[1]),
        newHour = ui.timepicker.getHour(),
        // 将newMinute取整
        newMinute = ui.timepicker.getMinute() < 30 ? 0 : 30;

    if (hour != newHour || minute != newMinute) {

        settings.offTime = by_zeroFill(newHour) + ":" + by_zeroFill(newMinute);
        let offHour = Number(settings.offTime.split(':')[0]);
        let offMinute = Number(settings.offTime.split(':')[1]);
        isUpdate = true;
        ui.o1 && ui.o1.setText(settings.offTime);
        ui.o2 && ui.o2.setText(settings.offTime);


        if (settings.workTime === "白班现场") {
            ui.h6.setText(by_zeroFill(offHour));
            ui.m6.setText(by_zeroFill(offMinute + 1));

        } else if (settings.workTime == "夜班现场") {
            ui.h8.setText(by_zeroFill(offHour));
            ui.m8.setText(by_zeroFill(offMinute + 1));
        }

        if (workTimeChange && (newHour == 8 && newMinute == 0) || (newHour == 20 && newMinute == 0)) {
            log("单纯地切换上下班")
        } else {
            if (offMode === "auto") {
                // 自动模式下，更改下班任务，在每日的初始化任务中恢复默认的定时下班任务
                settings.offTask && $timers.removeTimedTask(settings.offTask); //清除已有的下班任务
                log("清除已有的下班任务")
                settings.offTask = $timers.addDailyTask({ //设置下班任务
                    path: files.path('./ycdk.js'),
                    time: new Date(0, 0, 0, newHour, newMinute - 4, 0),
                }).id;
            }
        }

    }

    if (useDefined != settings.useDefined) {
        isUpdate = true;
        timeChanged = true;
        settings.useDefined = useDefined;

    }

    let definedTime = getClockTime();
    if (useDefined && !!definedTime && !by_equals(definedTime, settings.userDefinedTime)) {
        isUpdate = true;
        timeChanged = true;
        settings.userDefinedTime = definedTime;
    }
    if (timeChanged) {
        updateTask();
    }

    if (isUpdate) {
        initInfos();
        toastLog("更新成功");
        // 写入配置文件
        files.write('./config/options.json', JSON.stringify(settings), 'utf-8')
    }

}




function showInfo() {
    alert(`
    该软件仅用于亚昌同仁自动打卡，禁止用于其它用途，违者必究！
    为保证打卡功能的正常使用，建议提前设置手机如下：
    1.因本软件是基于手机的无障碍模式，请打开该模式，否则无法实现自动打卡功能。
    2.目前仅支持数字密码解锁，不支持指纹和图案解锁，所以使用本软件，需使用数字解锁或不使用锁屏密码。
    3.为了使手机能在口袋中自动打卡，需要关闭防误触模式（设置→锁屏→关闭防误触模式）。该功能不能保证一定成功，尤其在剧烈运动时。
    4.设置→省电与电池→右上角设置图标→应用智能省电→AutoJsPro→无限制

    请联系：互博的亮仔 
        QQ1131056909 
        手机13712299162 
    `
    )
}



function getClockIndex() {
    let curDate = new Date();
    let offHour = settings.offTime.split(":")[0];
    let offMinute = settings.offTime.split(":")[1];
    let hour = curDate.getHours(),
        minute = curDate.getMinutes();
    let res;

    if (hour == 7 || (hour == 8 && minute == 0)) {
        // 早晨上班卡
        res = 'd1';
    } else if ((hour == 12 && minute >= 1 && minute <= 45)) {
        // 中午下班卡
        res = 'd2';
    } else if ((hour == 12 && minute > 45) || (hour == 13 && minute <= 30)) {
        // 下午上班卡
        res = 'd3';
    } else if (hour == 17 && minute >= 31 && minute <= 45) {
        // 下午下班卡
        res = 'd4';
    } else if ((hour == 17 && minute >= 45) || (hour == 18 && minute == 0)) {
        // 加班上班卡
        res = 'a';
    } else if ((offHour === hour && minute >= offMinute)) {
        // 下班卡
        res = 'o';
    } else if (hour == 19 || (hour == 20 && minute == 0)) {
        // 夜班上班卡
        res = 'n'
    }
    return res;
}








// 获取自定义的时间（文本对象）
function getClockTime() {
    let times = {};
    for (let i = 1; i <= 8; i++) {
        let hh = Number(ui["h" + i].getText()),
            mm = Number(ui["m" + i].getText());
        if (
            (hh !== 0 && !hh) || (mm !== 0 && !mm) ||
            (hh < 0) || (mm < 0) ||
            (hh > 23) || (mm > 59)
        ) {
            toastLog("输入了无效的时间！")
            return false;
        }
        times["t" + i] = {};
        times["t" + i]["h" + i] = by_zeroFill(hh);
        times["t" + i]["m" + i] = by_zeroFill(mm);
    }
    return times;
}

// 生成定时任务的时间（日期格式）
function getTaskTime() {
    let taskTime = {};
    let oldTime = settings.useDefined ? settings.userDefinedTime : defaultTime;
    let hour, minute;
    for (let t in oldTime) {
        for (let hm in oldTime[t]) {
            if (/^h.*?/.test(hm)) {
                hour = Number(oldTime[t][hm]);
            } else {
                minute = Number(oldTime[t][hm]);
            }
            if (minute < 5) {
                hour -= 1;
                minute += 60;
            }
            taskTime[t] = new Date(0, 0, 0, hour, minute - 5, 0);
        }

    }
    return taskTime;
}

function updateTask() {
    removeTask();
    let taskTime = getTaskTime();
    let task;
    if (settings.workTime == "休息") {
        return;
    }
    if (settings.workTime == "白班现场") {
        settings.initTask = $timers.addDailyTask({
            path: files.path('./dailyInit.js'),
            time: new Date(0, 0, 0, 23, 56, 0)
        }).id;
    } else if (settings.workTime == "夜班现场") {
        settings.initTask = $timers.addDailyTask({
            path: files.path('./dailyInit.js'),
            time: new Date(0, 0, 0, 11, 56, 0)
        }).id;
    }
    for (let t in taskTime) {
        if (settings.workTime == "白班现场" && t != "t7" && t != "t8") {
            task = $timers.addDailyTask({
                path: files.path('./ycdk.js'),
                time: taskTime[t]
            });
            if (t == "t6") {
                log(taskTime['t6'])
                settings.offTask = task.id;
            } else {
                settings.tasks.push(task.id);
            }
        } else if (settings.workTime == "夜班现场" && (t == "t7" || t == "t8")) {
            task = $timers.addDailyTask({
                path: files.path('./ycdk.js'),
                time: taskTime[t]
            });
            if (t == "t7") {
                settings.tasks.push(task.id);
            } else {
                log(taskTime['t8'])
                settings.offTask = task.id;
            }

        }
    }
}

function removeTask() {
    for (let i = 0; i < settings.tasks.length; i++) {
        $timers.removeTimedTask(settings.tasks[i]);
    }
    settings.tasks = [];
    if (settings.offTask) {
        $timers.removeTimedTask(settings.offTask);
        settings.offTask = null;
    }
    if (settings.initTask) {
        $timers.removeTimedTask(settings.initTask);
        settings.initTask = null;
    }
}

