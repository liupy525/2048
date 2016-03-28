'use strict'

import html2canvas from '../lib/html2canvas'

let events = {}

function emit(event, data) {
    let callbacks = events[event]
    if (callbacks) {
        callbacks.forEach( callback => callback(data) )
    }
}

function listen() {
    let map = {
        38: 0, // Up
        39: 1, // Right
        40: 2, // Down
        37: 3, // Left
    }

    // 响应按下方向键
    document.addEventListener('keydown', function (event) {

        let modifiers = event.altKey || event.ctrlKey || event.metaKey ||
                                        event.shiftKey
        let mapped    = map[event.which]

        if (!modifiers) {
            if (mapped !== undefined) {
                event.preventDefault()
                emit('move', mapped)
            }
        }

        // R键 -> 重新开始游戏
        if (!modifiers && event.which === 82) {
            restart(event)
        }
    })

    // 响应按下按钮
    bindButtonPress('.retry-button', restart)
    bindButtonPress('.restart-button', restart)
    bindButtonPress('.rollback-button', rollback)
    bindButtonPress('.keep-playing-button', keepPlaying)
    bindButtonPress('.camera-button', takePhoto)
}

function restart(event) {
    event.preventDefault()
    emit('restart')
}

function rollback(event) {
    event.preventDefault()
    emit('rollback')
}

function takePhoto(event) {
    event.preventDefault()
    html2canvas(document.getElementsByClassName('.container')[0])
        .then( (canvas) => {

            let imgData = canvas.toDataURL('image/png')
            let type = 'png'
            let filename = 'image' + (new Date()).getTime() + '.' + type
            let link = document.createElement('a')

            link.href = imgData
            link.download = filename

            let event = document.createEvent('MouseEvents')
            event.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
            link.dispatchEvent(event)

    })

}

function keepPlaying(event) {
    event.preventDefault()
    emit('keepPlaying')
}

function bindButtonPress(selector, fn) {
    let button = document.querySelector(selector)
    button.addEventListener('click', fn)
}

function on(event, callback) {
    if (!events[event]) {
        events[event] = []
    }
    events[event].push(callback)
}

listen()

export default {on}
