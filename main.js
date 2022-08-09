'ui';
// 检查无障碍服务是否已经启用，如果没有启用则跳转到无障碍服务启用界面，并等待无障碍服务启动；当无障碍服务启动后脚本会继续运行。
// auto();

// 读取用户配置
// 如果token不为空，则发送登录请求，验证通过则自动登录，否则进入登录界面
// 如果token为空，则进入登录界面
let { handlerToken } = require('./api/request');
let { token, autoLogin } = JSON.parse(files.read('./config/user.json'));
$settings.setEnabled('stop_all_on_volume_up', false);
console.setGlobalLogConfig({
    "file": "./config/log.txt"
});
function initScript() {
    if (token != "" && autoLogin) {
        // 有token，验证token
        handlerToken(token)
            .then(res => {
                toast(res.msg);
                if (res.code === 0) {
                    // token正确，直接进入用户界面
                    engines.execScriptFile('./user.js')
                } else {
                    // token错误，直接进入登录界面，将配置文件中的token清空
                    files.write('./config/user.json', JSON.stringify({ token: "" }));
                    engines.execScriptFile('./login.js')
                }
            })
    } else {
        // 没有token，进入登录界面 
        engines.execScriptFile('./user.js')
    }
}
// 启动画面，防止闪屏
ui.layout(
    <relative>

        <img src="file://./res/images/启动1.jpg" />
        <frame layout_alignParentRight="true" layout_alignParentBottom="true" marginBottom="5" marginRight="5">
            <card cardBackgroundColor="#b0879adc" w="50" h="30" cardCornerRadius="8" cardElevation="0" >
                <text text="3" id="countDown" textSize="15" textColor="#ffffff" layout_gravity="center|bottom" w="auto" marginTop="4" />
            </card>

        </frame>

    </relative >
)
let timer;
ui.run(function () {
    let count = ui.countDown.getText() - 1;
    timer = setInterval(() => {
        ui.countDown.setText("" + count--);
        if (count < 0) {
            clearInterval(timer);
            ui.finish();
            initScript();
        }
    }, 1000);
    ui.countDown.on('click', function () {
        clearInterval(timer);
        ui.finish();
        initScript();
    })
})
