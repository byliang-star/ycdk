// 登录界面

"ui";

let { handlerLogin } = require('./api/request');
let bg_color = "#dddddd"
let font_size = "13"
let font_color = "#dd000000"
ui.statusBarColor(bg_color)
ui.layout(
  <ScrollView id="bg" bg="{{bg_color}}">
    <frame>
      <vertical padding="10 10 10">
        <text size="{{font_size*5}}sp" paddingTop="60" paddingLeft="40" color="{{font_color}}">登录</text>
        <text id="t1" size="{{font_size*2}}sp" color="{{font_color}}" marginTop="50" paddingLeft="35" />
        <input id="ID" w="*" marginRight="30" marginLeft="30" singleLine="true" hint="账号" textColorHint="{{font_color}}" />
        <text id="t2" size="{{font_size*2}}sp" color="{{font_color}}" marginTop="10" paddingLeft="35" />
        <input id="Password" w="*" marginRight="30" marginLeft="30" singleLine="true" hint="密码" textColorHint="{{font_color}}" password="true" />
        <text id="t3" size="{{font_size*2}}sp" color="{{font_color}}" marginTop="10" paddingLeft="35" />
        <relative id="serveCodeBox" marginRight="30" marginLeft="30" visibility="gone">
          <input id="serveCode" w="*" singleLine="true" hint="服务码" textColorHint="{{font_color}}" />
          <text layout_alignParentRight="true" id="shutServeCode" w="20" h="20" alpha="0.5" bg="@drawable/ic_close_black_48dp" />
        </relative>

        <horizontal>
          <checkbox id="isRemember" text="记住密码" marginLeft="30" />
          <text id="inconnectable" marginLeft="30" size="{{font_size*1+4}}sp" color="#00aadd">无法登录？输入服务码</text>
        </horizontal>

        <button id="Login" style="Widget.AppCompat.Button.Colored" h="{{font_size*11}}px" size="{{font_size*2}}sp" marginTop="20" marginRight="30" marginLeft="30">登录</button>

        <horizontal paddingLeft="40" paddingTop="10">

          <text id="Forget" size="{{font_size*1+4}}sp" color="#00aadd">忘记密码</text>
          <text id="goRegister" size="{{font_size*1+4}}sp" color="#00aadd" marginLeft="30">注册账号</text>
        </horizontal>
      </vertical>
    </frame>
  </ScrollView>
)


let userOptions = {};

ui.ID.on("touch", () => {
  ui.t1.setText("账号")
  ui.ID.setHint("")
  if (ui.Password.getText() == "") {
    ui.t2.setText("")
    ui.Password.setHint("密码")
  }
  if (ui.serveCode.getText() == "") {
    ui.t3.setText("")
    ui.serveCode.setHint("服务码")
  }
})

ui.Password.on("touch", () => {
  ui.t2.setText("密码")
  ui.Password.setHint("")
  if (ui.ID.getText() == "") {
    ui.t1.setText("")
    ui.ID.setHint("账号")
  }
  if (ui.serveCode.getText() == "") {
    ui.t3.setText("")
    ui.serveCode.setHint("服务码")
  }
})
ui.serveCode.on("touch", () => {
  ui.t3.setText("服务码")
  ui.serveCode.setHint("")
  if (ui.ID.getText() == "") {
    ui.t1.setText("")
    ui.ID.setHint("账号")
  }
  if (ui.Password.getText() == "") {
    ui.t2.setText("")
    ui.Password.setHint("密码")
  }
})

ui.bg.on("touch", () => {
  if (ui.Password.getText() == "") {
    ui.t2.setText("")
    ui.Password.setHint("密码")
  }
  if (ui.ID.getText() == "") {
    ui.t1.setText("")
    ui.ID.setHint("账号")
  }
  if (ui.serveCode.getText() == "") {
    ui.t3.setText("")
    ui.serveCode.setHint("服务码")
  }
})
ui.isRemember.on('click', function () {
  userOptions.auto = ui.isRemember.checked;
})

ui.inconnectable.on('click', function () {
  ui.serveCodeBox.attr('visibility', 'visible');
})
ui.shutServeCode.on('click', function () {
  ui.serveCodeBox.attr('visibility', 'gone');
  ui.t3.setText("")
})
ui.Login.on("click", () => {
  if (ui.Password.getText() == "") {
    ui.t2.setText("")
    ui.Password.setHint("密码")
  }
  if (ui.ID.getText() == "") {
    ui.t1.setText("")
    ui.ID.setHint("账号")
  }
})

ui.Login.on("click", () => {
  let userInfo = {
    user: ui.ID.getText(),
    pwd: ui.Password.getText()
  }
  if (!verifyFormat(userInfo)) {
    toast("用户名或密码错误，请重试");
    return;
  }
  // 内网穿透使得URL不稳定,需要用户自行向开发者索取后输入，后期再考虑采取收费的稳定服务器代理
  // 如果服务码不为空，则更新服务配置文件
  if (ui.serveCode.getText() != "") {
    toast(ui.serveCode.getText())
    files.write(files.getSdcardPath() + '/脚本/ycdk_foot/config/server.json', JSON.stringify({ serveCode: ui.serveCode.getText() }));
  }

  handlerLogin(userInfo)
    .then(res => {
      switch (res.code) {
        case 0:
          // 登录成功,将token写入配置，并跳转到用户界面
          userOptions.token = res.token;
          files.write(files.getSdcardPath() + '/脚本/ycdk_foot/config/user.json', JSON.stringify(userOptions));


          ui.finish();
          engines.execScriptFile('./user.js');
        default:
          toast(res.msg);
          break;
      }
    })
    .catch(err => {
      log(err);
      toast("服务器出现了未知错误")
    })


})

ui.goRegister.on("click", function () {
  ui.finish();
  engines.execScriptFile('./register.js');
})

function verifyFormat(userInfo) {
  let { user, pwd } = userInfo;
  if (user == "" || pwd == "" || user.toString().length < 6 || pwd.toString().length < 6) {
    return false
  } else {
    return true
  }
}