var canvas = document.getElementById("the-game");
canvas.width = 800;
canvas.height = 600;
var context = canvas.getContext("2d");
var game, snake, food;

window.onload = function() {
    loadGame();
    game.start();
};

function loadGame() {
    let savedData = localStorage.getItem('piggyGameSave');
    if (savedData) {
        let data = JSON.parse(savedData);
        game.money = data.money || 0;
        game.totalCoins = data.totalCoins || 0;
        game.highScore = data.highScore || 0;
        game.upgrades = data.upgrades || {
            speed: 0,
            coinValue: 0,
            pigSize: 0,
            luckLevel: 0,
            magnetLevel: 0,
            multiplierLevel: 0
        };
        game.achievements = data.achievements || game.achievements;
        game.selectedPigColor = data.selectedPigColor || '#FFC0CB';
        game.unlockedColors = data.unlockedColors || ['#FFC0CB'];
    }
}

function saveGame() {
    let saveData = {
        money: game.money,
        totalCoins: game.totalCoins,
        highScore: game.highScore,
        upgrades: game.upgrades,
        achievements: game.achievements,
        selectedPigColor: game.selectedPigColor,
        unlockedColors: game.unlockedColors
    };
    localStorage.setItem('piggyGameSave', JSON.stringify(saveData));
}

game = {
    score: 0,
    money: 0,
    level: 1,
    fps: 8,
    over: false,
    message: null,
    highScore: 0,
    totalCoins: 0,
    gamesPlayed: 0,
    selectedPigColor: '#FFC0CB',
    unlockedColors: ['#FFC0CB'],
    rebirthMultiplier: 1,
    rebirthCost: 10000,

    pigColors: {
        pink: { color: '#FFC0CB', cost: 0, name: 'Roosa' },
        gold: { color: '#FFD700', cost: 1000, name: 'Kuldne' },
        blue: { color: '#87CEEB', cost: 2000, name: 'Sinine' },
        purple: { color: '#DDA0DD', cost: 3000, name: 'Lilla' },
        rainbow: { color: 'rainbow', cost: 5000, name: 'Vikerkaar' }
    },

    upgrades: {
        speed: 0,
        coinValue: 0,
        pigSize: 0,
        luckLevel: 0,
        magnetLevel: 0,
        multiplierLevel: 0
    },

    achievements: {
        coins: [
            { id: 'coin100', name: '100 münti kogutud', requirement: 100, achieved: false, reward: 50 },
            { id: 'coin500', name: '500 münti kogutud', requirement: 500, achieved: false, reward: 200 },
            { id: 'coin1000', name: '1000 münti kogutud', requirement: 1000, achieved: false, reward: 500 }
        ],
        score: [
            { id: 'score50', name: '50 punkti', requirement: 50, achieved: false, reward: 100 },
            { id: 'score100', name: '100 punkti', requirement: 100, achieved: false, reward: 300 }
        ],

        check: function() {
            this.coins.forEach(achievement => {
                if (!achievement.achieved && game.totalCoins >= achievement.requirement) {
                    achievement.achieved = true;
                    this.unlock(achievement);
                }
            });

            this.score.forEach(achievement => {
                if (!achievement.achieved && game.score >= achievement.requirement) {
                    achievement.achieved = true;
                    this.unlock(achievement);
                }
            });
            saveGame();
        },

        unlock: function(achievement) {
            game.money += achievement.reward * game.rebirthMultiplier;

            const notification = document.createElement('div');
            notification.className = 'achievement-notification';
            notification.innerHTML = `🏆 Saavutus avatud: ${achievement.name}<br>+${achievement.reward * game.rebirthMultiplier} münti!`;
            document.body.appendChild(notification);

            setTimeout(() => {
                notification.remove();
            }, 3000);

            const achievementsList = document.getElementById('achievements-list');
            if (achievementsList) {
                const achievementElement = document.createElement('div');
                achievementElement.className = 'achievement';
                achievementElement.innerHTML =
                    `<span class="achievement-name">${achievement.name}</span>
                    <span class="achievement-icon">🏆</span>`;
                achievementsList.appendChild(achievementElement);
            }
        }
    },

    createCoinParticles: function(x, y) {
        for (let i = 0; i < 8; i++) {
            let particle = {
                x: x,
                y: y,
                dx: (Math.random() - 0.5) * 10,
                dy: (Math.random() - 0.5) * 10,
                alpha: 1
            };
            
            let drawParticle = function() {
                if (particle.alpha <= 0) return;
                context.fillStyle = `rgba(255, 215, 0, ${particle.alpha})`;
                context.beginPath();
                context.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
                context.fill();
                
                particle.x += particle.dx;
                particle.y += particle.dy;
                particle.alpha -= 0.05;
                
                if (particle.alpha > 0) {
                    requestAnimationFrame(drawParticle);
                }
            };
            
            drawParticle();
        }
    },

    rebirth: function() {
        if (game.money >= game.rebirthCost) {
            game.rebirthMultiplier += 0.5;
            game.money = 0;
            game.upgrades = {
                speed: 0,
                coinValue: 0,
                pigSize: 0,
                luckLevel: 0,
                magnetLevel: 0,
                multiplierLevel: 0
            };
            game.rebirthCost *= 2;
            updateShopDisplay();
            saveGame();
        }
    },

    buyPigColor: function(colorKey) {
        let colorData = this.pigColors[colorKey];
        if (colorData && !this.unlockedColors.includes(colorData.color) && game.money >= colorData.cost) {
            game.money -= colorData.cost;
            this.unlockedColors.push(colorData.color);
            updateShopDisplay();
            saveGame();
        }
    },

    setPigColor: function(colorKey) {
        let colorData = this.pigColors[colorKey];
        if (colorData && this.unlockedColors.includes(colorData.color)) {
            this.selectedPigColor = colorData.color;
            snake.color = colorData.color;
            saveGame();
        }
    },

    start: function() {
        game.over = false;
        game.message = null;
        game.score = 0;
        game.fps = 8 + game.upgrades.speed;
        snake.init();
        food.set();
        snake.color = game.selectedPigColor;
        game.loop();
        game.gamesPlayed++;
        updateStatistics();
    },

    stop: function() {
        game.over = true;
        game.message = 'MÄNG LÄBI - VAJUTA K';
        if (game.score > game.highScore) {
            game.highScore = game.score;
            updateStatistics();
        }
        saveGame();
    },

    loop: function() {
        if (!game.over) {
            game.resetCanvas();
            snake.move();
            food.draw();
            snake.draw();
            game.drawScore();
            game.drawMessage();
            setTimeout(game.loop, 1000 / game.fps);
        }
    },

    drawBox: function(x, y, size, color) {
        if (color === 'rainbow') {
            let gradient = context.createLinearGradient(x - size/2, y - size/2, x + size/2, y + size/2);
            gradient.addColorStop(0, 'red');
            gradient.addColorStop(0.2, 'orange');
            gradient.addColorStop(0.4, 'yellow');
            gradient.addColorStop(0.6, 'green');
            gradient.addColorStop(0.8, 'blue');
            gradient.addColorStop(1, 'violet');
            context.fillStyle = gradient;
        } else {
            context.fillStyle = color;
        }
        context.beginPath();
        context.arc(x, y, size/2, 0, Math.PI * 2);
        context.fill();
        
        if (snake.tail.length > 0 && x === snake.tail[snake.tail.length-1].x + snake.size/2) {
            context.fillStyle = 'black';
            context.beginPath();
            context.arc(x - size/4, y - size/4, size/8, 0, Math.PI * 2);
            context.arc(x + size/4, y - size/4, size/8, 0, Math.PI * 2);
            context.fill();
        }
    },

    drawScore: function() {
        context.fillStyle = '#333';
        context.font = '20px Arial';
        context.textAlign = 'left';
        context.fillText('Skoor: ' + game.score, 10, 25);
        context.fillText('Raha: ' + game.money, 10, 50);
        context.fillText('Level: ' + game.level, 10, 75);
        context.fillText('Rebirth Multiplier: x' + game.rebirthMultiplier.toFixed(1), 10, 100);
    },

    drawMessage: function() {
        if (game.message !== null) {
            context.fillStyle = '#333';
            context.strokeStyle = '#FFF';
            context.font = (canvas.height / 10) + 'px Arial';
            context.textAlign = 'center';
            context.fillText(game.message, canvas.width / 2, canvas.height / 2);
            context.strokeText(game.message, canvas.width / 2, canvas.height / 2);
        }
    },

    resetCanvas: function() {
        context.clearRect(0, 0, canvas.width, canvas.height);
    },

    shop: {
        speedUpgrade: {
            cost: 50,
            level: 1,
            maxLevel: 10,
            buy: function() {
                if (game.money >= this.cost && this.level < this.maxLevel) {
                    game.money -= this.cost;
                    game.upgrades.speed += 2;
                    this.level++;
                    this.cost = Math.floor(this.cost * 1.5);
                    game.fps = 8 + game.upgrades.speed;
                    updateShopDisplay();
                    saveGame();
                }
            }
        },
        coinValueUpgrade: {
            cost: 100,
            level: 1,
            maxLevel: 10,
            buy: function() {
                if (game.money >= this.cost && this.level < this.maxLevel) {
                    game.money -= this.cost;
                    game.upgrades.coinValue++;
                    this.level++;
                    this.cost = Math.floor(this.cost * 1.5);
                    updateShopDisplay();
                    saveGame();
                }
            }
        },
        pigSizeUpgrade: {
            cost: 150,
            level: 1,
            maxLevel: 5,
            buy: function() {
                if (game.money >= this.cost && this.level < this.maxLevel) {
                    game.money -= this.cost;
                    game.upgrades.pigSize++;
                    snake.size += 2;
                    this.level++;
                    this.cost = Math.floor(this.cost * 1.8);
                    updateShopDisplay();
                    saveGame();
                }
            }
        },
        luckUpgrade: {
            cost: 200,
            level: 1,
            maxLevel: 5,
            buy: function() {
                if (game.money >= this.cost && this.level < this.maxLevel) {
                    game.money -= this.cost;
                    game.upgrades.luckLevel++;
                    this.level++;
                    this.cost = Math.floor(this.cost * 2);
                    updateShopDisplay();
                    saveGame();
                }
            }
        },
        magnetUpgrade: {
            cost: 250,
            level: 1,
            maxLevel: 5,
            buy: function() {
                if (game.money >= this.cost && this.level < this.maxLevel) {
                    game.money -= this.cost;
                    game.upgrades.magnetLevel++;
                    this.level++;
                    this.cost = Math.floor(this.cost * 2);
                    updateShopDisplay();
                    saveGame();
                }
            }
        },
        multiplierUpgrade: {
            cost: 300,
            level: 1,
            maxLevel: 5,
            buy: function() {
                if (game.money >= this.cost && this.level < this.maxLevel) {
                    game.money -= this.cost;
                    game.upgrades.multiplierLevel++;
                    game.rebirthMultiplier += 0.1;
                    this.level++;
                    this.cost = Math.floor(this.cost * 2.5);
                    updateShopDisplay();
                    saveGame();
                }
            }
        }
    }
};

snake = {
    size: 15,
    x: 0,
    y: 0,
    dx: 15,
    dy: 0,
    tail: [],
    maxTail: 3,
    color: game.selectedPigColor,

    init: function() {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.dx = this.size;
        this.dy = 0;
        this.tail = [];
        this.maxTail = 3;
    },

    move: function() {
        this.x += this.dx;
        this.y += this.dy;

        if (game.upgrades.magnetLevel > 0) {
            let magnetRange = game.upgrades.magnetLevel * 20;
            let dx = food.x - this.x;
            let dy = food.y - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < magnetRange) {
                food.x -= (dx * 0.1);
                food.y -= (dy * 0.1);
                food.x = Math.max(0, Math.min(canvas.width - food.size, food.x));
                food.y = Math.max(0, Math.min(canvas.height - food.size, food.y));
            }
        }

        if (this.x < 0 || this.x >= canvas.width || this.y < 0 || this.y >= canvas.height) {
            game.stop();
            return;
        }

        this.tail.push({ x: this.x, y: this.y });

        while (this.tail.length > this.maxTail) {
            this.tail.shift();
        }

        if (food.isCollision(this.x, this.y)) {
            //game.createCoinParticles(this.x + this.size/2, this.y + this.size/2);
            game.score++;
            game.money += 1 + game.upgrades.coinValue;
            game.totalCoins++;
            this.maxTail++;
            food.set();
            game.achievements.check();
            updateStatistics();
        }
    },

    draw: function() {
        this.tail.forEach(part => {
            game.drawBox(part.x + this.size/2, part.y + this.size/2, this.size + game.upgrades.pigSize * 2, this.color);
        });
    },

    changeDirection: function(direction) {
        switch(direction) {
            case 'left':
                if (this.dx === 0) { this.dx = -this.size; this.dy = 0; }
                break;
            case 'up':
                if (this.dy === 0) { this.dx = 0; this.dy = -this.size; }
                break;
            case 'right':
                if (this.dx === 0) { this.dx = this.size; this.dy = 0; }
                break;
            case 'down':
                if (this.dy === 0) { this.dx = 0; this.dy = this.size; }
                break;
        }
    }
};

food = {
    x: 0,
    y: 0,
    size: 15,

    set: function() {
        this.x = Math.floor(Math.random() * (canvas.width / this.size)) * this.size;
        this.y = Math.floor(Math.random() * (canvas.height / this.size)) * this.size;
    },

    draw: function() {
        context.beginPath();
        context.arc(this.x + this.size/2, this.y + this.size/2, this.size/2, 0, Math.PI * 2);
        context.fillStyle = '#FFD700';
        context.fill();
        
        context.beginPath();
        context.arc(this.x + this.size/3, this.y + this.size/3, this.size/6, 0, Math.PI * 2);
        context.fillStyle = '#FFFFFF';
        context.fill();
        
        context.fillStyle = '#B8860B';
        context.font = `${this.size}px Arial`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('€', this.x + this.size/2, this.y + this.size/2);
    },

    isCollision: function(x, y) {
        let pigX = x + snake.size/2;
        let pigY = y + snake.size/2;
        let coinX = this.x + this.size/2;
        let coinY = this.y + this.size/2;
        
        let distance = Math.sqrt(
            Math.pow(pigX - coinX, 2) + 
            Math.pow(pigY - coinY, 2)
        );
        
        return distance < snake.size;
    }
};

window.addEventListener('keydown', function(e) {
    if (game.over && (e.key === 'k' || e.key === 'K')) {
        game.start();
        return;
    }

    if (!game.over) {
        switch(e.key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                snake.changeDirection('left');
                break;
            case 'ArrowUp':
            case 'w':
            case 'W':
                snake.changeDirection('up');
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                snake.changeDirection('right');
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                snake.changeDirection('down');
                break;
        }
    }
});

updateShopDisplay();
updateStatistics();
