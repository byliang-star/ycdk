
let mainFloaty = floaty.rawWindow(
    <frame id="floatyBox" alpha="1">
        <img id="bground" circle='true' w='40' h='40' src="#d1c8cc" layout_gravity='center' />
        <img id="floatyIcon" circle='true' w='30' h='30' src="file://./res/icons/biz-fully-automatic.png" layout_gravity='center' tint="#00019e" />
    </frame>
)

mainFloaty.exitOnClose();


let downx = 0, downy = 0,
    cx = 0, cy = 0,
    downTime = 0,
    tapCount = 0;
let orientation = context.resources.configuration.orientation;
let dw = orientation == 1 ? device.width : device.height - 150;
let dh = orientation == 2 ? device.width : device.height - 150;

mainFloaty.setPosition(0, dh / 2);
setInterval(() => {
    if (context.resources.configuration.orientation != orientation) {
        orientation = context.resources.configuration.orientation;
        dw = orientation == 1 ? device.width : device.height - 150;
        dh = orientation == 2 ? device.width : device.height - 150;
        let x = mainFloaty.getX() === 0 ? 0 : dw - mainFloaty.getWidth();
        let y = mainFloaty.getY() * dh / dw;
        if (y > dh - mainFloaty.getHeight()) {
            y = dh - mainFloaty.getHeight();
        }
        mainFloaty.setPosition(x, y);
    }
}, 300);

let timer, longTimer;

mainFloaty.floatyBox.setOnTouchListener(function (view, event) {


    switch (event.getAction()) {
        case event.ACTION_DOWN:
            tapCount++;
            if (timer) {
                clearTimeout(timer);
            }
            downTime = Date.now();
            cx = event.getRawX();
            cy = event.getRawY();

            downx = event.getRawX();
            downy = event.getRawY();

            return true;
        case event.ACTION_MOVE:
            distanceX = event.getRawX() - cx;
            distanceY = event.getRawY() - cy;
            mainMove(distanceX, distanceY);
            cx = event.getRawX();
            cy = event.getRawY();
            return true;
        case event.ACTION_UP:

            timer = setTimeout(() => {
                if (Math.abs(event.getRawX() - downx) < 5 && Math.abs(event.getRawY() - downy) < 5) {
                    if (Date.now() - downTime > 1000) {
                        mainLongClick();
                    } else {
                        if (tapCount == 1) {
                            mainClick();
                        } else if (tapCount == 2) {
                            mainDoubleClick();
                        }else  {
                            mainFloaty.close();
                        }
                    }


                }
                tapCount = 0;
            }, 300);


            mainUp();
            tapMode = null;
            return true;
    }

    return true;


})

function mainClick() {
    events.broadcast.emit("start or pause");
}
function mainLongClick() {
    // 长按打开设置界面
    // if (currentPackage() != "org.bfoot.ycdk") {
    //     res = app.launch("org.bfoot.ycdk");
    // }
    if (currentPackage() != "org.example.my_project") {
        res = app.launch("org.example.my_project");
    }
}
function mainDoubleClick() {
    events.broadcast.emit("stop");
}
function mainMove(distanceX, distanceY) {
    mainFloaty.setPosition(mainFloaty.getX() + distanceX, mainFloaty.getY() + distanceY);
}
function mainUp() {
    let x0 = mainFloaty.getX(),
        y0 = mainFloaty.getY(),
        w = mainFloaty.floatyBox.getWidth(),
        h = mainFloaty.floatyBox.getHeight(),
        p = {};
    //根据放手时控件所在的象限来判断应该定位的边界
    p = (x0 <= dw / 2) ? { x: 0, y: y0 } : { x: dw - w, y: y0 };
    // 拖拽出边界时
    if (x0 < 0) p.x = 0;
    if (x0 > dw - w) p.x = dw - w;
    if (y0 < 0) p.y = 0;
    if (y0 > dh - h) p.y = dh - h;
    mainFloaty.setPosition(p.x, p.y);
}


events.broadcast.on("paused", function () {
    mainFloaty.floatyIcon.attr("tint", "#ca3011");
})
events.broadcast.on("started", function () {
    mainFloaty.floatyIcon.attr("tint", "#11ca20");
})
events.broadcast.on("exited", function () {
    mainFloaty.floatyIcon.attr("tint", "#00019e");
})
events.broadcast.on("checkFloaty" ,function() {
    events.broadcast.emit("floatyIsActive");
})
events.broadcast.on("hideFloaty", function () {
    mainFloaty.close();
})
events.on('exit', function() {
    events.broadcast.emit("closeFloaty");
})



