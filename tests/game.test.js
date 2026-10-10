const { test } = require('node:test');
const assert = require('node:assert/strict');
const { SnakeGame } = require('../game.js');

test('starts ready, moves one cell and pauses without movement', () => {
  const game = new SnakeGame(20, () => 0);
  assert.equal(game.status, 'ready');
  game.step(); assert.deepEqual(game.snake[0], { x: 10, y: 10 });
  game.start(); game.step(); assert.deepEqual(game.snake[0], { x: 11, y: 10 });
  assert.equal(game.snake.length, 3);
  game.pause(); game.step(); assert.deepEqual(game.snake[0], { x: 11, y: 10 });
  game.start(); assert.equal(game.status, 'running');
});
test('rejects reversal and extra turns between ticks', () => {
  const game = new SnakeGame(); game.start();
  assert.equal(game.turn('left'), false);
  assert.equal(game.turn('up'), true);
  assert.equal(game.turn('left'), false);
  game.step(); assert.deepEqual(game.snake[0], { x: 10, y: 9 });
  assert.equal(game.turn('left'), true);
  game.step(); assert.deepEqual(game.snake[0], { x: 9, y: 9 });
});
test('eating grows the snake, adds points and spawns food outside the body', () => {
  const game = new SnakeGame(20, () => 0);
  game.food = { x: 11, y: 10 }; game.start(); game.step();
  assert.equal(game.score, 10); assert.equal(game.snake.length, 4);
  assert.ok(!game.snake.some(cell => cell.x === game.food.x && cell.y === game.food.y));
});
test('wall collision ends the round; reset restores the initial state', () => {
  const game = new SnakeGame(20, () => 0); game.start();
  for (let i = 0; i < 10; i++) game.step();
  assert.equal(game.status, 'gameover');
  assert.deepEqual(game.snake[0], { x: 19, y: 10 });
  game.reset(); assert.equal(game.status, 'ready'); assert.equal(game.score, 0); assert.equal(game.snake.length, 3);
});
test('moving into the body loses, while moving into a vacating tail is legal', () => {
  const game = new SnakeGame(20, () => 0);
  game.snake = [{ x: 2, y: 2 }, { x: 2, y: 3 }, { x: 3, y: 3 }, { x: 3, y: 2 }];
  game.start(); game.step(); assert.equal(game.status, 'running');
  assert.deepEqual(game.snake[0], { x: 3, y: 2 });
  game.snake = [{ x: 2, y: 2 }, { x: 2, y: 3 }, { x: 3, y: 3 }, { x: 3, y: 2 }, { x: 4, y: 2 }];
  game.step(); // Head currently points right, into the middle of the body.
  assert.equal(game.status, 'gameover');
});
test('filling the board wins without an infinite food-spawning loop', () => {
  const game = new SnakeGame(3, () => 0);
  game.snake = [{ x: 1, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 1, y: 2 }, { x: 0, y: 2 }];
  game.food = { x: 2, y: 0 }; game.start(); game.step();
  assert.equal(game.status, 'won'); assert.equal(game.food, null); assert.equal(game.snake.length, 9); assert.equal(game.score, 10);
});
