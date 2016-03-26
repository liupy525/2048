'use strict'

import inputManager  from './keyboard_input_manager'
import storageManager from './local_storage_manager'
import htmlUpdater from './html_updater'
import Square from './square'
import grid from './grid'

export default (function () {

    // 依赖及私有属性


    var size           = 4, // grid.size
        startSquares     = 2,
        score,
        over,
        won,

    // 私有方法
        // 重新开始游戏
        restart = function () {
            storageManager.clearGameState();
            htmlUpdater.continueGame(); // 清除"你赢了/你输了"的提示
            setup();
        },
        // 达到2048（赢了）以后继续玩
        keepPlaying = function () {
            keepPlaying = true;
            htmlUpdater.continueGame(); // Clear the game won/lost message
        },
        // 输了或赢了但没继续时返回true
        isGameTerminated = function () {
            return over || (won && !keepPlaying);
        },
        // 初始化游戏
        setup = function () {
            var previousState = storageManager.getGameState();

            // 如果有存档，从localStorage中读取进度，如果没有则初始化
            if (previousState) {
                grid.init(previousState.grid.size, previousState.grid.cells);
                score       = previousState.score;
                over        = previousState.over;
                won         = previousState.won;
                keepPlaying = previousState.keepPlaying;
            } else {
                grid.init(size);
                score       = 0;
                over        = false;
                won         = false;
                keepPlaying = false;

                // 添加初始的格子
                addStartSquares();
            }

            // 更新界面
            update();
        },
        rollbackLastStep = function () {
            if (storageManager.rollbackGameState()) {
                setup();
            }
        },
        // 添加初始的格子
        addStartSquares = function () {
            for (var i = 0; i < startSquares; i++) {
                addRandomSquare();
            }
        },
        // 在随机的位置添加一个格子
        addRandomSquare = function () {
            if (grid.cellsAvailable()) {
                var value = Math.random() < 0.9 ? 2 : 4;
                var square = new Square(grid.randomAvailableCell(), value);

                grid.insertSquare(square);
            }
        },
        // 更新界面
        update = function () {
            if (storageManager.getBestScore() < score) {
                storageManager.setBestScore(score);
            }

            // Clear the state when the game is over (game over only, not win)
            if (over) {
                storageManager.clearGameState();
            } else {
                storageManager.setGameState(serialize());
            }

            htmlUpdater.update(grid, {
                score:      score,
                over:       over,
                won:        won,
                bestScore:  storageManager.getBestScore(),
                terminated: isGameTerminated()
            });
        },
        // 序列化，方便储存在localStorage中
        serialize = function () {
            return {
                grid:        grid.serialize(),
                score:       score,
                over:        over,
                won:         won,
                keepPlaying: keepPlaying
            };
        },
        // 更新每个格子的位置及合并信息
        prepareSquares = function () {
            grid.eachCell(function (x, y, square) {
                if (square) {
                    square.mergedFrom = null;
                    square.savePosition();
                }
            });
        },
        // 将square移动到cell的位置
        moveSquare = function (square, cell) {
            grid.cells[square.x][square.y] = null;
            grid.cells[cell.x][cell.y] = square;
            square.updatePosition(cell);
        },
        // 将所有的格子向指定方向移动
        move = function (direction) {
            // 0: up, 1: right, 2: down, 3: left
            if (isGameTerminated()) return; // Don't do anything if the game's over

            var cell, square;

            var vector     = getVector(direction);
            var traversals = buildTraversals(vector);
            var moved      = false;

            // Save the current square positions and remove merger information
            prepareSquares();

            // Traverse the grid in the right direction and move squares
            traversals.x.forEach(function (x) {
                traversals.y.forEach(function (y) {
                    cell = { x: x, y: y };
                    square = grid.cellContent(cell);

                    if (square) {
                        var positions = findFarthestPosition(cell, vector);
                        var next      = grid.cellContent(positions.next);

                        // Only one merger per row traversal?
                        if (next && next.value === square.value && !next.mergedFrom) {
                            var merged = new Square(positions.next, square.value * 2);
                            merged.mergedFrom = [square, next];

                            grid.insertSquare(merged);
                            grid.removeSquare(square);

                            // Converge the two squares' positions
                            square.updatePosition(positions.next);

                            // Update the score
                            score += merged.value;

                            // The mighty 2048 square
                            if (merged.value === 2048) won = true;
                        } else {
                            moveSquare(square, positions.farthest);
                        }

                        if (!positionsEqual(cell, square)) {
                            moved = true; // The square moved from its original cell!
                        }
                    }
                });
            });

            if (moved) {
                addRandomSquare();

                if (!movesAvailable()) {
                    over = true; // Game over!
                }

                update();
            }
        },
        // 计算移动方向对应的坐标变化矩阵
        getVector = function (direction) {
            var map = {
                0: { x: 0,  y: -1 }, // Up
                1: { x: 1,  y: 0 },  // Right
                2: { x: 0,  y: 1 },  // Down
                3: { x: -1, y: 0 }   // Left
            };

            return map[direction];
        },
        // 按照方向计算squares移动顺序
        buildTraversals = function (vector) {
            var traversals = { x: [], y: [] };

            for (var pos = 0; pos < size; pos++) {
                traversals.x.push(pos);
                traversals.y.push(pos);
            }

            // Always traverse from the farthest cell in the chosen direction
            if (vector.x === 1) traversals.x = traversals.x.reverse();
            if (vector.y === 1) traversals.y = traversals.y.reverse();

            return traversals;
        },
        findFarthestPosition = function (cell, vector) {
            var previous;

            // Progress towards the vector direction until an obstacle is found
            do {
                previous = cell;
                cell     = { x: previous.x + vector.x, y: previous.y + vector.y };
            } while (grid.withinBounds(cell) &&
                             grid.cellAvailable(cell));

            return {
                farthest: previous,
                next: cell // Used to check if a merge is required
            };
        },
        movesAvailable = function () {
            return grid.cellsAvailable() || squareMatchesAvailable();
        },
        // 检查是否有相邻的squares可以合并
        squareMatchesAvailable = function () {
            var square;

            for (var x = 0; x < size; x++) {
                for (var y = 0; y < size; y++) {
                    square = grid.cellContent({ x: x, y: y });

                    if (square) {
                        for (var direction = 0; direction < 4; direction++) {
                            var vector = getVector(direction);
                            var cell   = { x: x + vector.x, y: y + vector.y };

                            var other  = grid.cellContent(cell);

                            if (other && other.value === square.value) {
                                return true; // These two squares can be merged
                            }
                        }
                    }
                }
            }

            return false;
        },
        positionsEqual = function (first, second) {
            return first.x === second.x && first.y === second.y;
        };
    // var变量定义结束


    // 一次性初始化过程
    inputManager.on('move', move.bind(this));
    inputManager.on('restart', restart.bind(this));
    inputManager.on('keepPlaying', keepPlaying.bind(this));
    inputManager.on('rollback', rollbackLastStep.bind(this));
    setup();

    // 公有API
    return {

    }
}());
