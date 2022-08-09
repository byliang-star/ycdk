// 注册界面

"ui";
let { handlerRegister } = require('./api/request');
let bg_color = "#dddddd"
let font_size = "13"
let font_color = "#dd000000"
let successColor = "#209e0f"
let failColor = "#d0bf2f"
ui.statusBarColor(bg_color)
ui.layout(
  <ScrollView id="bg" bg="{{bg_color}}">
    <frame>
      <vertical padding="10 10 10">
        <text size="{{font_size*5}}sp" paddingTop="60" paddingLeft="40" color="{{font_color}}">注册</text>
        <text id="t1" size="{{font_size*2}}sp" color="{{font_color}}" marginTop="50" paddingLeft="35" />
        <input id="ID" w="*" marginRight="30" marginLeft="30" singleLine="true" hint="账号" textColorHint="{{font_color}}" />
        <text id="t2" size="{{font_size*2}}sp" color="{{font_color}}" marginTop="10" paddingLeft="35" />
        <input id="Password1" w="*" marginRight="30" marginLeft="30" singleLine="true" hint="密码" textColorHint="{{font_color}}" password="true" />
        <text id="t3" size="{{font_size*2}}sp" color="{{font_color}}" marginTop="10" paddingLeft="35" />
        <input id="Password2" w="*" marginRight="30" marginLeft="30" singleLine="true" hint="确认密码" textColorHint="{{font_color}}" password="true" />
        <text id="verifyInfo" marginLeft="30" />
        <button id="register" style="Widget.AppCompat.Button.Colored" h="{{font_size*11}}px" size="{{font_size*2}}sp" marginTop="20" marginRight="30" marginLeft="30">注册</button>

        <horizontal paddingLeft="40" paddingTop="10">
          <text id="goLogin" size="{{font_size*1+4}}sp" color="#00aadd" marginLeft="30">已有账号，去登录</text>
        </horizontal>
      </vertical>
    </frame>
  </ScrollView>
)
ui.ID.on("touch", () => {
  ui.t1.setText("账号")
  ui.ID.setHint("")
  if (ui.Password1.getText() == "") {
    ui.t2.setText("")
    ui.Password1.setHint("密码")
  }
  if (ui.Password2.getText() == "") {
    ui.t3.setText("")
    ui.Password2.setHint("确认密码")
  }
})

ui.Password1.on("touch", () => {
  ui.t2.setText("密码")
  ui.Password1.setHint("")
  if (ui.ID.getText() == "") {
    ui.t1.setText("")
    ui.ID.setHint("账号")
  }
  if (ui.Password2.getText() == "") {
    ui.t3.setText("")
    ui.Password2.setHint("确认密码")
  }
})
ui.Password2.on("touch", () => {
  ui.t3.setText("确认密码")
  ui.Password2.setHint("")
  if (ui.ID.getText() == "") {
    ui.t1.setText("")
    ui.ID.setHint("账号")
  }
  if (ui.Password1.getText() == "") {
    ui.t2.setText("")
    ui.Password1.setHint("密码")
  }
})

ui.bg.on("touch", () => {
  if (ui.Password1.getText() == "") {
    ui.t2.setText("")
    ui.Password1.setHint("密码")
  }
  if (ui.ID.getText() == "") {
    ui.t1.setText("")
    ui.ID.setHint("账号")
  }
  if (ui.Password2.getText() == "") {
    ui.t3.setText("")
    ui.Password2.setHint("确认密码")
  }
})

ui.register.on("click", () => {
  if (ui.Password1.getText() == "") {
    ui.t2.setText("")
    ui.Password1.setHint("密码")
  }
  if (ui.ID.getText() == "") {
    ui.t1.setText("")
    ui.ID.setHint("账号")
  }
  if (ui.Password2.getText() == "") {
    ui.t3.setText("")
    ui.Password2.setHint("确认密码")
  }
})

ui.register.on("click", () => {
  let userInfo = {
    user: ui.ID.getText(),
    pwd1: ui.Password1.getText(),
    pwd2: ui.Password2.getText()
  }
  let res = verifyFormat(userInfo);
  ui.verifyInfo.setText(res.msg);
  if (res.code != 0) {
    ui.verifyInfo.attr('textColor', failColor);
    return;
  }
  ui.verifyInfo.attr('textColor', failColor);



  // 将账号信息发送到服务器，并根据返回结果判断是否注册成功
  handlerRegister(userInfo)
    .then(res => {
      if (res.code === 0) {
        // 注册成功，跳转至用户界面，将token写入用户配置文件
        files.write(files.getSdcardPath() + '/脚本/ycdk_foot/config/user.json', JSON.stringify({ token: res.token }));
        toast("注册成功");
        ui.finish();
        engines.execScriptFile('./user.js');
      } else if (res.msg.code === 11000) {
        // 用户名重复
        toast("该用户名已注册")
      } else {
        toast(res.msg);
      }
    })
    .catch(err=> {
      log(err);
      toast("服务器出现了未知错误")
    })



})



function verifyFormat(userInfo) {
  let { user, pwd1, pwd2 } = userInfo;
  let res = { code: 1, msg: "" };
  if (user == "" || pwd1 == "" || user.toString().length < 6 || pwd1.toString().length < 6) {
    res.msg = "用户名或密码位数不能小于6位";
  } else if (pwd1.toString() !== pwd2.toString()) {
    res.msg = "两次输入的密码不一致";
  } else {
    res.msg = "验证成功";
    res.code = 0;
  }
  return res;
}