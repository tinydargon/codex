(function (root) {
  'use strict';
  const DIRECTIONS = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
  class SnakeGame {
    constructor(size = 20, random = Math.random) {
      this.size = size;
      this.random = random;
      this.reset();
    }
    reset() {
      const center = Math.floor(this.size / 2);
      this.snake = [{ x: center, y: center }, { x: center - 1, y: center }, { x: center - 2, y: center }];
      this.direction = 'right';
      this.nextDirection = 'right';
      this.turnQueued = false;
      this.score = 0;
      this.status = 'ready';
      this.placeFood();
    }
    start() { if (this.status === 'ready' || this.status === 'paused') this.status = 'running'; }
    pause() { if (this.status === 'running') this.status = 'paused'; }
    turn(direction) {
      if (this.status !== 'running' || this.turnQueued || !DIRECTIONS[direction]) return false;
      const current = DIRECTIONS[this.direction];
      const next = DIRECTIONS[direction];
      if (current.x + next.x === 0 && current.y + next.y === 0) return false;
      if (direction === this.direction) return false;
      this.nextDirection = direction;
      this.turnQueued = true;
      return true;
    }
    placeFood() {
      const occupied = new Set(this.snake.map(cell => cell.y * this.size + cell.x));
      const free = [];
      for (let y = 0; y < this.size; y++) for (let x = 0; x < this.size; x++) {
        if (!occupied.has(y * this.size + x)) free.push({ x, y });
      }
      this.food = free.length ? free[Math.floor(this.random() * free.length)] : null;
      if (!this.food) this.status = 'won';
    }
    step() {
      if (this.status !== 'running') return;
      this.direction = this.nextDirection;
      this.turnQueued = false;
      const vector = DIRECTIONS[this.direction];
      const head = { x: this.snake[0].x + vector.x, y: this.snake[0].y + vector.y };
      const eating = this.food && head.x === this.food.x && head.y === this.food.y;
      // The tail vacates its cell on a move without food.
      const body = eating ? this.snake : this.snake.slice(0, -1);
      if (head.x < 0 || head.y < 0 || head.x >= this.size || head.y >= this.size || body.some(cell => cell.x === head.x && cell.y === head.y)) {
        this.status = 'gameover';
        return;
      }
      this.snake.unshift(head);
      if (eating) { this.score += 10; this.placeFood(); }
      else this.snake.pop();
    }
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { SnakeGame };
  else root.SnakeGame = SnakeGame;
})(typeof window !== 'undefined' ? window : globalThis);
