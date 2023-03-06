var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

const birdImg = new Image();
birdImg.src = "assets/bird.png";

var pipes = [];
var bird = {
    x: 100,
    y: canvas.height/2,
    vx: 0,
    vy: 0,
    radius: 10,
};
var g = 5;

spacePressed = false;
spaceWasReleased = true;
gameOver = false;
skip = false;
moveMade = false;

const pipeGap = 150;
const pipeWidth = 75
const ai = false;

var reward = 0;

var score = 0;
var numGames = 0;
var k = 0;
var c = 0;

function gameLoop() {
    if (ai && !skip) {
        if (!moveMade) make_move();
        else ai_train();
    }
    else if (ai && gameOver) {
        ai_train();
    } 
    else {

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.fillStyle = "aqua";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        reward = 0;
        if (!gameOver) {
            if (k % 120 == 0) {
                pipes.push(generatePipe(75));
            }
        }
        if (!gameOver) updatePipes();
        if (!gameOver) updateBird();
        if (!gameOver) colision();
        if (!gameOver || reward == -1000) {
            // console.log(evaluate_state(), reward);
        }
        drawPipes();
        drawBird();
        ctx.closePath();
        ctx.fillStyle = "black";
        ctx.font = "16px Arial";
        ctx.fillText("Score: " + score + " , N: " + numGames, 10, 20);
        if (gameOver) {
            ctx.fillText("Game Over!", canvas.width/2 - 40, canvas.height/2);
        }
        if (!gameOver) k++;
        requestAnimationFrame(gameLoop);
    }
}
gameLoop();

function colision() {
    for (var i = 0; i < pipes.length; i++) {
        if (bird.y - bird.radius <= pipes[i][1] && bird.x + bird.radius >= pipes[i][0] && bird.x - bird.radius <= pipes[i][0] + pipeWidth) {
            gameOver = true;
            reward = -1000;
        }
        else if (bird.y + bird.radius >= pipes[i][1] + pipeGap && bird.x + bird.radius >= pipes[i][0] && bird.x - bird.radius <= pipes[i][0] + pipeWidth) {
            gameOver = true;
            reward = -1000;
        }
    }
}

function drawBird() {
    // ctx.arc(bird.x, bird.y, bird.radius, 0, 2 * Math.PI, false);
    // ctx.fillStyle = "yellow";
    // ctx.fill();
    ctx.drawImage(birdImg, bird.x - 25, bird.y - 25, 50, 50);
}

function updateBird() {
    if (bird.y + bird.radius < canvas.height && bird.y - bird.radius > 0) {
        if (spacePressed) {
            bird.vy = -75;
            spacePressed = false;
        } else {
            bird.vy += g;
        }
        bird.y += bird.vy/10
    } else {
        bird.y = (bird.y + bird.radius >= canvas.height ? canvas.height - bird.radius : bird.radius);
        gameOver = true;
        reward = -1000;
    }
    for (var i = 0; i < pipes.length; i++) {
        if (bird.y - bird.radius > pipes[i][1] && bird.y + bird.radius < pipes[i][1] + pipeGap) {
            if (!pipes[i][2]) {
                break;
            } 
        } else {
            if (!pipes[i][2]) {
                break;
            }
        }
    }
    if (bird.vy >= 0) {
        skip = false;
    } 
}

function generatePipe(height) {
    return [canvas.width, randomIntFromInterval(0 + height, canvas.height - height - 100), false];
}

function drawPipes() {
    ctx.fillStyle = "green";
    for (var i = 0; i < pipes.length; i++) {
        ctx.fillRect(pipes[i][0], -1000, pipeWidth, pipes[i][1] + 1000);
        ctx.fillRect(pipes[i][0], pipes[i][1] + pipeGap, pipeWidth, canvas.height - (pipes[i][1] + pipeGap));
    }
}

function updatePipes() {
    if (pipes.length > 0) {
        if (pipes[0][0] <= -pipeWidth) {
            pipes.shift()
        }
        for (var i = 0; i < pipes.length; i++) {
            pipes[i][0] -= 2;
            if (bird.x - bird.radius > pipes[i][0] + pipeWidth && !pipes[i][2]) {
                pipes[i][2] = true;
                score++;
                break;
            }
        }
    }
}

function randomIntFromInterval(n, m) {
    return Math.floor(Math.random() * (m - n + 1) + n);
}

function reset() {
    pipes = [];
    bird.x = 100;
    bird.y = canvas.height/2;
    bird.vx = 0;
    bird.vy = 0;
    bird.radius = 10;
    spacePressed = false;
    spaceWasReleased = true;
    k = 0;
    score = 0;
    numGames++;
    skip = false;
    moveMade = false;
}

function evaluate_state() {
    for (var i = 0; i < pipes.length; i++) {
        if (!pipes[i][2]) {
            return [((pipes[i][1] + pipeGap) - (bird.y + bird.radius)) / pipeGap, ((pipes[i][0] + pipeWidth) - (bird.x + bird.radius)) / ((canvas.width + pipeWidth) - (bird.x + bird.radius))];
        }
    }
    return [canvas.width - bird.x, 0];
}

function ai_play() {
    state = evaluate_state();

    $.ajax({
        type: "POST",
        url: "http://127.0.0.1:8000/play",  
        data: JSON.stringify({reward: reward, score: snakeLenght - 1, state: state, done: gameOver}),
        contentType: "application/json",
    }).done(function( o ) {

    });

}

function ai_train() {
    state = evaluate_state();
    $.ajax({
        type: "POST",
        url: "http://127.0.0.1:8000/train",  
        data: JSON.stringify({reward: reward, score: k, state: state, done: gameOver}),
        contentType: "application/json",
    }).done(function( o ) {
        moveMade = false;
        if (gameOver) {
            reset();
        }
        requestAnimationFrame(gameLoop);  
    });
}

function make_move() {
    if (gameOver) {
        reset();
        gameOver = false;
    }
    if (!gameOver) {
        if (k % 120 == 0) {
            pipes.push(generatePipe(75));
        }
    }
    reward = 0;
    state = evaluate_state();
    $.ajax({
        type: "POST",
        url: "http://127.0.0.1:8000/make_move",  
        data: JSON.stringify({reward: reward, score: k, state: state, done: gameOver}),
        contentType: "application/json",
    }).done(function( o ) {
        spacePressed = (o.move == 1 ? true : false)
        skip = true;
        if (!gameOver) updatePipes();
        if (!gameOver) updateBird();
        if (!gameOver) colision();
        // if (!gameOver || reward == -1000) console.log(evaluate_state(), reward);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.fillStyle = "aqua";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawPipes();
        drawBird();
        ctx.closePath();
        ctx.fillStyle = "black";
        ctx.font = "16px Arial";
        ctx.fillText("Score: " + score + " , N: " + numGames, 10, 20);
        if (gameOver) {
            ctx.fillText("Game Over!", canvas.width/2 - 40, canvas.height/2);
        }
        if (!gameOver) k++;
        moveMade = true;
        requestAnimationFrame(gameLoop);
    });
}

document.addEventListener('keydown', function(event) {
    if(event.keyCode == 87) {
        if (gameOver) {
            gameOver = false;
            reset();
        } else if (spaceWasReleased && !skip) {
            spacePressed = true;
            spaceWasReleased = false;
            skip = true;
        }
    }
});

document.addEventListener('keyup', function(event) {
    if(event.keyCode == 87) {
        spaceWasReleased = true;
    }
});