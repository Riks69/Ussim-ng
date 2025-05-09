var canvas = document.getElementById("the-game");
canvas.width = 800;
canvas.height = 600;
var context = canvas.getContext("2d");
var game, snake, food;

// Alusta mängu kohe kui leht laeb
window.onload = function() {
    game.start();
};

game = {
    score: 0,
    money: 0,
    level: 1,
    fps: 8,
    over: false,
    message: null,
    upgrades: {
        speed: 0,
        coinValue: 0,
        pigSize: 0,
        luckLevel: 0
    },
    
    start: function() {
        game.over = false;
        game.message = null;
        game.score = 0;
        game.fps = 8 + game.upgrades.speed;
        snake.init();
        food.set();
    },
    
    stop: function() {
        game.over = true;
        game.message = 'MÄNG LÄBI - VAJUTA TÜHIKUT';
    },
    
    drawBox: function(x, y, size, color) {
        context.fillStyle = color;
        context.beginPath();
        context.moveTo(x - (size / 2), y - (size / 2));
        context.lineTo(x + (size / 2), y - (size / 2));
        context.lineTo(x + (size / 2), y + (size / 2));
        context.lineTo(x - (size / 2), y + (size / 2));
        context.closePath();
        context.fill();
    },
    
    drawScore: function() {
        context.fillStyle = '#333';
        context.font = '20px Arial';
        context.textAlign = 'left';
        context.fillText('Skoor: ' + game.score, 10, 25);
        context.fillText('Raha: ' + game.money, 10, 50);
        context.fillText('Level: ' + game.level, 10, 75);
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
                    game.fps += 2;
                    updateShopDisplay();
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
                    game.upgrades.coinValue += 1;
                    this.level++;
                    this.cost = Math.floor(this.cost * 1.5);
                    updateShopDisplay();
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
                    game.upgrades.pigSize += 1;
                    snake.size *= 1.1;
                    this.level++;
                    this.cost = Math.floor(this.cost * 1.8);
                    updateShopDisplay();
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
                    game.upgrades.luckLevel += 1;
                    this.level++;
                    this.cost = Math.floor(this.cost * 2);
                    updateShopDisplay();
                }
            }
        }
    }
};

snake = {
    size: canvas.width / 40,
    x: null,
    y: null,
    color: '#FFC0CB',
    direction: 'left',
    sections: [],
    
    init: function() {
        snake.sections = [];
        snake.direction = 'left';
        snake.x = canvas.width / 2 + snake.size / 2;
        snake.y = canvas.height / 2 + snake.size / 2;
        for (var i = snake.x + (5 * snake.size); i >= snake.x; i -= snake.size) {
            snake.sections.push(i + ',' + snake.y); 
        }
    },
    
    move: function() {
        switch (snake.direction) {
            case 'up':
                snake.y -= snake.size;
                break;
            case 'down':
                snake.y += snake.size;
                break;
            case 'left':
                snake.x -= snake.size;
                break;
            case 'right':
                snake.x += snake.size;
                break;
        }
        snake.checkCollision();
        snake.checkGrowth();
        snake.sections.push(snake.x + ',' + snake.y);
    },
    
    draw: function() {
        for (var i = 0; i < snake.sections.length; i++) {
            snake.drawSection(snake.sections[i].split(','), i === snake.sections.length - 1);
        }    
    },
    
    drawSection: function(section, isHead) {
        let x = parseInt(section[0]);
        let y = parseInt(section[1]);
        
        // Põhikeha
        game.drawBox(x, y, snake.size, snake.color);
        
        // Kui on pea, siis joonista kõrvad ja nina
        if (isHead) {
            // Kõrvad
            context.fillStyle = '#FFB6C1';
            context.beginPath();
            context.arc(x - snake.size/3, y - snake.size/2, snake.size/4, 0, Math.PI * 2);
            context.arc(x + snake.size/3, y - snake.size/2, snake.size/4, 0, Math.PI * 2);
            context.fill();
            
            // Nina
            context.fillStyle = '#FF69B4';
            context.beginPath();
            context.arc(x, y, snake.size/4, 0, Math.PI * 2);
            context.fill();
        }
    },
    
    checkCollision: function() {
        if (snake.isCollision(snake.x, snake.y) === true) {
            game.stop();
        }
    },
    
    isCollision: function(x, y) {
        if (x < snake.size / 2 ||
            x > canvas.width ||
            y < snake.size / 2 ||
            y > canvas.height ||
            snake.sections.indexOf(x + ',' + y) >= 0) {
            return true;
        }
        return false;
    },
    
    checkGrowth: function() {
        if (snake.x == food.x && snake.y == food.y) {
            game.score++;
            let coinValue = food.value * (1 + game.upgrades.coinValue * 0.5);
            game.money += Math.floor(coinValue);
            updateShopDisplay();
            
            if (game.score % 5 == 0) {
                game.level++;
                game.message = 'Level ' + game.level + '!';
                setTimeout(() => game.message = null, 1000);
                
                if (game.fps < 60) {
                    game.fps++;
                }
            }
            food.set();
        } else {
            snake.sections.shift();
        }
    }
};

var coinTypes = [
    { value: 10, color: '#FFD700', chance: 60 }, // Kuldne münt
    { value: 25, color: '#C0C0C0', chance: 25 }, // Hõbedane münt
    { value: 50, color: '#E5E4E2', chance: 10 }, // Plaatinamünt
    { value: 100, color: '#50C878', chance: 5 }  // Smaragdmünt
];

food = {
    size: null,
    x: null,
    y: null,
    color: '#FFD700',
    value: 10,
    
    set: function() {
        food.size = snake.size;
        food.x = (Math.ceil(Math.random() * (canvas.width/snake.size - 2)) * snake.size) - snake.size / 2;
        food.y = (Math.ceil(Math.random() * (canvas.height/snake.size - 2)) * snake.size) - snake.size / 2;
        
        // Vali mündi tüüp
        let roll = Math.random() * 100;
        let cumulative = 0;
        let bonusChance = game.upgrades.luckLevel * 5;

        for (let coin of coinTypes) {
            let adjustedChance = coin.chance + (bonusChance * (coin.value/10));
            cumulative += adjustedChance;
            if (roll <= cumulative) {
                food.color = coin.color;
                food.value = coin.value;
                break;
            }
        }
    },
    
    draw: function() {
        context.fillStyle = this.color;
        context.beginPath();
        context.arc(this.x, this.y, this.size/2, 0, Math.PI * 2);
        context.fill();
        context.strokeStyle = '#000';
        context.lineWidth = 2;
        context.stroke();
        
        context.fillStyle = '#000';
        context.font = '12px Arial';
        context.textAlign = 'center';
        context.fillText(this.value, this.x, this.y + 4);
    }
};

var inverseDirection = {
    'up': 'down',
    'left': 'right',
    'right': 'left',
    'down': 'up'
};

var keys = {
    up: [38, 75, 87],
    down: [40, 74, 83],
    left: [37, 65, 72],
    right: [39, 68, 76],
    start_game: [13, 32]
};

function getKey(value) {
    for (var key in keys) {
        if (keys[key] instanceof Array && keys[key].indexOf(value) >= 0) {
            return key;
        }
    }
    return null;
}

addEventListener("keydown", function (e) {
    var lastKey = getKey(e.keyCode);
    if (['up', 'down', 'left', 'right'].indexOf(lastKey) >= 0
        && lastKey != inverseDirection[snake.direction]) {
        snake.direction = lastKey;
    } else if (['start_game'].indexOf(lastKey) >= 0 && game.over) {
        game.start();
    }
}, false);

function updateShopDisplay() {
    document.getElementById('moneyDisplay').textContent = game.money;
    document.getElementById('speedLevel').textContent = game.shop.speedUpgrade.level;
    document.getElementById('speedCost').textContent = game.shop.speedUpgrade.cost;
    document.getElementById('coinLevel').textContent = game.shop.coinValueUpgrade.level;
    document.getElementById('coinCost').textContent = game.shop.coinValueUpgrade.cost;
    document.getElementById('pigLevel').textContent = game.shop.pigSizeUpgrade.level;
    document.getElementById('pigCost').textContent = game.shop.pigSizeUpgrade.cost;
    document.getElementById('luckLevel').textContent = game.shop.luckUpgrade.level;
    document.getElementById('luckCost').textContent = game.shop.luckUpgrade.cost;
}

function loop() {
    if (game.over == false) {
        game.resetCanvas();
        game.drawScore();
        snake.move();
        food.draw();
        snake.draw();
        game.drawMessage();
    }
    setTimeout(function() {
        requestAnimationFrame(loop);
    }, 1000 / game.fps);
}

requestAnimationFrame(loop);
