const express = require('express');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const http = require('http');

const app = express();
const port = process.env.PORT || 3000;

// 静态文件服务
app.use(express.static(path.join(__dirname, '.')));

// 创建HTTP服务器
const server = http.createServer();
const wss = new WebSocket.Server({ server });

// 存储当前游戏状态
let gameState = {
    currentImage: null,
    correctProvince: null,
    scores: {},
    questionsAnswered: 0,
    currentUser: null
};

// 存储所有评分数据
let ratingsData = [];

// 存储所有连接的客户端
const clients = new Set();
// 存储玩家数据
const players = new Map();

// 加载历史评分数据
function loadRatingsData() {
    const filePath = path.join(__dirname, 'ratings.json');
    if (fs.existsSync(filePath)) {
        try {
            const data = fs.readFileSync(filePath, 'utf8');
            ratingsData = JSON.parse(data);
            console.log('已加载历史评分数据');
        } catch (error) {
            console.error('加载评分数据失败:', error);
        }
    }
}

// 保存评分数据到文件
function saveRatingsToFile() {
    const filePath = path.join(__dirname, 'ratings.json');
    try {
        fs.writeFileSync(filePath, JSON.stringify(ratingsData, null, 2));
        console.log('评分数据已保存');
    } catch (error) {
        console.error('保存评分数据失败:', error);
    }
}

// 广播在线人数给所有客户端
function broadcastOnlineCount() {
    const count = clients.size;
    const message = JSON.stringify({
        type: 'onlineCount',
        data: { count }
    });
    
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// 判断是否应该显示评分弹窗
function shouldShowRating(gameState) {
    // 每完成5道题显示一次评分
    return gameState.questionsAnswered > 0 && gameState.questionsAnswered % 5 === 0;
}

// 处理WebSocket连接
wss.on('connection', (ws) => {
    console.log('新的客户端连接');
    clients.add(ws);

    // 发送当前在线人数
    broadcastOnlineCount();

    // 立即发送初始排名数据
    const initialData = {
        score: 0,
        accuracyRate: 0
    };
    handleGetRank(ws, initialData);

    // 处理消息
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('收到消息:', data);

            switch (data.type) {
                case 'getRank':
                    handleGetRank(ws, data.data);
                    break;
                case 'updateScore':
                    handleUpdateScore(ws, data.data);
                    break;
                case 'rating':
                    handleRating(ws, data.data);
                    break;
            }
        } catch (error) {
            console.error('处理消息时出错:', error);
        }
    });

    // 处理连接关闭
    ws.on('close', () => {
        console.log('客户端断开连接');
        clients.delete(ws);
        players.delete(ws); // 移除玩家的排名数据
        broadcastOnlineCount();
        broadcastRankUpdate(); // 更新其他玩家的排名
    });
});

// 处理获取排名请求
function handleGetRank(ws, data) {
    const { score, accuracyRate } = data;
    
    // 计算排名
    const playerData = {
        score,
        accuracyRate,
        timestamp: Date.now()
    };
    
    // 更新玩家数据
    players.set(ws, playerData);
    
    // 计算排名
    const sortedPlayers = Array.from(players.values())
        .sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            return b.accuracyRate - a.accuracyRate;
        });
    
    const rank = sortedPlayers.findIndex(p => 
        p.score === score && p.accuracyRate === accuracyRate
    ) + 1;
    
    // 发送排名更新
    ws.send(JSON.stringify({
        type: 'rankUpdate',
        data: {
            rank,
            totalPlayers: players.size
        }
    }));
}

// 处理分数更新
function handleUpdateScore(ws, data) {
    const { score, accuracyRate } = data;
    players.set(ws, {
        score,
        accuracyRate,
        timestamp: Date.now()
    });
    
    // 广播新的排名
    broadcastRankUpdate();
}

// 广播排名更新
function broadcastRankUpdate() {
    const sortedPlayers = Array.from(players.values())
        .sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            return b.accuracyRate - a.accuracyRate;
        });
    
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            const playerData = players.get(client);
            if (playerData) {
                const rank = sortedPlayers.findIndex(p => 
                    p.score === playerData.score && 
                    p.accuracyRate === playerData.accuracyRate
                ) + 1;
                
                client.send(JSON.stringify({
                    type: 'rankUpdate',
                    data: {
                        rank,
                        totalPlayers: players.size
                    }
                }));
            }
        }
    });
}

// 处理评分数据
function handleRating(ws, data) {
    // 处理评分数据
    const ratingData = {
        ...data,
        timestamp: new Date().toISOString(),
        user: gameState.currentUser,
        questionNumber: gameState.questionsAnswered
    };
    
    // 存储评分数据
    ratingsData.push(ratingData);
    saveRatingsToFile();
    
    // 发送确认消息
    ws.send(JSON.stringify({
        type: 'rating_confirmation',
        status: 'success',
        data: ratingData
    }));
}

// 加载历史评分数据
loadRatingsData();

// 启动服务器
server.listen(port, () => {
    console.log(`WebSocket服务器运行在端口 ${port}`);
}); 