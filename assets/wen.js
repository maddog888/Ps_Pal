// 是否退出
var out = false;
// 文档加载完之后的事件
const documentReady = () => {
    // 当连接建立触发
    client.on('connect', () => {
        // 
        console.log('连接成功');
        // 配置群组信息
        let topic_c = 'ps_pal_' + topic + '_' + no; //接收客户端群组
        let topic_s = 'ps_pal_' + topic + '_s';  //发送服务端群组
        // 订阅对应no群组
        client.subscribe(topic_c, (err) => {
            if (!err) {
                console.log('订阅'+topic_c+'群组成功，等待响应。');
            }
        });
        console.log(jsonString)
        // 发送数据
        client.publish(topic_s, jsonString);
    });

    // 收到消息时的回调函数
    client.on('message', (topic, message) => {
        // 得到消息
        let msg = message;
        console.log('收到消息:', msg.toString());
        try {
            // 使用 JSON.parse() 方法解析 JSON 字符串
            const result = JSON.parse(msg);
            // 回应并得到了ok说明打赏成功了
            if(result.ok){
                // 设置状态为退出
                out = true;
                // 显示结果
                loadding.style.display = "flex";
                loaddingText.textContent = "打赏成功，正在跳转...";
                // 开始跳转
                location.href = rurl;
                return;
            }

            // 取消加载状态并显示主体
            if(loadding.style.display!='none' && container.style.display != 'inline-block'){
                // 首次收到回应处理
                loadding.style.display = 'none';
                container.style.display = 'inline-block';

                // 显示实际需要打赏的金额
                nowPrice.textContent = parseFloat(result.price).toFixed(2);

                // 创建定时器
                setInterval(function() {
                    if(out){
                        return;
                    }
                    // 将过期时间字符串转换为 Date 对象
                    const expirationDate = new Date(result.gqtime);
                    
                    // 获取当前时间
                    const currentDate = new Date();
                    // 计算时间差 在 过期时间基础上减去30秒，避免用户出现在最后几秒完成打赏的时间差问题
                    const difference = (expirationDate.getTime() - 30000) - currentDate.getTime();
                    // 检查是否过期
                    if (difference <= 0 || isNaN(expirationDate)) {
                        // 设置状态为退出
                        out = true;
                        // 关闭
                        closePal();
                        return;
                    }
                    // 计算剩余的分钟和秒数
                    const minutes = Math.floor(difference / (1000 * 60));
                    const seconds = Math.floor((difference % (1000 * 60)) / 1000);
                    countdown.innerHTML = minutes + "分" + seconds + "秒";
                }, 1000);
            }
        } catch (error) {
            // 如果解析失败，error 将包含有关错误的信息
            console.error('解析失败:', error);
            closePal();
        }
    });

    // 连接断开时的回调函数
    client.on('close', () => {
        console.log('连接已断开');
        alert("MQTT端不稳定，可以关闭SSL试试！");
        closePal();
    });

    // 发生错误时的回调函数
    client.on('error', (error) => {
        console.error('发生错误:', error);
        closePal();
    });

    // 用户重新回到页面，刷新当前页面
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            location.reload();
        }
    });
};

// 退出当前页面
function closePal(){
    // 更新Dom状态
    document.getElementById("img").style.display = "none";
    countdown.innerHTML = "已过期";
    // 使用 setTimeout 来确保警告框在 DOM 更新后显示
    setTimeout(() => {
        alert("订单已失效，请重新创建后再打赏！");
    }, 1);
    // 返回上一页
    window.history.go(-1);
}

// 等待文档加载完成
if (document.readyState !== 'loading') {
    documentReady();
} else {
    document.addEventListener('DOMContentLoaded', documentReady);
}