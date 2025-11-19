// Thiết lập Canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const W = canvas.width;
const H = canvas.height;

// Hằng số game
const GRAVITY = 0.25;      // Lực hút
const JUMP_FORCE = -4.6;   // Lực nhảy
const PIPE_WIDTH = 52;     // Chiều rộng của ống
const PIPE_GAP = 90;       // Khoảng cách an toàn giữa hai ống
const PIPE_SPEED = 2;      // Tốc độ ống di chuyển

// Biến trạng thái
let storkY = H / 2; // Vị trí Y của con cò
let storkVelocity = 0; // Tốc độ rơi/nhảy
let score = 0;
let pipes = [];
let gameLoop;
let isGameOver = true;

// Tải hình ảnh Stork
const storkImg = new Image();
storkImg.src = 'stork.png'; // Đảm bảo tên file là stork.png
let isImageLoaded = false;
storkImg.onload = () => {
    isImageLoaded = true; // Đánh dấu là hình đã được tải xong
    console.log("Stork image loaded!");
};

// Vẫn giữ màu sắc cho ống
const pipeColor = '#739e44'; 
const groundColor = '#ded895'; 
// ...

const messageDiv = document.getElementById('start-message');
const scoreDiv = document.getElementById('score');

// --- Hàm Vẽ (DRAW FUNCTIONS) ---

function drawStork() {
    const STORK_WIDTH = 34; // Chiều rộng của ảnh stork.png
    const STORK_HEIGHT = 24; // Chiều cao của ảnh stork.png
    const StorkX = 50 - STORK_WIDTH / 2; // Căn giữa X

    if (isImageLoaded) {
        // Vẽ hình ảnh
        // drawImage(hình ảnh, vị trí X, vị trí Y, chiều rộng, chiều cao)
        ctx.drawImage(storkImg, 
                      StorkX, 
                      storkY - STORK_HEIGHT / 2, // Căn giữa Y
                      STORK_WIDTH, 
                      STORK_HEIGHT);
    } else {
        // Nếu ảnh chưa tải được, fallback vẽ hình tròn cũ
        ctx.fillStyle = '#e95420'; 
        ctx.beginPath();
        ctx.arc(50, storkY, 12, 0, Math.PI * 2); 
        ctx.fill();
        ctx.closePath();
    }
}
function drawPipes() {
    ctx.fillStyle = pipeColor;
    ctx.strokeStyle = '#000';
    
    for (let i = 0; i < pipes.length; i++) {
        const p = pipes[i];

        // Ống trên
        ctx.fillRect(p.x, 0, PIPE_WIDTH, p.yPos); 
        ctx.strokeRect(p.x, 0, PIPE_WIDTH, p.yPos);

        // Ống dưới
        ctx.fillRect(p.x, p.yPos + PIPE_GAP, PIPE_WIDTH, H - (p.yPos + PIPE_GAP));
        ctx.strokeRect(p.x, p.yPos + PIPE_GAP, PIPE_WIDTH, H - (p.yPos + PIPE_GAP));
    }
}

function drawGround() {
    ctx.fillStyle = groundColor;
    ctx.fillRect(0, H - 50, W, 50); // Vẽ nền đất ở 50px dưới cùng
    ctx.strokeStyle = '#000';
    ctx.strokeRect(0, H - 50, W, 50);
}

// --- Hàm Cập nhật (UPDATE LOGIC) ---

function update() {
    if (isGameOver) return; 

    // 1. Cập nhật vị trí Stork (rơi xuống)
    storkVelocity += GRAVITY;
    storkY += storkVelocity;

    // 2. Tạo ống mới
    if (pipes.length === 0 || pipes[pipes.length - 1].x < W - 180) {
        // Tạo chiều cao ngẫu nhiên cho ống trên
        const yPos = Math.floor(Math.random() * (H - 100 - PIPE_GAP - 50)) + 50; 
        pipes.push({ 
            x: W, 
            yPos: yPos, 
            passed: false 
        });
    }

    // 3. Cập nhật vị trí ống và kiểm tra điểm
    for (let i = 0; i < pipes.length; i++) {
        let p = pipes[i];
        p.x -= PIPE_SPEED; // Ống di chuyển

        // Kiểm tra điểm: Nếu cò bay qua ống (vị trí X của cò > vị trí X cuối của ống)
        if (!p.passed && p.x + PIPE_WIDTH < 50) { 
            score++;
            p.passed = true;
            scoreDiv.innerText = `Điểm: ${score}`;
        }
    }

    // 4. Xóa ống đã ra khỏi màn hình
    pipes = pipes.filter(p => p.x > -PIPE_WIDTH);

    // 5. Kiểm tra Va chạm (Collision)
    const storkR = 17; // Bán kính cò
    const storkX = 60; // Vị trí X cố định

    // Va chạm với đất
    if (storkY + storkR > H - 50) { 
        gameOver();
        return;
    } 
    // Giới hạn không bay lên khỏi màn hình
    else if (storkY < 0 + storkR) {
        storkY = storkR;
        storkVelocity = 0;
    }

    // Va chạm với ống
    for (let i = 0; i < pipes.length; i++) {
        const p = pipes[i];
        
        // Kiểm tra xem cò có đang nằm ngang hàng với ống không
        if (storkX + storkR > p.x && storkX - storkR < p.x + PIPE_WIDTH) {
            // Va chạm ống trên (Phần dưới của cò chạm vào ống trên)
            if (storkY - storkR < p.yPos) {
                gameOver();
                break;
            }
            // Va chạm ống dưới (Phần trên của cò chạm vào ống dưới)
            if (storkY + storkR > p.yPos + PIPE_GAP) {
                gameOver();
                break;
            }
        }
    }
}

// --- Hàm Điều khiển Game ---

// Vòng lặp chính của trò chơi
function gameLoopFunction() {
    ctx.clearRect(0, 0, W, H); // Xóa màn hình
    
    update(); // Cập nhật vị trí và luật chơi
    
    drawPipes();
    drawGround();
    drawStork(); // Vẽ lại mọi thứ
    
    // Yêu cầu vẽ lại cho khung hình tiếp theo
    gameLoop = requestAnimationFrame(gameLoopFunction);
}

// Hàm nhảy (khi click hoặc nhấn phím)
function jump(event) {
    if (!isGameOver) {
        storkVelocity = JUMP_FORCE; // Áp dụng lực nhảy
    } else {
        startGame();
    }
}

// Bắt đầu trò chơi
function startGame() {
    if (!isGameOver) return;
    
    // Đặt lại trạng thái
    storkY = H / 2;
    storkVelocity = 0;
    score = 0;
    pipes = [];
    isGameOver = false;
    
    scoreDiv.innerText = 'Điểm: 0';
    messageDiv.style.display = 'none'; // Ẩn thông báo bắt đầu
    
    // Bắt đầu vòng lặp game
    gameLoop = requestAnimationFrame(gameLoopFunction);
}

// Kết thúc trò chơi
function gameOver() {
    isGameOver = true;
    cancelAnimationFrame(gameLoop); // Dừng vòng lặp
    messageDiv.innerHTML = `GAME OVER! Điểm: ${score}.<br>Nhấn Phím Space hoặc Click để chơi lại!`;
    messageDiv.style.display = 'block';
}

// Thiết lập Điều khiển (Nghe sự kiện từ bàn phím và chuột)
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') { // Khi nhấn phím Space
        jump(e);
    }
});
canvas.addEventListener('click', jump); // Khi Click chuột vào khu vực game

// Hiển thị trạng thái ban đầu khi tải trang
drawStork();
drawGround();