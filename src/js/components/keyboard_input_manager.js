'use strict'

export default (function () {
    // 依赖及私有属性
    var events = {},

    // 私有方法
        emit = function (event, data) {
            var callbacks = events[event];
            if (callbacks) {
                callbacks.forEach(function (callback) {
                    callback(data);
                });
            }
        },

        listen = function () {
            var map = {
                38: 0, // Up
                39: 1, // Right
                40: 2, // Down
                37: 3, // Left
            };

            // 响应按下方向键
            document.addEventListener('keydown', function (event) {

                var modifiers = event.altKey || event.ctrlKey || event.metaKey ||
                                                event.shiftKey;
                var mapped    = map[event.which];

                if (!modifiers) {
                    if (mapped !== undefined) {
                        event.preventDefault();
                        emit('move', mapped);
                    }
                }

                // R键 -> 重新开始游戏
                if (!modifiers && event.which === 82) {
                    restart(event);
                }
            });

            // 响应按下按钮
            bindButtonPress('.retry-button', restart);
            bindButtonPress('.restart-button', restart);
            bindButtonPress('.rollback-button', rollback);
            bindButtonPress('.keep-playing-button', keepPlaying);
       },

        restart = function (event) {
            event.preventDefault();
            emit('restart');
        },

        rollback = function (event) {
            event.preventDefault();
            emit('rollback');
        },

        keepPlaying = function (event) {
            event.preventDefault();
            emit('keepPlaying');
        },

        bindButtonPress = function (selector, fn) {
            var button = document.querySelector(selector);
            button.addEventListener('click', fn);
        },

        on = function (event, callback) {
            if (!events[event]) {
                events[event] = [];
            }
            events[event].push(callback);
        }
    // var变量定义结束


    // 一次性初始化过程
    listen();

    // 公有API
    return {
        on: on
    };

}());
