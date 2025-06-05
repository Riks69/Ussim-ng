var canvas = document.getElementById("the-game");
canvas.width = 800;
canvas.height = 600;
var context = canvas.getContext("2d");
var game, snake, food;

window.onload = function () {
    loadGame();
    game.start();
};

function loadGame() {
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
            unlockedColors: data.unlockedColors || ['#FFC0CB']
        });
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

function updateShopDisplay() {
    // Lihtsustatud placeholder; vajadusel lisa DOM-i uuendused
    console.log("Pood uuendatud: ", game.upgrades, game.money);
}

function updateStatistics() {
    try {
        console.log("Statistika uuendatud: ", game.score, game.highScore, game.totalCoins);
    } catch (error) {
        console.log("Statistics update error:", error);
    }
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
            } catch (error) {
                console.log("Achievement unlock error:", error);
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
            game.rebirthCost *= 2;
            updateShopDisplay();
            saveGame();
        }
    },

    buyPigColor(colorKey) {
        let color = this.pigColors[colorKey];
        if (color && !this.unlockedColors.includes(color.color) && game.money >= color.cost) {
            game.money -= color.cost;
            this.unlockedColors.push(color.color);
            updateShopDisplay();
            saveGame();
        }
    },

    setPigColor(colorKey) {
        let color = this.pigColors[colorKey];
        if (color && this.unlockedColors.includes(color.color)) {
            this.selectedPigColor = color.color;
            snake.color = color.color;
            saveGame();
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
        this.maxTail = 3;
    },

    move() {
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

        // Lisa uus positsioon saba massiivi
        this.tail.push({ x: this.x, y: this.y });
        if (this.tail.length > this.maxTail) this.tail.shift();

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
        // Arvuta uus positsioon ruudustiku põhiselt
        let gridSize = this.size;
        let maxX = Math.floor(canvas.width / gridSize);
        let maxY = Math.floor(canvas.height / gridSize);
        
        let newX, newY;
        let validPosition = false;
        
        while (!validPosition) {
            newX = Math.floor(Math.random() * maxX) * gridSize;
            newY = Math.floor(Math.random() * maxY) * gridSize;
            
            // Kontrolli, et uus positsioon ei kattuks ussiga
            validPosition = true;
            for (let part of snake.tail) {
                if (Math.abs(part.x - newX) < gridSize && Math.abs(part.y - newY) < gridSize) {
                    validPosition = false;
                    break;
                }
            }
            
            // Kontrolli, et münt ei tekiks liiga lähedale ussi peale
            if (Math.abs(snake.x - newX) < gridSize && Math.abs(snake.y - newY) < gridSize) {
                validPosition = false;
            }
        }
        
        this.x = newX;
        this.y = newY;
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
        
        let dx = (x + snake.size / 2) - (this.x + this.size / 2);
        let dy = (y + snake.size / 2) - (this.y + this.size / 2);
        let distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (snake.size + this.size) / 2;
    }
};


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
