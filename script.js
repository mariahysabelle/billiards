const canvas = document.getElementById("table");
const ctx = canvas.getContext("2d");

// --- Login ---
const loginScreen = document.getElementById("loginScreen");
const gameScreen = document.getElementById("gameScreen");
const usernameInput = document.getElementById("usernameInput");
const startBtn = document.getElementById("startBtn");
const scoreDisplay = document.getElementById("scoreDisplay");

const opponents = ["Alex", "Jordan", "Riley", "Taylor", "Casey", "Morgan", "Jamie", "Chris"];
let playerName = "";
let opponentName = "";

startBtn.addEventListener("click", ()=>{
    const name = usernameInput.value.trim();
    if(name === "") return alert("Enter username!");
    playerName = name;
    opponentName = opponents[Math.floor(Math.random()*opponents.length)];
    loginScreen.style.display = "none";
    gameScreen.style.display = "block";
    updateScore();
    startTurnTimer();
});

// --- Ball class ---
class Ball {
    constructor(x,y,radius,color,number=null){
        this.x=x; this.y=y; this.radius=radius; this.color=color; this.number=number;
        this.vx=0; this.vy=0; this.inPocket=false;
    }
    update(){
        if(this.inPocket) return;
        this.x+=this.vx; this.y+=this.vy;
        this.vx*=0.98; this.vy*=0.98;
        if(Math.abs(this.vx)<0.1)this.vx=0;
        if(Math.abs(this.vy)<0.1)this.vy=0;
        checkWallCollision(this);
        checkPockets(this);
    }
}

// --- Balls setup ---
const balls=[];
const cueBall = new Ball(100,200,12,"white");
balls.push(cueBall);

const colors=["yellow","blue","red","purple","orange","green","brown","black"];
for(let i=0;i<8;i++){
    let row=Math.floor(Math.sqrt(i));
    let col=i-(row*(row+1))/2;
    let x=500+col*25; let y=200+row*25 - row*12;
    balls.push(new Ball(x,y,12,colors[i],i+1));
}

// --- Pockets ---
const pockets=[
    {x:0,y:0},
    {x:canvas.width/2,y:0},
    {x:canvas.width,y:0},
    {x:0,y:canvas.height},
    {x:canvas.width/2,y:canvas.height},
    {x:canvas.width,y:canvas.height}
];

function drawPockets(){
    for(const p of pockets){
        ctx.beginPath();
        ctx.arc(p.x,p.y,15,0,Math.PI*2);
        ctx.fillStyle="black";
        ctx.fill();
        ctx.closePath();
    }
}

// --- Collision ---
function checkCollision(b1,b2){
    if(b1.inPocket||b2.inPocket) return;
    const dx=b2.x-b1.x, dy=b2.y-b1.y;
    const dist=Math.sqrt(dx*dx+dy*dy);
    if(dist<b1.radius+b2.radius){
        const angle=Math.atan2(dy,dx);
        const speed1=Math.sqrt(b1.vx**2+b1.vy**2);
        const speed2=Math.sqrt(b2.vx**2+b2.vy**2);
        const dir1=Math.atan2(b1.vy,b1.vx);
        const dir2=Math.atan2(b2.vy,b2.vx);

        const vx1=speed1*Math.cos(dir1-angle);
        const vy1=speed1*Math.sin(dir1-angle);
        const vx2=speed2*Math.cos(dir2-angle);
        const vy2=speed2*Math.sin(dir2-angle);

        const final_vx1=((b1.radius-b2.radius)*vx1+2*b2.radius*vx2)/(b1.radius+b2.radius);
        const final_vx2=((b2.radius-b1.radius)*vx2+2*b1.radius*vx1)/(b1.radius+b2.radius);

        b1.vx=Math.cos(angle)*final_vx1+Math.cos(angle+Math.PI/2)*vy1;
        b1.vy=Math.sin(angle)*final_vx1+Math.sin(angle+Math.PI/2)*vy1;
        b2.vx=Math.cos(angle)*final_vx2+Math.cos(angle+Math.PI/2)*vy2;
        b2.vy=Math.sin(angle)*final_vx2+Math.sin(angle+Math.PI/2)*vy2;
    }
}

function checkWallCollision(ball){
    if(ball.x-ball.radius<0||ball.x+ball.radius>canvas.width) ball.vx*=-1;
    if(ball.y-ball.radius<0||ball.y+ball.radius>canvas.height) ball.vy*=-1;
}

function checkPockets(ball){
    for(const p of pockets){
        const dx=ball.x-p.x, dy=ball.y-p.y;
        if(Math.sqrt(dx*dx+dy*dy)<15){
            if(ball.color!=="white" && !ball.inPocket){
                ball.inPocket=true;
                if(currentTurn===playerName) playerScore++;
                else opponentScore++;
                updateScore();
            } else if(ball.color==="white"){
                ball.inPocket=false;
                ball.x=100; ball.y=200;
                ball.vx=0; ball.vy=0;
            }
        }
    }
}

// --- Score ---
let playerScore=0, opponentScore=0;

function updateScore(){
    scoreDisplay.innerHTML =
    `${playerName}: ${playerScore} | ${opponentName}: ${opponentScore} | Timer: ${turnTime}s | Turn: ${currentTurn}`;
}

// --- Mouse controls ---
let isDragging=false, startX, startY, aimX=cueBall.x, aimY=cueBall.y;

canvas.addEventListener("mousedown",(e)=>{
    const rect=canvas.getBoundingClientRect();
    startX=e.clientX-rect.left;
    startY=e.clientY-rect.top;
    const dx=startX-cueBall.x, dy=startY-cueBall.y;
    if(Math.sqrt(dx*dx+dy*dy)<=cueBall.radius && currentTurn===playerName)
        isDragging=true;
});

canvas.addEventListener("mousemove",(e)=>{
    if(!isDragging) return;
    const rect=canvas.getBoundingClientRect();
    aimX=e.clientX-rect.left;
    aimY=e.clientY-rect.top;
});

canvas.addEventListener("mouseup",()=>{
    if(!isDragging || currentTurn!==playerName) return;

    const dx = aimX - cueBall.x;
    const dy = aimY - cueBall.y;
    const power = Math.min(Math.sqrt(dx*dx + dy*dy)/5, 15);
    const angle = Math.atan2(dy, dx);

    cueBall.vx = Math.cos(angle) * power;
    cueBall.vy = Math.sin(angle) * power;

    isDragging=false;
});

// --- Draw ---
function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    drawPockets();

    balls.forEach(b=>{
        if(b.inPocket) return;

        ctx.beginPath();
        ctx.arc(b.x,b.y,b.radius,0,Math.PI*2);

        ctx.fillStyle=b.color;
        ctx.fill();

        ctx.strokeStyle="white";
        ctx.stroke();
        ctx.closePath();
    });
}

// --- Turn Timer ---
let currentTurn = "";
let turnTime = 10;

function startTurnTimer(){
    currentTurn = playerName;

    setInterval(()=>{
        turnTime--;
        updateScore();

        if(turnTime<=0){
            currentTurn = currentTurn===playerName ? opponentName : playerName;
            turnTime=10;
        }
    },1000);
}

// --- Game end ---
function checkGameEnd(){
    const remaining = balls.filter(b => b.color !== "white" && !b.inPocket);
    if(remaining.length === 0){
        alert(`Game Over!\n${playerName}: ${playerScore}\n${opponentName}: ${opponentScore}`);
        location.reload();
    }
}

// --- Animate ---
function animate(){
    balls.forEach(b=>b.update());

    for(let i=0;i<balls.length;i++){
        for(let j=i+1;j<balls.length;j++){
            checkCollision(balls[i],balls[j]);
        }
    }

    draw();
    checkGameEnd();
    requestAnimationFrame(animate);
}

animate();