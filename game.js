// 游戏状态
const gameState = {
    currentStimulus: null,
    totalStimuli: 32,
    currentScore: 0,
    currentProgress: 0,
    stimuli: [], // 将存储32个音频刺激
    selectedProvince: null
};

// 音频播放器相关元素
const audioPlayer = document.getElementById('audioPlayer');
const playButton = document.getElementById('playAudio');
const progressBar = document.querySelector('.progress-bar');
const speakerAvatar = document.getElementById('speakerAvatar');

// 音频相关变量
let isPlaying = false;
const audioSources = {
    'assets/mandarin1.mp3': 'shanxi',      // 山西话者
    'assets/mandarin2.mp3': 'jiangsu'      // 南京话者
};
let currentAudioSource = '';
let score = 0;

// 获取DOM元素
let audioElement;
let scoreDisplay;

// 游戏统计数据
const gameStats = {
    score: 0,
    totalAttempts: 0,
    correctAttempts: 0,
    accuracyRate: 0,
    rank: '加载中...',
    totalPlayers: '加载中...',
    onlinePlayers: 0
};

// WebSocket连接
let ws;

// 初始化DOM元素
function initializeElements() {
    audioElement = document.getElementById('currentAudio');
    scoreDisplay = document.getElementById('currentScore');
    
    if (!playButton || !audioElement || !scoreDisplay) {
        console.error('无法找到必要的DOM元素');
        return false;
    }
    return true;
}

console.log('音频元素1:', audioElement);

// 初始化游戏
function initializeGame() {
    console.log('初始化游戏');
    try {
        // 检查必要的DOM元素
        const audioPlayer = document.getElementById('audioPlayer');
        if (!audioPlayer) {
            console.error('未找到音频播放器元素');
            return;
        }

        // 初始化音频播放器
        audioPlayer.addEventListener('canplaythrough', function() {
            console.log('音频加载完成');
        });

        audioPlayer.addEventListener('error', function(e) {
            console.error('音频加载错误:', e);
        });

        // 加载第一个刺激
        loadNextStimulus();
    } catch (error) {
        console.error('初始化游戏时出错:', error);
    }
}

// 加载下一个刺激
function loadNextStimulus() {
    console.log('加载下一个刺激');
    try {
        const audioPlayer = document.getElementById('audioPlayer');
        if (!audioPlayer) {
            console.error('未找到音频播放器元素');
            return;
        }

        // 获取当前刺激
        const currentStimulus = getCurrentStimulus();
        if (!currentStimulus) {
            console.error('未找到当前刺激');
            return;
        }

        // 设置音频源
        audioPlayer.src = currentStimulus.audioUrl;
        console.log('设置音频源:', currentStimulus.audioUrl);

        // 加载音频
        audioPlayer.load();
    } catch (error) {
        console.error('加载刺激时出错:', error);
    }
}

// 获取当前刺激
function getCurrentStimulus() {
    // 这里应该从游戏状态中获取当前刺激
    // 临时返回一个测试刺激
    return {
        audioUrl: 'assets/mandarin1.mp3'
    };
}

// 初始化音频
function initAudio() {
    if (!audioElement) return;
    audioElement.preload = 'auto';
    setRandomAudio();
    console.log('音频初始化完成');
}

// 随机选择并设置音频源
function setRandomAudio() {
    if (!audioElement) return;
    const sources = Object.keys(audioSources);
    const randomIndex = Math.floor(Math.random() * sources.length);
    currentAudioSource = sources[randomIndex];
    console.log('选择的音频:', currentAudioSource);
    audioElement.src = currentAudioSource;
    return currentAudioSource;
}

// 播放音频
function playAudio() {
    if (!audioElement || !audioElement.src) {
        console.error('未设置音频源或音频元素未找到');
        return;
    }

    if (isPlaying) {
        // 暂停播放
        audioElement.pause();
        audioElement.currentTime = 0;
        isPlaying = false;
        playButton.querySelector('.play-icon').textContent = '▶';
    } else {
        // 开始播放
        audioElement.currentTime = 0;
        audioElement.play()
            .then(() => {
                isPlaying = true;
                playButton.querySelector('.play-icon').textContent = '⏸';
                console.log('音频开始播放');
            })
            .catch(error => {
                console.error('播放失败:', error);
                alert('音频播放失败，请重试');
            });
    }
}

// 音频事件监听
function setupAudioListeners() {
    if (!audioElement) return;
    
    audioElement.addEventListener('ended', () => {
        isPlaying = false;
        playButton.querySelector('.play-icon').textContent = '▶';
        console.log('音频播放结束');
    });

    audioElement.addEventListener('error', (e) => {
        console.error('音频错误:', e);
        alert('音频加载失败，请刷新页面重试');
    });

    audioElement.addEventListener('loadeddata', () => {
        console.log('音频加载完成');
    });
}

// 更新正确率和排名
function updateStats(isCorrect) {
    gameStats.totalAttempts++;
    if (isCorrect) {
        gameStats.correctAttempts++;
    }
    
    // 计算正确率
    gameStats.accuracyRate = (gameStats.correctAttempts / gameStats.totalAttempts) * 100;
    
    // 更新显示
    document.getElementById('accuracyRate').textContent = 
        gameStats.accuracyRate.toFixed(1) + '%';
    
    // 等待服务器返回真实排名数据
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'getRank',
            data: {
                score: gameStats.score,
                accuracyRate: gameStats.accuracyRate
            }
        }));
    }
}

// 更新分数显示
function updateScore(change) {
    const scoreElement = document.getElementById('currentScore');
    gameStats.score += change;
    
    // 添加动画效果
    scoreElement.classList.remove('score-change', 'score-increase', 'score-decrease');
    void scoreElement.offsetWidth; // 触发重绘
    scoreElement.classList.add('score-change');
    scoreElement.classList.add(change > 0 ? 'score-increase' : 'score-decrease');
    
    scoreElement.textContent = gameStats.score;
}

// 检查答案
function checkAnswer(selectedProvince) {
    const correctProvince = audioSources[currentAudioSource];
    const isCorrect = selectedProvince === correctProvince;
    
    // 更新分数和统计
    updateScore(isCorrect ? 1 : -1);
    updateStats(isCorrect);
    
    // 显示反馈
    const feedback = isCorrect ? 
        '答对了！这位说话者来自' + getProvinceDisplayName(correctProvince) :
        '答错了。这位说话者来自' + getProvinceDisplayName(correctProvince);
    
    // 高亮显示正确和错误的选项
    const selectedOption = document.querySelector(`input[value="${selectedProvince}"]`).parentElement;
    const correctOption = document.querySelector(`input[value="${correctProvince}"]`).parentElement;
    
    if (isCorrect) {
        selectedOption.classList.add('correct-answer');
    } else {
        selectedOption.classList.add('wrong-answer');
        correctOption.classList.add('correct-answer');
    }
    
    // 显示反馈信息
    alert(feedback);
    
    // 停止当前音频播放
    if (isPlaying) {
        audioElement.pause();
        audioElement.currentTime = 0;
        isPlaying = false;
        playButton.querySelector('.play-icon').textContent = '▶';
    }
    
    // 显示统计信息弹窗
    const statsModal = document.getElementById('statsModal');
    statsModal.style.display = 'block';
    
    // 添加关闭按钮事件监听
    const closeBtn = document.getElementById('closeStats');
    closeBtn.onclick = function() {
        statsModal.style.display = 'none';
        // 延迟后重置并准备新的音频
        setTimeout(() => {
            // 移除高亮样式
            document.querySelectorAll('.province-option').forEach(option => {
                option.classList.remove('correct-answer', 'wrong-answer');
            });
            
            // 重置单选按钮
            document.querySelectorAll('input[name="province"]').forEach(radio => {
                radio.checked = false;
            });
            
            // 设置新的音频
            setRandomAudio();
        }, 500);
    };
}

// 获取省份显示名称
function getProvinceDisplayName(provinceId) {
    const provinceNames = {
        'shanxi': '山西省',
        'jiangsu': '江苏省（南京）'
    };
    return provinceNames[provinceId] || provinceId;
}

// 重置省份状态
function resetProvinceStates() {
    const provinces = document.querySelectorAll('.province-area');
    provinces.forEach(province => {
        province.classList.remove('selected', 'correct', 'wrong');
    });
    gameState.selectedProvince = null;
}

// 结束游戏
function endGame() {
    // 显示最终得分
    alert(`游戏结束！\n最终得分：${score}/${gameState.totalStimuli}`);
    // 这里可以添加更多结束游戏的逻辑
}

// 工具函数：随机打乱数组
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 初始化事件监听器
function setupEventListeners() {
    if (!playButton) return;
    playButton.addEventListener('click', playAudio);

    const submitButton = document.getElementById('submitAnswer');
    if (submitButton) {
        submitButton.addEventListener('click', function() {
            const selectedProvince = document.querySelector('input[name="province"]:checked');
            if (!selectedProvince) {
                alert('请选择一个省份！');
                return;
            }
            checkAnswer(selectedProvince.value);
        });
    }
}

// 初始化WebSocket连接
function initWebSocket() {
    try {
        const wsUrl = 'ws://localhost:3000';
        console.log('正在连接WebSocket:', wsUrl);
        
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('WebSocket连接已建立');
            // 连接建立后立即请求排名数据
            ws.send(JSON.stringify({
                type: 'getRank',
                data: {
                    score: gameStats.score,
                    accuracyRate: gameStats.accuracyRate
                }
            }));
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('收到WebSocket消息:', data);
                
                if (data.type === 'onlineCount') {
                    const onlinePlayersElement = document.getElementById('onlinePlayers');
                    if (onlinePlayersElement) {
                        onlinePlayersElement.textContent = data.count;
                        gameStats.onlinePlayers = data.count;
                    }
                } else if (data.type === 'rankUpdate') {
                    const rankElement = document.getElementById('accuracyRank');
                    const totalPlayersElement = document.getElementById('totalPlayers');
                    if (rankElement && totalPlayersElement) {
                        rankElement.textContent = data.rank;
                        totalPlayersElement.textContent = data.totalPlayers;
                        gameStats.rank = data.rank;
                        gameStats.totalPlayers = data.totalPlayers;
                    }
                }
            } catch (error) {
                console.error('处理WebSocket消息时出错:', error);
            }
        };

        ws.onclose = () => {
            console.log('WebSocket连接已断开，3秒后重新连接...');
            setTimeout(initWebSocket, 3000);
        };

        ws.onerror = (error) => {
            console.error('WebSocket错误:', error);
        };
    } catch (error) {
        console.error('初始化WebSocket时出错:', error);
        setTimeout(initWebSocket, 3000);
    }
}

// 显示评分弹窗
function showRatingModal() {
    console.log('显示评分弹窗');
    const ratingModal = document.getElementById('ratingModal');
    if (ratingModal) {
        ratingModal.style.display = 'block';
        // 重置所有评分
        resetAllRatings();
        // 添加点击外部关闭功能
        window.onclick = function(event) {
            if (event.target === ratingModal) {
                ratingModal.style.display = 'none';
            }
        };
    } else {
        console.error('未找到评分弹窗元素');
    }
}

// 重置所有评分
function resetAllRatings() {
    const stars = document.querySelectorAll('.rating .star');
    stars.forEach(star => {
        star.classList.remove('active');
    });
}

// 初始化评分功能
function initRating() {
    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
        star.addEventListener('click', function() {
            const trait = this.parentElement.dataset.trait;
            const rating = parseInt(this.dataset.value);
            updateRating(trait, rating);
        });
    });

    document.getElementById('submitRating').addEventListener('click', submitRating);
}

// 更新评分显示
function updateRating(trait, rating) {
    const stars = document.querySelectorAll(`[data-trait="${trait}"] .star`);
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

// 关闭感谢页面
function closeThankYouModal() {
    console.log('关闭感谢页面');
    const thankYouModal = document.getElementById('thankYouModal');
    if (thankYouModal) {
        thankYouModal.style.display = 'none';
    }
}

// 提交评分
function submitRating() {
    console.log('提交评分');
    const ratings = {};
    const traits = ['attractiveness', 'competence', 'education', 'intelligence', 'likability', 'wealth', 'trustworthiness'];
    
    traits.forEach(trait => {
        const activeStars = document.querySelectorAll(`[data-trait="${trait}"] .star.active`).length;
        ratings[trait] = activeStars;
    });
    
    // 发送评分数据到服务器
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'rating',
            data: ratings
        }));
    }
    
    // 隐藏评分弹窗
    const ratingModal = document.getElementById('ratingModal');
    if (ratingModal) {
        ratingModal.style.display = 'none';
    }
    
    // 显示感谢页面
    const thankYouModal = document.getElementById('thankYouModal');
    if (thankYouModal) {
        thankYouModal.style.display = 'block';
        console.log('显示感谢页面');
    } else {
        console.error('未找到感谢页面元素');
    }
}

// 页面加载完成时的初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('页面加载开始');
    
    // 初始化所有DOM元素
    if (!initializeElements()) {
        console.error('初始化失败');
        return;
    }
    
    // 初始化音频和事件监听
    initAudio();
    setupAudioListeners();
    setupEventListeners();
    
    // 初始化统计显示
    document.getElementById('accuracyRate').textContent = '0.0%';
    document.getElementById('accuracyRank').textContent = gameStats.rank;
    document.getElementById('totalPlayers').textContent = gameStats.totalPlayers;
    document.getElementById('currentScore').textContent = gameStats.score;
    
    // 初始化WebSocket连接
    console.log('正在初始化WebSocket连接...');
    initWebSocket();
    
    // 初始化评分功能
    initRating();
    
    // 添加进入评分按钮事件监听
    const closeStatsBtn = document.getElementById('closeStats');
    if (closeStatsBtn) {
        closeStatsBtn.addEventListener('click', function() {
            // 隐藏统计信息弹窗
            const statsModal = document.getElementById('statsModal');
            if (statsModal) {
                statsModal.style.display = 'none';
            }
            // 显示评分弹窗
            showRatingModal();
        });
    }
    
    console.log('页面初始化完成');
});

// 页面关闭时清理
window.addEventListener('beforeunload', () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
    }
});

// 当页面加载完成时初始化游戏
document.addEventListener('DOMContentLoaded', initializeGame); 