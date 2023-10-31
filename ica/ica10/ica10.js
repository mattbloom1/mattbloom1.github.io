const btn = document.querySelector('button');
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

let WIDTH = document.documentElement.clientWidth;
let HEIGHT = document.documentElement.clientHeight;

canvas.width = WIDTH;
canvas.height = HEIGHT;

let circles = [];

function random(number) {
  return Math.floor(Math.random() * number);
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  for (let i = 0; i < circles.length; i++) {
    const circle = circles[i];
    if (!circle.clicked) {
      ctx.beginPath();
      const bubbleImg = document.getElementById('bubbleImg');
      ctx.drawImage(bubbleImg, circle.x, circle.y, circle.radius, circle.radius);      
      ctx.fill();
    }
  }
}

canvas.addEventListener('click', (e) => {
  const x = e.clientX - canvas.getBoundingClientRect().left;
  const y = e.clientY - canvas.getBoundingClientRect().top;
  for (let i = 0; i < circles.length; i++) {
    const circle = circles[i];
    const dx = x - circle.x;
    const dy = y - circle.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance <= circle.radius) {
      circle.clicked = true;
    }
  }
  draw();
});

btn.addEventListener('click', () => {
  circles = [];
  for (let i = 0; i < 100; i++) {
    circles.push({
      x: random(WIDTH),
      y: random(HEIGHT),
      radius: random(50),
      clicked: false,
    });
  }
  draw();
});