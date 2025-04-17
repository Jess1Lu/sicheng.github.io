// 获取DOM元素
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const loginModal = document.getElementById("loginModal");
const registerModal = document.getElementById("registerModal");
const closeBtns = document.querySelectorAll(".close-btn");
const loginForm = document.getElementById("login");
const registerForm = document.getElementById("register");

// 打开登录弹窗
loginBtn.addEventListener("click", function() {
    loginModal.style.display = "block";
    document.body.style.overflow = "hidden"; // 防止背景滚动
});

// 打开注册弹窗
registerBtn.addEventListener("click", function() {
    registerModal.style.display = "block";
    document.body.style.overflow = "hidden"; // 防止背景滚动
});

// 关闭弹窗
closeBtns.forEach(btn => {
    btn.addEventListener("click", function() {
        loginModal.style.display = "none";
        registerModal.style.display = "none";
        document.body.style.overflow = "auto"; // 恢复背景滚动
    });
});

// 点击弹窗外部关闭弹窗
window.addEventListener("click", function(event) {
    if (event.target === loginModal) {
        loginModal.style.display = "none";
        document.body.style.overflow = "auto";
    }
    if (event.target === registerModal) {
        registerModal.style.display = "none";
        document.body.style.overflow = "auto";
    }
});

// 存储用户数据
let users = JSON.parse(localStorage.getItem('users')) || [];

// 登录表单提交
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = this.username.value;
        const password = this.password.value;
        
        // 检查用户是否存在
        const user = users.find(u => u.username === username);
        
        // 先检查用户名是否存在
        if (!user) {
            alert('该用户未注册，请先完成注册！');
            return;
        } else if (user.password !== password) { // 如果用户存在，再检查密码是否正确
            alert('密码错误，请重新输入！');
            return;
        }
        
        // 登录成功
        localStorage.setItem('currentUser', JSON.stringify(user));
        showGameIntro();
    });
}

// 注册表单提交
if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = this.username.value;
        const name = this.name.value;
        const birthplace = this.birthplace.value;
        const age = this.age.value;
        const gender = this.querySelector('input[name="gender"]:checked').value;
        const email = this.email.value;
        const password = this.password.value;
        const confirmPassword = this.confirmPassword.value;
        
        // 检查用户名是否已存在
        if (users.some(u => u.username === username)) {
            alert('该用户名已被占用，请更换其他用户名！');
            return;
        }
        
        // 检查密码是否匹配
        if (password !== confirmPassword) {
            alert('两次输入的密码不一致，请重新输入！');
            return;
        }
        
        // 获取选中的语言
        const languages = Array.from(this.querySelectorAll('input[name="languages"]:checked'))
            .map(checkbox => checkbox.value);
        
        // 创建新用户
        const newUser = {
            username,
            name,
            birthplace,
            age,
            gender,
            languages,
            email,
            password
        };
        
        // 保存用户数据
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        alert('注册成功！');
        document.getElementById('registerModal').style.display = 'none';
    });
}

// 显示游戏介绍弹窗
function showGameIntro() {
    const gameIntroModal = document.getElementById('gameIntroModal');
    if (gameIntroModal) {
        gameIntroModal.style.display = 'block';
    }
}

// 开始游戏按钮点击事件
const startGameBtn = document.querySelector('.start-game-btn');
if (startGameBtn) {
    startGameBtn.addEventListener('click', function() {
        window.location.href = 'game.html';
    });
}

// 评分相关变量
let currentRatings = {
    attractiveness: 0,
    competence: 0,
    education: 0,
    intelligence: 0,
    likability: 0,
    wealth: 0,
    trustworthiness: 0
};

// 初始化评分功能
function initRating() {
    const stars = document.querySelectorAll('.star');
    if (!stars.length) {
        console.log('当前页面没有评分组件');
        return;
    }
    
    stars.forEach(star => {
        star.addEventListener('click', function() {
            const trait = this.parentElement.dataset.trait;
            const rating = parseInt(this.dataset.rating);
            updateRating(trait, rating);
        });
    });

    // 确保评分提交按钮存在并绑定事件
    const submitRatingBtn = document.getElementById('submitRatingBtn');
    if (submitRatingBtn) {
        submitRatingBtn.addEventListener('click', function() {
            console.log('点击提交评分按钮');
            submitRating();
        });
    } else {
        console.error('未找到评分提交按钮');
    }
}

// 更新评分显示
function updateRating(trait, rating) {
    currentRatings[trait] = rating;
    const stars = document.querySelectorAll(`[data-trait="${trait}"] .star`);
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

// 显示感谢页面
function showThankYouModal() {
    console.log('显示感谢页面');
    const modal = document.getElementById('thankYouModal');
    if (modal) {
        modal.style.display = 'block';
        // 确保图片路径正确
        const img = modal.querySelector('img');
        if (img) {
            img.src = 'assets/Happy Loop Sticker by bunny_is_moving.gif';
        }
        console.log('感谢页面已显示');
    } else {
        console.error('未找到感谢页面元素');
    }
}

function closeThankYouModal() {
    const modal = document.getElementById('thankYouModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 提交评分
function submitRating() {
    console.log('提交评分');
    const ratings = {
        attractiveness: getRating('attractiveness'),
        competence: getRating('competence'),
        education: getRating('education'),
        intelligence: getRating('intelligence'),
        likability: getRating('likability'),
        wealth: getRating('wealth'),
        trustworthiness: getRating('trustworthiness')
    };

    // 发送评分数据到服务器
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'rating',
            data: ratings
        }));
    }

    // 直接显示感谢页面
    const thankYouModal = document.getElementById('thankYouModal');
    if (thankYouModal) {
        thankYouModal.style.display = 'block';
        // 隐藏评分弹窗
        const ratingModal = document.getElementById('ratingModal');
        if (ratingModal) {
            ratingModal.style.display = 'none';
        }
    }
}

// 在游戏状态更新时显示评分弹窗
function updateGameState(data) {
    // ... existing code ...
    
    if (data.showRating) {
        document.getElementById('ratingModal').style.display = 'block';
    }
}

// WebSocket连接
let ws = new WebSocket('ws://localhost:3000');

// WebSocket连接状态处理
ws.onopen = function() {
    console.log('已连接到服务器');
};

ws.onerror = function(error) {
    console.error('WebSocket错误:', error);
};

ws.onclose = function() {
    console.log('与服务器断开连接');
};

// WebSocket消息处理
ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log('收到WebSocket消息:', data);

    switch(data.type) {
        case 'onlineCount':
            updateOnlineCount(data.count);
            break;
        case 'gameState':
            updateGameState(data.data);
            break;
        case 'ratingResult':
            if (data.success) {
                console.log('评分提交成功');
                showThankYouModal();
            } else {
                console.error('评分提交失败:', data.message);
            }
            break;
    }
};

// 更新游戏状态
function updateGameState(state) {
    console.log('更新游戏状态:', state);
    // ... 其他状态更新代码 ...

    // 如果游戏状态显示需要评分
    if (state.showRating) {
        console.log('显示评分弹窗');
        showRatingModal();
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
    }
}

// 重置所有评分
function resetAllRatings() {
    const stars = document.querySelectorAll('.rating .star');
    stars.forEach(star => {
        star.classList.remove('active');
    });
}

// 处理答案结果
function handleAnswerResult(result) {
    // 更新分数显示
    document.getElementById('currentScore').textContent = result.score;
    
    // 显示答案结果
    const resultMessage = result.correct ? 
        '回答正确！' : 
        `回答错误，正确答案是：${result.correctProvince}`;
    alert(resultMessage);
    
    // 显示统计信息弹窗
    document.getElementById('statsModal').style.display = 'block';
}

// 提交答案
function submitAnswer() {
    const selectedProvince = document.querySelector('input[name="province"]:checked');
    if (!selectedProvince) {
        alert('请选择一个省份');
        return;
    }
    
    const answerData = {
        type: 'answer',
        province: selectedProvince.value
    };
    
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(answerData));
    } else {
        console.error('WebSocket未连接');
    }
}

// 初始化事件监听器
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM加载完成，初始化事件监听器');
    
    // 检查当前页面是否为游戏页面
    const isGamePage = document.getElementById('ratingModal') !== null;
    
    if (isGamePage) {
        // 初始化游戏页面相关功能
        initRating();
        
        // 评分提交按钮
        const submitRatingBtn = document.getElementById('submitRating');
        if (submitRatingBtn) {
            submitRatingBtn.addEventListener('click', function() {
                console.log('点击提交评分按钮');
                submitRating();
            });
        }
        
        // 答案提交按钮
        const submitAnswerBtn = document.getElementById('submitAnswer');
        if (submitAnswerBtn) {
            submitAnswerBtn.addEventListener('click', function() {
                console.log('点击提交答案按钮');
                submitAnswer();
            });
        }
        
        // 进入评分按钮
        const closeStatsBtn = document.getElementById('closeStats');
        if (closeStatsBtn) {
            closeStatsBtn.addEventListener('click', function() {
                console.log('点击进入评分按钮');
                const statsModal = document.getElementById('statsModal');
                if (statsModal) {
                    statsModal.style.display = 'none';
                }
                showRatingModal();
            });
        }
    }
});

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