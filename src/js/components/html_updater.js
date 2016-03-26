'use strict'

export default (function () {

    // 依赖及私有属性
    var squareContainer    = document.querySelector('.square-container'),
        scoreContainer   = document.querySelector('.score-container'),
        bestContainer    = document.querySelector('.best-container'),
        messageContainer = document.querySelector('.game-message'),

        score = 0,

    // 私有方法
        clearContainer = function (container) {
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }
        },

        addSquare = function (square) {
            var wrapper   = document.createElement('div');
            var inner     = document.createElement('div');
            var position  = square.previousPosition || { x: square.x, y: square.y };
            var positionClassResult = positionClass(position);

            // We can't use classlist because it somehow glitches when replacing classes
            var classes = ['square', 'square-' + square.value, positionClassResult];

            if (square.value > 2048) classes.push('square-super');

            applyClasses(wrapper, classes);

            inner.classList.add('square-inner');
            inner.textContent = square.value;

            if (square.previousPosition) {
                // Make sure that the square gets rendered in the previous position first
                window.requestAnimationFrame(function () {
                    classes[2] = positionClass({ x: square.x, y: square.y });
                    applyClasses(wrapper, classes); // Update the position
                });
            } else if (square.mergedFrom) {
                classes.push('square-merged');
                applyClasses(wrapper, classes);

                // Render the squares that merged
                square.mergedFrom.forEach(function (merged) {
                    addSquare(merged);
                });
            } else {
                classes.push('square-new');
                applyClasses(wrapper, classes);
            }

            // Add the inner part of the square to the wrapper
            wrapper.appendChild(inner);

            // Put the square on the board
            squareContainer.appendChild(wrapper);
        },

        applyClasses = function (element, classes) {
            element.setAttribute('class', classes.join(' '));
        },

        normalizePosition = function (position) {
            return { x: position.x + 1, y: position.y + 1 };
        },

        positionClass = function (position) {
            position = normalizePosition(position);
            return 'square-position-' + position.x + '-' + position.y;
        },

        updateScore = function (newScore) {
            clearContainer(scoreContainer);

            var difference = newScore - score;
            score = newScore;

            scoreContainer.textContent = score;

            if (difference > 0) {
                var addition = document.createElement('div');
                addition.classList.add('score-addition');
                addition.textContent = '+' + difference;

                scoreContainer.appendChild(addition);
            }
        },

        updateBestScore = function (bestScore) {
            var bestContainerTmp = bestContainer,
                oldBestScore = parseInt(bestContainerTmp.textContent);

            var difference = bestScore - oldBestScore;

            bestContainerTmp.textContent = bestScore;

            if (difference > 0) {
                var addition = document.createElement('div');
                addition.classList.add('score-addition');
                addition.textContent = '+' + difference;

                bestContainerTmp.appendChild(addition);
            }

        },

        message = function (won) {
            var type    = won ? 'game-won' : 'game-over';
            var message = won ? 'You win!' : 'Game over!';

            messageContainer.classList.add(type);
            messageContainer.getElementsByTagName('p')[0].textContent = message;
        },

        clearMessage = function () {
            // IE only takes one value to remove at a time.
            messageContainer.classList.remove('game-won');
            messageContainer.classList.remove('game-over');
        };
    // var变量定义结束


    // 一次性初始化过程


    // 公有API
    return {
        update : function (grid, metadata) {
            window.requestAnimationFrame(function () {
                clearContainer(squareContainer);

                grid.cells.forEach(function (column) {
                    column.forEach(function (cell) {
                        if (cell) {
                            addSquare(cell);
                        }
                    });
                });

                updateScore(metadata.score);
                updateBestScore(metadata.bestScore);

                if (metadata.terminated) {
                    if (metadata.over) {
                        message(false); // You lose
                    } else if (metadata.won) {
                        message(true); // You win!
                    }
                }

            });
        },

        // Continues the game (both restart and keep playing)
        continueGame : function () {
            clearMessage();
        }
    }
}());
