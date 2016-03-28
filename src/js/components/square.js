'use strict'

export default class {

    constructor(position, value) {
        this.x                = position.x
        this.y                = position.y
        this.value            = value || 2
        this.previousPosition = null // 记录之前的位置
        this.mergedFrom       = null // squares
    }

    updatePosition(position) {
        this.x = position.x
        this.y = position.y
    }

    savePosition() {
        this.previousPosition = { x: this.x, y: this.y }
    }

    serialize() {
        return {
            position: {
                x: this.x,
                y: this.y
            },
            value: this.value
        }
    }
}
