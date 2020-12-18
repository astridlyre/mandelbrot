import WorkerPool from './WorkerPool.js'
import PageState from './PageState.js'
import Tile from './Tile.js'

class MandelbrotCanvas {
  constructor(canvas, rows, cols, numWorkers) {
    this._rows = rows
    this._cols = cols
    this.canvas = canvas
    this.context = canvas.getContext('2d')
    this.workerPool = new WorkerPool(numWorkers, "mandelbrotWorker.js")
    this.tiles = null
    this.pendingRender = null
    this.wantsRerender = false
    this.resizeTimer = null
    this.colorTable = null

    this.canvas.addEventListener('pointerdown', e => this.handlePointer(e))
    window.addEventListener('keydown', e => this.handleKey(e))
    window.addEventListener('resize', e => this.handleResize(e))
    window.addEventListener('popstate', e => this.setState(e.state, false))

    this.state = PageState.fromURL(window.location) || PageState.initialState()
    history.replaceState(this.state, '', this.state.toURL())
    this.setSize()
    this.render()
  }

  setSize() {
    this.width = this.canvas.width = window.innerWidth
    this.height = this.canvas.height = window.innerHeight
    this.tiles = [...Tile.tiles(this.width, this.height, this._rows, this._cols)]
  }

  setState(f, save=true) {
    if (typeof f === 'function') {
      f(this.state)
    } else {
      for (let prop in f) this.state[prop] = f[prop]
    }

    this.render()

    if (save) {
      history.pushState(this.state, '', this.state.toURL())
    }
  }

  render() {
    if (this.pendingRender) {
      this.wantsRerender = true
      return
    }

    let {cx, cy, perPixel, maxIterations} = this.state
    let x0 = cx - perPixel * this.width/2
    let y0 = cy - perPixel * this.height/2

    let promises = this.tiles.map(tile => this.workerPool.addWork({
      tile,
      x0: x0 + tile.x * perPixel,
      y0: y0 + tile.y * perPixel,
      perPixel,
      maxIterations
    }))

    this.pendingRender = Promise.all(promises).then(responses => {
      let min = maxIterations, max = 0
      for (let r of responses) {
        if (r.min < min) min = r.min
        if (r.max > max) max = r.max
      }

      if (!this.colorTable || this.colorTable.length !== maxIterations+1) {
        this.colorTable = new Uint32Array(maxIterations+1)
      }
      if (min === max) {
        if (min === maxIterations) {
          this.colorTable[min] = 0xFF000000
        } else {
          this.colorTable[min] = 0
        }
      } else {
        let maxlog = Math.log(1+max-min)
        for (let i = min; i<=max; i++) {
          this.colorTable[i] = (Math.ceil(Math.log(1+i-min)/maxlog * 255) << 24)
        }
      }

      for (let r of responses) {
        let iterations = new Uint32Array(r.imageData.data.buffer)
        for (let i = 0; i<iterations.length; i++) {
          iterations[i] = this.colorTable[iterations[i]]
        }
      }

      this.canvas.style.transform = ''
      for (let r of responses) {
        this.context.putImageData(r.imageData, r.tile.x, r.tile.y)
      }
    }).catch((reason) => console.error("Promise rejected in render()", reason)).finally(() => {
      this.pendingRender = null
      if (this.wantsRerender) {
        this.wantsRerender = false
        this.render()
      }
    })
  }

  handleResize(event) {
    if (this.resizeTimer) clearTimeout(this.resizeTimer)
    this.resizeTimer = setTimeout(() => {
      this.resizeTimer = null
      this.setSize()
      this.render()
    }, 200)
  }

  handleKey(event) {
    switch(event.key) {
      case 'Escape':
        this.setState(PageState.initialState())
        break
      case '+':
        this.setState(s => {
          s.maxIterations = Math.round(s.maxIterations*1.5)
        })
        break
      case '-':
        this.setState(s => {
          s.maxIterations = Math.round(s.maxIterations/1.5)
          if (s.maxIterations < 1) s.maxIterations = 1
        })
        break
      case 'o':
        this.setState(s => s.perPixel *= 2)
        break
      case 'ArrowUp':
        this.setState(s => s.cy -= this.height/10 * s.perPixel)
        break
      case 'ArrowDown':
        this.setState(s => s.cy += this.height/10 * s.perPixel)
        break
      case 'ArrowLeft':
        this.setState(s => s.cx -= this.width/10 * s.perPixel)
        break
      case 'ArrowRight':
        this.setState(s => s.cx += this.width/10 * s.perPixel)
        break
    }
  }

  handlePointer(event) {
    const x0 = event.clientX, y0 = event.clientY, t0 = Date.now()
    const pointerMoveHandler = event => {
      let dx = event.clientX-x0, dy = event.clientY-y0, dt = Date.now()-t0
      if (dx > 10 || dy > 10 || dt > 500) {
        this.canvas.style.transform = `translate(${dx}px, ${dy}px)`
      }
    }

    const pointerUpHandler = event => {
      this.canvas.removeEventListener('pointermove', pointerMoveHandler)
      this.canvas.removeEventListener('pointerup', pointerUpHandler)
      const dx = event.clientX-x0, dy = event.clientY-y0, dt=Date.now()-t0
      const {cx, cy, perPixel} = this.state
      // If the pointer moved far enough of if enough time passed, then
      // this was a pan gesture, otherwise it was zoom
      if (dx > 10 || dy > 10 || dt > 500) {
        this.setState({ cx: cx - dx*perPixel, cy: cy - dy * perPixel })
      } else {
        let cdx = x0 - this.width/2
        let cdy = y0 - this.height/2
        this.canvas.style.transform = `translate(${-cdx*2}px, ${-cdy*2}px) scale(2)`
        this.setState(s => {
          s.cx += cdx * s.perPixel
          s.cy += cdy * s.perPixel
          s.perPixel /= 2
        })
      }
    }

    this.canvas.addEventListener('pointermove', pointerMoveHandler)
    this.canvas.addEventListener('pointerup', pointerUpHandler)
  }
}

export default MandelbrotCanvas
