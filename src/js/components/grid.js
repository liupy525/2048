'use strict'

import Square from './square'

export default (function () {

    // 依赖及私有属性


    // 私有方法
        // 用size初始化cells
    var empty = function () {
            var cells = [];

            for (var x = 0; x < this.size; x++) {
                var row = cells[x] = [];

                for (var y = 0; y < this.size; y++) {
                    row.push(null);
                }
            }

            return cells;
        },

        // 根据localStorage中cells初始化cells
        fromState = function (state) {
            var cells = [];

            for (var x = 0; x < this.size; x++) {
                var row = cells[x] = [];

                for (var y = 0; y < this.size; y++) {
                    var square = state[x][y];
                    row.push(square ? new Square(square.position, square.value) : null);
                }
            }

            return cells;
        },

        availableCells = function () {
            var cells = [];

            this.eachCell(function (x, y, square) {
                if (!square) {
                    cells.push({ x: x, y: y });
                }
            });

            return cells;
        },

        cellOccupied = function (cell) {
            return !!this.cellContent(cell);
        };
    // var变量定义结束


    // 一次性初始化过程


    // 公有API
    return {
        size: undefined,
        cells: undefined,

        // 初始化size及cells
        init : function (size, previousState) {
            this.size = size;
            this.cells = previousState ? fromState.call(this, previousState) : empty.call(this);
        },

        // 随机寻找一个可用位置
        randomAvailableCell : function () {
            var cells = availableCells.call(this);

            if (cells.length) {
                return cells[Math.floor(Math.random() * cells.length)];
            }
        },

        // 对每个cell执行callback
        eachCell : function (callback) {
            for (var x = 0; x < this.size; x++) {
                for (var y = 0; y < this.size; y++) {
                    callback.call(this, x, y, this.cells[x][y]);
                }
            }
        },

        // 检查是否还有可用的cell
        cellsAvailable : function () {
            return !!availableCells.call(this).length;
        },

        // 检查该cell是否已经被占用
        cellAvailable : function (cell) {
            return !cellOccupied.call(this, cell);
        },

        cellContent : function (cell) {
            if (this.withinBounds(cell)) {
                return this.cells[cell.x][cell.y];
            } else {
                return null;
            }
        },
        // 添加一个square
        insertSquare : function (square) {
            this.cells[square.x][square.y] = square;
        },

        removeSquare : function (square) {
            this.cells[square.x][square.y] = null;
        },

        withinBounds : function (position) {
            return position.x >= 0 && position.x < this.size &&
                         position.y >= 0 && position.y < this.size;
        },

        serialize : function () {
            var cellState = [];

            for (var x = 0; x < this.size; x++) {
                var row = cellState[x] = [];

                for (var y = 0; y < this.size; y++) {
                    row.push(this.cells[x][y] ? this.cells[x][y].serialize() : null);
                }
            }

            return {
                size: this.size,
                cells: cellState
            };
        }
    };
}());
