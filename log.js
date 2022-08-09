"ui";
let res = files.read('./config/log.txt');

ui.layout(
    <scroll>
        <vertical>
            <text id="logs" />
        </vertical>
    </scroll>
)



ui.run(function () {
    ui.logs.setText(res);
})

