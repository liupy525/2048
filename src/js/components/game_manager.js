'use strict'

import inputManager  from './keyboard_input_manager'
import storageManager from './local_storage_manager'
import htmlUpdater from './html_updater'
import Square from './square'
import * as grid from './grid'


const size         = 4 // grid.size
const startSquares = 2

let score
let over
let won
let keepPlayingFlag

// 重新开始游戏
function restart() {
    storageManager.clearGameState()
    htmlUpdater.continueGame() // 清除"你赢了/你输了"的提示
    setup()
}
// 达到2048（赢了）以后继续玩
function keepPlaying() {
    keepPlayingFlag = true
    htmlUpdater.continueGame() // Clear the game won/lost message
}
// 输了或赢了但没继续时返回true
function isGameTerminated() {
    return over || (won && !keepPlayingFlag)
}
// 初始化游戏
function setup() {
    let previousState = storageManager.getGameState()

    // 如果有存档，从localStorage中读取进度，如果没有则初始化
    if (previousState) {
        grid.init(previousState.grid.size, previousState.grid.cells)
        score       = previousState.score
        over        = previousState.over
        won         = previousState.won
        keepPlayingFlag = previousState.keepPlayingFlag
    } else {
        grid.init(size)
        score       = 0
        over        = false
        won         = false
        keepPlayingFlag = false

        // 添加初始的格子
        addStartSquares()
    }

    // 更新界面
    update()
}
function rollbackLastStep() {
    if (storageManager.rollbackGameState()) {
        setup()
    }
}
// 添加初始的格子
function addStartSquares() {
    for (let i = 0; i < startSquares; i++) {
        addRandomSquare()
    }
}
// 在随机的位置添加一个格子
function addRandomSquare() {
    if (grid.cellsAvailable()) {
        let value = Math.random() < 0.9 ? 2 : 4
        let square = new Square(grid.randomAvailableCell(), value)

        grid.insertSquare(square)
    }
}
// 更新界面
function update() {
    if (storageManager.getBestScore() < score) {
        storageManager.setBestScore(score)
    }

    // Clear the state when the game is over (game over only, not win)
    if (over) {
        storageManager.clearGameState()
    } else {
        storageManager.setGameState(serialize())
    }

    htmlUpdater.update(grid, {
        score:      score,
        over:       over,
        won:        won,
        bestScore:  storageManager.getBestScore(),
        terminated: isGameTerminated()
    })
}
// 序列化，方便储存在localStorage中
function serialize() {
    return {
        grid:        grid.serialize(),
        score:       score,
        over:        over,
        won:         won,
        keepPlayingFlag: keepPlayingFlag
    }
}
// 更新每个格子的位置及合并信息
function prepareSquares() {
    grid.eachCell( (x, y, square) => {
        if (square) {
            square.mergedFrom = null
            square.savePosition()
        }
    })
}
// 将square移动到cell的位置
function moveSquare(square, cell) {
    grid.cells[square.x][square.y] = null
    grid.cells[cell.x][cell.y] = square
    square.updatePosition(cell)
}
// 将所有的格子向指定方向移动
function move(direction) {
    // 0: up, 1: right, 2: down, 3: left
    if (isGameTerminated()) return // Don't do anything if the game's over

    let cell, square

    let vector     = getVector(direction)
    let traversals = buildTraversals(vector)
    let moved      = false

    // Save the current square positions and remove merger information
    prepareSquares()

    // Traverse the grid in the right direction and move squares
    traversals.x.forEach( (x) => {
        traversals.y.forEach( (y) => {
            cell = { x: x, y: y }
            square = grid.cellContent(cell)

            if (square) {
                let positions = findFarthestPosition(cell, vector)
                let next      = grid.cellContent(positions.next)

                // Only one merger per row traversal?
                if (next && next.value === square.value && !next.mergedFrom) {
                    let merged = new Square(positions.next, square.value * 2)
                    merged.mergedFrom = [square, next]

                    grid.insertSquare(merged)
                    grid.removeSquare(square)

                    // Converge the two squares' positions
                    square.updatePosition(positions.next)

                    // Update the score
                    score += merged.value

                    // The mighty 2048 square
                    if (merged.value === 2048) won = true
                } else {
                    moveSquare(square, positions.farthest)
                }

                if (!positionsEqual(cell, square)) {
                    moved = true // The square moved from its original cell!
                }
            }
        })
    })

    if (moved) {
        addRandomSquare()

        if (!movesAvailable()) {
            over = true // Game over!
        }

        update()
    }
}
// 计算移动方向对应的坐标变化矩阵
function getVector(direction) {
    let map = {
        0: { x: 0,  y: -1 }, // Up
        1: { x: 1,  y: 0 },  // Right
        2: { x: 0,  y: 1 },  // Down
        3: { x: -1, y: 0 },   // Left
    }

    return map[direction]
}
// 按照方向计算squares移动顺序
function buildTraversals(vector) {
    let traversals = { x: [], y: [] }

    for (let pos = 0; pos < size; pos++) {
        traversals.x.push(pos)
        traversals.y.push(pos)
    }

    // Always traverse from the farthest cell in the chosen direction
    if (vector.x === 1) traversals.x = traversals.x.reverse()
    if (vector.y === 1) traversals.y = traversals.y.reverse()

    return traversals
}
function findFarthestPosition(cell, vector) {
    let previous

    // Progress towards the vector direction until an obstacle is found
    do {
        previous = cell
        cell     = { x: previous.x + vector.x, y: previous.y + vector.y }
    } while (grid.withinBounds(cell) &&
                     grid.cellAvailable(cell))

    return {
        farthest: previous,
        next: cell // Used to check if a merge is required
    }
}
function movesAvailable() {
    return grid.cellsAvailable() || squareMatchesAvailable()
}
// 检查是否有相邻的squares可以合并
function squareMatchesAvailable() {
    let square

    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            square = grid.cellContent({ x, y })

            if (square) {
                for (let direction = 0; direction < 4; direction++) {
                    let vector = getVector(direction)
                    let cell   = { x: x + vector.x, y: y + vector.y }

                    let other  = grid.cellContent(cell)

                    if (other && other.value === square.value) {
                        return true // These two squares can be merged
                    }
                }
            }
        }
    }

    return false
}
function positionsEqual(first, second) {
    return first.x === second.x && first.y === second.y
}


inputManager.on('move', move.bind(this))
inputManager.on('restart', restart.bind(this))
inputManager.on('keepPlaying', keepPlaying.bind(this))
inputManager.on('rollback', rollbackLastStep.bind(this))

setup()
