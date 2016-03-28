'use strict'

const bestScoreKey = 'bestScore'
const lastBestScoreKey = 'lastBestScore'
const gameStateKey = 'gameState'
const lastGameStateKey = 'lastGameState'

let storage = getLocalStorage()


function getLocalStorage() {
    if (localStorageSupported()) {
        return window.localStorage
    } else {
        return { // 不支持LocalStorage时，仿造一个
            _data: {},

            setItem(id, val) {
                return this._data[id] = String(val)
            },

            getItem(id) {
                return this._data.hasOwnProperty(id) ? this._data[id] : undefined
            },

            removeItem(id) {
                return delete this._data[id]
            },

            clear() {
                return this._data = {}
            }
        }
    }
}

function localStorageSupported() {
    let testKey = 'test',
        storage = window.localStorage

    try {
        storage.setItem(testKey, '1')
        storage.removeItem(testKey)
        return true
    } catch (error) {
        return false
    }
}

function getBestScore() {
    return storage.getItem(bestScoreKey) || 0
}

function setBestScore(score) {
    let lastScore = storage.getItem(bestScoreKey)

    storage.setItem(bestScoreKey, score)
    storage.setItem(lastBestScoreKey, lastScore)
}

function getGameState() {
    let stateJSON = storage.getItem(gameStateKey)
    return stateJSON ? JSON.parse(stateJSON) : null
}

function setGameState(gameState) {
    let lastState = storage.getItem(gameStateKey)

    storage.setItem(gameStateKey, JSON.stringify(gameState))
    storage.setItem(lastGameStateKey, lastState)
}

function clearGameState() {
    storage.removeItem(gameStateKey)
}

function rollbackGameState() {
    let prevState = storage.getItem(lastGameStateKey),
        prevScore = storage.getItem(lastBestScoreKey)
    if (!prevState) {
        return false
    } else {
        storage.removeItem(lastGameStateKey)
        storage.removeItem(lastBestScoreKey)
        storage.setItem(gameStateKey, prevState)
        storage.setItem(bestScoreKey, prevScore)
        return true
    }
}

export default { getBestScore, setBestScore, getGameState, setGameState, clearGameState, rollbackGameState }

