import MandelbrotCanvas from './MandelbrotCanvas.js'

const ROWS = 3,
	COLS = 4,
	NUMWORKERS = navigator.hardwareConcurrency || 2

let canvas = document.createElement('canvas')
document.body.appendChild(canvas)
document.body.style = 'margin:0'
canvas.style.width = '100vw'
canvas.style.height = '100vh'

new MandelbrotCanvas(canvas, ROWS, COLS, NUMWORKERS)
