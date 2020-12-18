import MandelbrotCanvas from './MandelbrotCanvas.js'

const ROWS = 3,
	COLS = 4,
	NUMWORKERS = navigator.hardwareConcurrency || 2

let canvas = document.createElement('canvas')
document.body.appendChild(canvas)
document.body.style = 'margin:0'
document.body.style = 'padding:0'
document.body.style = 'box-sizing: border-box'
canvas.style.width = '100vw'
canvas.style.height = '100vh'
canvas.style = 'margin:0'
canvas.style = 'padding:0'
canvas.style = 'box-sizing: border-box'

new MandelbrotCanvas(canvas, ROWS, COLS, NUMWORKERS)
