// WebSocket连接
const ws = new WebSocket(`ws://${window.location.host}`);

// 游戏状态
let currentProvince = null;

// WebSocket事件处理
ws.onopen = () => {
    console.log('已连接到服务器');
};

ws.onmessage = (event) => {
    try {
        const message = JSON.parse(event.data);
        
        switch(message.type) {
            case 'gameState':
                // 更新游戏状态
                updateGameState(message.data);
                break;
                
            case 'answerResult':
                // 显示答案结果
                showResult(message.data);
                break;
                
            case 'newGame':
                // 开始新游戏
                startNewGame(message.data);
                break;

            case 'onlineCount':
                // 更新在线人数
                updateOnlineCount(message.count);
                break;
        }
    } catch (error) {
        console.error('处理消息时出错:', error);
    }
};

ws.onclose = () => {
    console.log('与服务器断开连接');
};

// 提交答案
document.querySelector('#submitAnswer').addEventListener('click', () => {
    const selectedProvince = document.querySelector('input[name="province"]:checked');
    if (selectedProvince) {
        ws.send(JSON.stringify({
            type: 'answer',
            province: selectedProvince.value
        }));
    } else {
        alert('请选择一个省份！');
    }
});

// 更新游戏状态
function updateGameState(state) {
    if (state.currentImage) {
        document.querySelector('#mapImage').src = state.currentImage;
    }
}

// 显示结果
function showResult(result) {
    const resultElement = document.querySelector('#result');
    if (result.correct) {
        resultElement.textContent = '恭喜你答对了！';
        resultElement.style.color = 'green';
    } else {
        resultElement.textContent = `答错了。正确答案是：${result.correctProvince}`;
        resultElement.style.color = 'red';
    }
}

// 开始新游戏
function startNewGame(data) {
    document.querySelector('#mapImage').src = data.image;
    document.querySelector('#result').textContent = '';
    // 清除选中的省份
    document.querySelectorAll('input[name="province"]').forEach(input => {
        input.checked = false;
    });
}

// 更新在线人数显示
function updateOnlineCount(count) {
    const onlineCountElement = document.querySelector('#onlinePlayers');
    if (onlineCountElement) {
        onlineCountElement.textContent = count;
    }
} 