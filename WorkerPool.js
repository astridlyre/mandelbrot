class WorkerPool {
  constructor(numWorkers, workerSource) {
    this.idleWorkers = [] // Workers not currently working
    this.workQueue = [] // Work awaiting processing
    this.workerMap = new Map() // Map workers to funcs

    for (let i=0; i<numWorkers; i++) {
      let worker = new Worker(workerSource)
      worker.onmessage = message => void this._workerDone(worker, null, message.data)
      worker.onerror = error => void this._workerDone(worker, error, null)
      this.idleWorkers[i] = worker
    }
  }

  _workerDone(worker, error, response) {
    let [resolver, rejector] = this.workerMap.get(worker)
    this.workerMap.delete(worker)

    if (this.workQueue.length === 0) {
      this.idleWorkers.push(worker)
    } else {
      let [work, resolver, rejector] = this.workQueue.shift()
      this.workerMap.set(worker, [resolver, rejector])
      worker.postMessage(work)
    }

    error === null ? resolver(response) : rejector(error)
  }

  addWork(work) {
    return new Promise((resolve, reject) => {
      if (this.idleWorkers.length > 0) {
        let worker = this.idleWorkers.pop()
        this.workerMap.set(worker, [resolve, reject])
        worker.postMessage(work)
      } else {
        this.workQueue.push([work, resolve, reject])
      }
    })
  }
}

export default WorkerPool
