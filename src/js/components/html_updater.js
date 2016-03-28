'use strict'

let squareContainer    = document.querySelector('.square-container')
let scoreContainer   = document.querySelector('.score-container')
let bestContainer    = document.querySelector('.best-container')
let messageContainer = document.querySelector('.game-message')

let score = 0

function clearContainer(container) {
    while (container.firstChild) {
        container.removeChild(container.firstChild)
    }
}

function addSquare(square) {
    let wrapper   = document.createElement('div')
    let inner     = document.createElement('div')
    let position  = square.previousPosition || { x: square.x, y: square.y }
    let positionClassResult = positionClass(position)

    // We can't use classlist because it somehow glitches when replacing classes
    let classes = ['square', 'square-' + square.value, positionClassResult]

    if (square.value > 2048) classes.push('square-super')

    applyClasses(wrapper, classes)

    inner.classList.add('square-inner')
    inner.textContent = square.value

    if (square.previousPosition) {
        // Make sure that the square gets rendered in the previous position first
        window.requestAnimationFrame( () => {
            classes[2] = positionClass({ x: square.x, y: square.y })
            applyClasses(wrapper, classes) // Update the position
        })
    } else if (square.mergedFrom) {
        classes.push('square-merged')
        applyClasses(wrapper, classes)

        // Render the squares that merged
        square.mergedFrom.forEach( (merged) => {
            addSquare(merged)
        })
    } else {
        classes.push('square-new')
        applyClasses(wrapper, classes)
    }

    // Add the inner part of the square to the wrapper
    wrapper.appendChild(inner)

    // Put the square on the board
    squareContainer.appendChild(wrapper)
}

function applyClasses(element, classes) {
    element.setAttribute('class', classes.join(' '))
}

function normalizePosition(position) {
    return { x: position.x + 1, y: position.y + 1 }
}

function positionClass(position) {
    position = normalizePosition(position)
    return 'square-position-' + position.x + '-' + position.y
}

function updateScore(newScore) {
    clearContainer(scoreContainer)

    let difference = newScore - score
    score = newScore

    scoreContainer.textContent = score

    if (difference > 0) {
        let addition = document.createElement('div')
        addition.classList.add('score-addition')
        addition.textContent = '+' + difference

        scoreContainer.appendChild(addition)
    }
}

function updateBestScore(bestScore) {
    let bestContainerTmp = bestContainer,
        oldBestScore = parseInt(bestContainerTmp.textContent)

    let difference = bestScore - oldBestScore

    bestContainerTmp.textContent = bestScore

    if (difference > 0) {
        let addition = document.createElement('div')
        addition.classList.add('score-addition')
        addition.textContent = '+' + difference

        bestContainerTmp.appendChild(addition)
    }
}

function message(won) {
    let type    = won ? 'game-won' : 'game-over'
    let message = won ? 'You win!' : 'Game over!'

    messageContainer.classList.add(type)
    messageContainer.getElementsByTagName('p')[0].textContent = message
}

function clearMessage() {
    // IE only takes one value to remove at a time.
    messageContainer.classList.remove('game-won')
    messageContainer.classList.remove('game-over')
}

function update(grid, metadata) {
    window.requestAnimationFrame( () => {
        clearContainer(squareContainer)

        grid.cells.forEach( (column) => {
            column.forEach( (cell) => {
                if (cell) {
                    addSquare(cell)
                }
            })
        })

        updateScore(metadata.score)
        updateBestScore(metadata.bestScore)

        if (metadata.terminated) {
            if (metadata.over) {
                message(false) // You lose
            } else if (metadata.won) {
                message(true) // You win!
            }
        }

    })
}

function continueGame() {
    clearMessage()
}

export default {update, continueGame}

