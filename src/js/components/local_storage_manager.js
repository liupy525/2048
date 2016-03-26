'use strict'

export default  (function () {

    // 依赖及私有属性
    var bestScoreKey = 'bestScore',
        lastBestScoreKey = 'lastBestScore',
        gameStateKey = 'gameState',
        lastGameStateKey = 'lastGameState',
        storage,

    // 私有方法
        getLocalStorage = function () {
            if (localStorageSupported()) {
                return window.localStorage;
            } else {
                return { // 不支持LocalStorage时，仿造一个
                    _data: {},

                    setItem: function (id, val) {
                        return this._data[id] = String(val);
                    },

                    getItem: function (id) {
                        return this._data.hasOwnProperty(id) ? this._data[id] : undefined;
                    },

                    removeItem: function (id) {
                        return delete this._data[id];
                    },

                    clear: function () {
                        return this._data = {};
                    }
                };
            }
        },

        localStorageSupported = function () {
            var testKey = 'test',
                storage = window.localStorage;

            try {
                storage.setItem(testKey, '1');
                storage.removeItem(testKey);
                return true;
            } catch (error) {
                return false;
            }
        },

        getBestScore = function () {
            return storage.getItem(bestScoreKey) || 0;
        },

        setBestScore = function (score) {
            var lastScore = storage.getItem(bestScoreKey);

            storage.setItem(bestScoreKey, score);
            storage.setItem(lastBestScoreKey, lastScore);
        },

        getGameState = function () {
            var stateJSON = storage.getItem(gameStateKey);
            return stateJSON ? JSON.parse(stateJSON) : null;
        },

        setGameState = function (gameState) {
            var lastState = storage.getItem(gameStateKey);

            storage.setItem(gameStateKey, JSON.stringify(gameState));
            storage.setItem(lastGameStateKey, lastState);
        },

        clearGameState = function () {
            storage.removeItem(gameStateKey);
        },

        rollbackGameState = function () {
            var prevState = storage.getItem(lastGameStateKey),
                prevScore = storage.getItem(lastBestScoreKey);
            if (!prevState) {
                return false;
            } else {
                storage.removeItem(lastGameStateKey);
                storage.removeItem(lastBestScoreKey);
                storage.setItem(gameStateKey, prevState);
                storage.setItem(bestScoreKey, prevScore);
                return true;
            }
        },
    // var变量定义结束


    // 一次性初始化过程
    storage = getLocalStorage();

    // 公有API
    return {
        getBestScore : getBestScore,
        setBestScore : setBestScore,
        getGameState : getGameState,
        setGameState : setGameState,
        clearGameState : clearGameState,
        rollbackGameState: rollbackGameState
    }
}());

