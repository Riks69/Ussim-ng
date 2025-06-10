var canvas = document.getElementById("the-game");
canvas.width = 800;
canvas.height = 600;
var context = canvas.getContext("2d");
var game, snake, food;

window.onload = function () {
    loadGame();
    updateShopDisplay();
    updateStatistics();
    game.start();
};

function loadGame() {
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
                try {
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
                } catch (error) {
                    console.log("Achievement check error:", error);
                }
            },

            unlock: function(achievement) {
                try {
                    game.money += achievement.reward * game.rebirthMultiplier;
                    console.log(`Saavutus avatud: ${achievement.name}`);
                    updateStatistics();
                } catch (error) {
                    console.log("Achievement unlock error:", error);
                }
            }
        },

        shop: {
            speedUpgrade: {
                level: 0,
                cost: 50,
                maxLevel: 10,
                buy: function() {
                    if (game.money >= this.cost && this.level < this.maxLevel) {
                        game.money -= this.cost;
                        game.upgrades.speed++;
                        this.level++;
                        this.cost = Math.round(this.cost * 1.5);
                        game.fps = 8 + game.upgrades.speed;
                        updateShopDisplay();
                        saveGame();
                    }
                }
            },
            coinValueUpgrade: {
                level: 0,
                cost: 100,
                maxLevel: 10,
                buy: function() {
                    if (game.money >= this.cost && this.level < this.maxLevel) {
                        game.money -= this.cost;
                        game.upgrades.coinValue++;
                        this.level++;
                        this.cost = Math.round(this.cost * 1.5);
                        updateShopDisplay();
                        saveGame();
                    }
                }
            },
            pigSizeUpgrade: {
                level: 0,
                cost: 150,
                maxLevel: 5,
                buy: function() {
                    if (game.money >= this.cost && this.level < this.maxLevel) {
                        game.money -= this.cost;
                        game.upgrades.pigSize++;
                        this.level++;
                        this.cost = Math.round(this.cost * 1.8);
                        snake.maxTail = 3 + game.upgrades.pigSize;
                        updateShopDisplay();
                        saveGame();
                    }
                }
            },
            luckUpgrade: {
                level: 0,
                cost: 200,
                maxLevel: 5,
                buy: function() {
                    if (game.money >= this.cost && this.level < this.maxLevel) {
                        game.money -= this.cost;
                        game.upgrades.luckLevel++;
                        this.level++;
                        this.cost = Math.round(this.cost * 1.8);
                        updateShopDisplay();
                        saveGame();
                    }
                }
            },
            magnetUpgrade: {
                level: 0,
                cost: 300,
                maxLevel: 5,
                buy: function() {
                    if (game.money >= this.cost && this.level < this.maxLevel) {
                        game.money -= this.cost;
                        game.upgrades.magnetLevel++;
                        this.level++;
                        this.cost = Math.round(this.cost * 1.8);
                        updateShopDisplay();
                        saveGame();
                    }
                }
            },
            multiplierUpgrade: {
                level: 0,
                cost: 500,
                maxLevel: 3,
                buy: function() {
                    if (game.money >= this.cost && this.level < this.maxLevel) {
                        game.money -= this.cost;
                        game.upgrades.multiplierLevel++;
                        this.level++;
                        this.cost = Math.round(this.cost * 2.5);
                        updateShopDisplay();
                        saveGame();
                    }
                }
            }
        },

        createCoinParticles: function (x, y) {
            for (let i = 0; i < 8; i++) {
                let p = {
                    x, y,
                    dx: (Math.random() - 0.5) * 10,
                    dy: (Math.random() - 0.5) * 10,
                    alpha: 1
                };

                const draw = () => {
                    if (p.alpha <= 0) return;
                    context.fillStyle = `rgba(255,215,0,${p.alpha})`;
                    context.beginPath();
                    context.arc(p.x, p.y, 3, 0, Math.PI * 2);
                    context.fill();
                    p.x += p.dx;
                    p.y += p.dy;
                    p.alpha -= 0.05;
                    requestAnimationFrame(draw);
                };
                draw();
            }
        },

        rebirth: function () {
            if (game.money >= game.rebirthCost) {
                game.rebirthMultiplier += 0.5;
                game.money = 0;
                game.upgrades = { speed: 0, coinValue: 0, pigSize: 0, luckLevel: 0, magnetLevel: 0, multiplierLevel: 0 };
                game.shop.speedUpgrade.level = 0;
                game.shop.coinValueUpgrade.level = 0;
                game.shop.pigSizeUpgrade.level = 0;
                game.shop.luckUpgrade.level = 0;
                game.shop.magnetUpgrade.level = 0;
                game.shop.multiplierUpgrade.level = 0;
                game.rebirthCost *= 2;
                updateShopDisplay();
                updateStatistics();
                saveGame();
            }
        },

        buyPigColor: function(colorKey) {
            let color = this.pigColors[colorKey];
            if (color && !this.unlockedColors.includes(color.color) && game.money >= color.cost) {
                game.money -= color.cost;
                this.unlockedColors.push(color.color);
                updateShopDisplay();
                saveGame();
            }
        },

        setPigColor: function(colorKey) {
            let color = this.pigColors[colorKey];
            if (color && this.unlockedColors.includes(color.color)) {
                this.selectedPigColor = color.color;
                snake.color = color.color;
                saveGame();
                updateShopDisplay();
            }
        },

        start: function () {
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

        stop: function () {
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
                if (food.active) {
                    food.draw();
                }
                snake.draw();
                game.drawScore();
                game.drawMessage();
                setTimeout(game.loop, 1000 / game.fps);
            }
        },

        drawBox: function (x, y, size, color) {
            if (color === 'rainbow') {
                let g = context.createLinearGradient(x - size / 2, y - size / 2, x + size / 2, y + size / 2);
                g.addColorStop(0, 'red'); g.addColorStop(0.2, 'orange');
                g.addColorStop(0.4, 'yellow'); g.addColorStop(0.6, 'green');
                g.addColorStop(0.8, 'blue'); g.addColorStop(1, 'violet');
                context.fillStyle = g;
            } else {
                context.fillStyle = color;
            }
            context.beginPath();
            context.arc(x, y, size / 2, 0, Math.PI * 2);
            context.fill();
        },

        drawScore: function () {
            context.fillStyle = '#333';
            context.font = '20px Arial';
            context.textAlign = 'left';
            context.fillText('Skoor: ' + game.score, 10, 25);
            context.fillText('Raha: ' + game.money, 10, 50);
            context.fillText('Level: ' + game.level, 10, 75);
            context.fillText('Rebirth x' + game.rebirthMultiplier.toFixed(1), 10, 100);
        },

        drawMessage: function () {
            if (game.message) {
                context.fillStyle = '#333';
                context.strokeStyle = '#FFF';
                context.font = (canvas.height / 10) + 'px Arial';
                context.textAlign = 'center';
                context.fillText(game.message, canvas.width / 2, canvas.height / 2);
                context.strokeText(game.message, canvas.width / 2, canvas.height / 2);
            }
        },

        resetCanvas: function () {
            context.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    snake = {
        size: 15,
        x: 0, y: 0,
        dx: 15, dy: 0,
        tail: [],
        maxTail: 3,
        color: game.selectedPigColor,

        init() {
            this.x = canvas.width / 2;
            this.y = canvas.height / 2;
            this.dx = this.size;
            this.dy = 0;
            this.tail = [];
            this.maxTail = 3 + game.upgrades.pigSize;
        },

        move() {
            // Lisa uus positsioon enne liikumist
            this.tail.unshift({ x: this.x, y: this.y });
            if (this.tail.length > this.maxTail) this.tail.pop();
            
            this.x += this.dx;
            this.y += this.dy;

            // Magneti loogika
            if (game.upgrades.magnetLevel > 0 && food.active) {
                let r = game.upgrades.magnetLevel * 20;
                let dx = food.x - this.x, dy = food.y - this.y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < r) {
                    food.x -= dx * 0.1;
                    food.y -= dy * 0.1;
                }
            }

            // Seina kontroll
            if (this.x < 0 || this.x >= canvas.width || this.y < 0 || this.y >= canvas.height) {
                game.stop();
                return;
            }

            // Mündi korjamise kontroll
            if (food.active && food.isCollision(this.x, this.y)) {
            food.active = false;
            game.score++;
            game.money += 1 + game.upgrades.coinValue;
            game.totalCoins++;
            this.maxTail++;
            
            try {
                game.achievements.check();
            } catch (error) {
                console.log("Achievement check error in move:", error);
            }
            
            updateStatistics();
            
            // Loo mündi efektid ja uus münt
            game.createCoinParticles(food.x + food.size / 2, food.y + food.size / 2);
            food.set();
        }
    },

        draw() {
            this.tail.forEach(part =>
                game.drawBox(part.x + this.size / 2, part.y + this.size / 2,
                    this.size + game.upgrades.pigSize * 2, this.color));
        },

        changeDirection(dir) {
            if (dir === 'left' && this.dx === 0) { this.dx = -this.size; this.dy = 0; }
            else if (dir === 'up' && this.dy === 0) { this.dx = 0; this.dy = -this.size; }
            else if (dir === 'right' && this.dx === 0) { this.dx = this.size; this.dy = 0; }
            else if (dir === 'down' && this.dy === 0) { this.dx = 0; this.dy = this.size; }
        }
    };

    food = {
        x: 0,
        y: 0,
        size: 15,
        active: true,

        set() {
            this.active = true;
            let gridSize = this.size;
            let maxX = Math.floor((canvas.width - gridSize) / gridSize) * gridSize;
            let maxY = Math.floor((canvas.height - gridSize) / gridSize) * gridSize;
            
            let freeSpots = [];
            
            // Leia kõik vabad kohad
            for (let y = 0; y < maxY; y += gridSize) {
                for (let x = 0; x < maxX; x += gridSize) {
                    let isFree = true;
                    
                    // Kontrolli, kas koht on vaba
                    if (Math.abs(snake.x - x) < gridSize && Math.abs(snake.y - y) < gridSize) {
                        isFree = false;
                    }
                    
                    for (let part of snake.tail) {
                        if (Math.abs(part.x - x) < gridSize && Math.abs(part.y - y) < gridSize) {
                            isFree = false;
                            break;
                        }
                    }
                    
                    if (isFree) freeSpots.push({x, y});
                }
            }
            
            // Vali juhuslik vaba koht
            if (freeSpots.length > 0) {
                let spot = freeSpots[Math.floor(Math.random() * freeSpots.length)];
                this.x = spot.x;
                this.y = spot.y;
            } else {
                // Kui vabu kohti pole, lõpeta mäng
                game.stop();
            }
        },

        draw() {
            if (!this.active) return;
            
            // Mündi joonistamine
            context.beginPath();
            context.arc(this.x + this.size / 2, this.y + this.size / 2, this.size / 2, 0, Math.PI * 2);
            context.fillStyle = '#FFD700';
            context.fill();
            
            // Mündi läike joonistamine
            context.beginPath();
            context.arc(this.x + this.size / 3, this.y + this.size / 3, this.size / 6, 0, Math.PI * 2);
            context.fillStyle = '#FFFFFF';
            context.fill();
            
            // Euro sümboli joonistamine
            context.fillStyle = '#B8860B';
            context.font = `${this.size}px Arial`;
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText('€', this.x + this.size / 2, this.y + this.size / 2);
        },

        isCollision(x, y) {
            if (!this.active) return false;
            return Math.abs(x - this.x) < this.size && Math.abs(y - this.y) < this.size;
        }
    };

    let savedData = localStorage.getItem('piggyGameSave');
    if (savedData) {
        let data = JSON.parse(savedData);
        Object.assign(game, {
            money: data.money || 0,
            totalCoins: data.totalCoins || 0,
            highScore: data.highScore || 0,
            upgrades: data.upgrades || game.upgrades,
            achievements: data.achievements || game.achievements,
            selectedPigColor: data.selectedPigColor || '#FFC0CB',
            unlockedColors: data.unlockedColors || ['#FFC0CB'],
            rebirthMultiplier: data.rebirthMultiplier || 1,
            rebirthCost: data.rebirthCost || 10000
        });
        
        // Taasta poe tasemed
        game.shop.speedUpgrade.level = game.upgrades.speed;
        game.shop.coinValueUpgrade.level = game.upgrades.coinValue;
        game.shop.pigSizeUpgrade.level = game.upgrades.pigSize;
        game.shop.luckUpgrade.level = game.upgrades.luckLevel;
        game.shop.magnetUpgrade.level = game.upgrades.magnetLevel;
        game.shop.multiplierUpgrade.level = game.upgrades.multiplierLevel;
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
        unlockedColors: game.unlockedColors,
        rebirthMultiplier: game.rebirthMultiplier,
        rebirthCost: game.rebirthCost
    };
    localStorage.setItem('piggyGameSave', JSON.stringify(saveData));
}

function updateShopDisplay() {
    // Uuenda raha kuvamist
    document.getElementById('moneyDisplay').textContent = game.money;
    
    // Uuenda uuenduste tasemed ja hinnad
    document.getElementById('speedUpgradeLevel').textContent = game.shop.speedUpgrade.level;
    document.getElementById('speedUpgradeCost').textContent = game.shop.speedUpgrade.cost;
    
    document.getElementById('coinValueUpgradeLevel').textContent = game.shop.coinValueUpgrade.level;
    document.getElementById('coinValueUpgradeCost').textContent = game.shop.coinValueUpgrade.cost;
    
    document.getElementById('pigSizeUpgradeLevel').textContent = game.shop.pigSizeUpgrade.level;
    document.getElementById('pigSizeUpgradeCost').textContent = game.shop.pigSizeUpgrade.cost;
    
    document.getElementById('luckUpgradeLevel').textContent = game.shop.luckUpgrade.level;
    document.getElementById('luckUpgradeCost').textContent = game.shop.luckUpgrade.cost;
    
    document.getElementById('magnetUpgradeLevel').textContent = game.shop.magnetUpgrade.level;
    document.getElementById('magnetUpgradeCost').textContent = game.shop.magnetUpgrade.cost;
    
    document.getElementById('multiplierUpgradeLevel').textContent = game.shop.multiplierUpgrade.level;
    document.getElementById('multiplierUpgradeCost').textContent = game.shop.multiplierUpgrade.cost;
    
    // Uuenda rebirth kuvamist
    document.getElementById('rebirthCost').textContent = game.rebirthCost;
    document.getElementById('rebirthMultiplier').textContent = game.rebirthMultiplier.toFixed(1);
    
    // Uuenda põrsa värvide kuvamist
    let colorShop = document.getElementById('pigColorShop');
    colorShop.innerHTML = '';
    
    for (let colorKey in game.pigColors) {
        let color = game.pigColors[colorKey];
        let colorDiv = document.createElement('div');
        colorDiv.className = 'color-option';
        colorDiv.style.backgroundColor = color.color === 'rainbow' ? 'linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)' : color.color;
        colorDiv.innerHTML = `
            <h4>${color.name}</h4>
            <p>${game.unlockedColors.includes(color.color) ? 'Olemas' : `Hind: ${color.cost}`}</p>
            ${game.unlockedColors.includes(color.color) ? 
                `<button onclick="game.setPigColor('${colorKey}')" ${game.selectedPigColor === color.color ? 'disabled' : ''}>
                    ${game.selectedPigColor === color.color ? 'Valitud' : 'Vali'}
                </button>` : 
                `<button onclick="game.buyPigColor('${colorKey}')" ${game.money >= color.cost ? '' : 'disabled'}>
                    Osta
                </button>`
            }
        `;
        colorShop.appendChild(colorDiv);
    }
}

function updateStatistics() {
    document.getElementById('highScore').textContent = game.highScore;
    document.getElementById('totalCoins').textContent = game.totalCoins;
    document.getElementById('gamesPlayed').textContent = game.gamesPlayed;
    document.getElementById('rebirthMultiplier').textContent = game.rebirthMultiplier.toFixed(1);
    
    // Uuenda saavutuste kuvamist
    let achievementsList = document.getElementById('achievements-list');
    achievementsList.innerHTML = '';
    
    // Lisa mündisaavutused
    game.achievements.coins.forEach(ach => {
        let achDiv = document.createElement('div');
        achDiv.className = `achievement ${ach.achieved ? 'unlocked' : ''}`;
        achDiv.innerHTML = `
            <h4>${ach.name}</h4>
            <p>${ach.achieved ? '✅ Saavutatud' : `Edusamm: ${game.totalCoins}/${ach.requirement}`}</p>
            ${ach.achieved ? `<span class="reward">+${ach.reward * game.rebirthMultiplier} raha</span>` : ''}
        `;
        achievementsList.appendChild(achDiv);
    });
    
    // Lisa skoorisaavutused
    game.achievements.score.forEach(ach => {
        let achDiv = document.createElement('div');
        achDiv.className = `achievement ${ach.achieved ? 'unlocked' : ''}`;
        achDiv.innerHTML = `
            <h4>${ach.name}</h4>
            <p>${ach.achieved ? '✅ Saavutatud' : `Edusamm: ${game.highScore}/${ach.requirement}`}</p>
            ${ach.achieved ? `<span class="reward">+${ach.reward * game.rebirthMultiplier} raha</span>` : ''}
        `;
        achievementsList.appendChild(achDiv);
    });
}

window.addEventListener('keydown', function (e) {
    if (game.over && (e.key === 'k' || e.key === 'K')) return game.start();

    if (!game.over) {
        switch (e.key.toLowerCase()) {
            case 'a': case 'arrowleft': snake.changeDirection('left'); break;
            case 'w': case 'arrowup': snake.changeDirection('up'); break;
            case 'd': case 'arrowright': snake.changeDirection('right'); break;
            case 's': case 'arrowdown': snake.changeDirection('down'); break;
        }
    }
});
