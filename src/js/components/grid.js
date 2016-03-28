'use strict'

import Square from './square'

const size = 4

let cells = []


// 用size初始化cells
function empty() {
    let cells = []

    for (let x = 0; x < size; x++) {
        let row = cells[x] = []

        for (let y = 0; y < size; y++) {
            row.push(null)
        }
    }

    return cells
}

// 根据localStorage中cells初始化cells
function fromState(state) {
    let cells = []

    for (let x = 0; x < size; x++) {
        let row = cells[x] = []

        for (let y = 0; y < size; y++) {
            let square = state[x][y]
            row.push(square ? new Square(square.position, square.value) : null)
        }
    }

    return cells
}

function availableCells() {
    let cells = []

    eachCell((x, y, square) => {
        if (!square) {
            cells.push({ x: x, y: y })
        }
    })

    return cells
}

function cellOccupied(cell) {
    return !!cellContent(cell)
}

// 初始化size及cells
function init(size, previousState) {
    cells = previousState ? fromState(previousState) : empty()
}

// 随机寻找一个可用位置
function randomAvailableCell() {
    let cells = availableCells()

    if (cells.length) {
        return cells[Math.floor(Math.random() * cells.length)]
    }
}

// 对每个cell执行callback
function eachCell(callback) {
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            callback(x, y, cells[x][y])
        }
    }
}

// 检查是否还有可用的cell
function cellsAvailable() {
    return !!availableCells().length
}

// 检查该cell是否已经被占用
function cellAvailable(cell) {
    return !cellOccupied(cell)
}

function cellContent(cell) {
    if (withinBounds(cell)) {
        return cells[cell.x][cell.y]
    } else {
        return null
    }
}

// 添加一个square
function insertSquare(square) {
    cells[square.x][square.y] = square
}

function removeSquare(square) {
    cells[square.x][square.y] = null
}

function withinBounds(position) {
    return position.x >= 0 && position.x < size &&
                 position.y >= 0 && position.y < size
}

function serialize() {
    let cellState = []

    for (let x = 0; x < size; x++) {
        let row = cellState[x] = []

        for (let y = 0; y < size; y++) {
            row.push(cells[x][y] ? cells[x][y].serialize() : null)
        }
    }

    return {
        cells: cellState
    }
}

export { cells, init, randomAvailableCell, eachCell, cellsAvailable, cellAvailable, cellContent, insertSquare, removeSquare, withinBounds, serialize }
