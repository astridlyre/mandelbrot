class PageState {
	static initialState() {
		let s = new PageState()
		s.cx = -0.5
		s.cy = 0
		s.perPixel = 3 / window.innerHeight
		s.maxIterations = 500
		return s
	}

	static fromURL(url) {
		let s = new PageState()
		let u = new URL(url)
		s.cx = parseFloat(u.searchParams.get('cx'))
		s.cy = parseFloat(u.searchParams.get('cy'))
		s.perPixel = parseFloat(u.searchParams.get('pp'))
		s.maxIterations = parseInt(u.searchParams.get('it'))

		return isNaN(s.cx) ||
			isNaN(s.cy) ||
			isNaN(s.perPixel) ||
			isNaN(s.maxIterations)
			? null
			: s
	}

	toURL() {
		let u = new URL(window.location)
		u.searchParams.set('cx', this.cx)
		u.searchParams.set('cy', this.cy)
		u.searchParams.set('pp', this.perPixel)
		u.searchParams.get('it', this.maxIterations)
		return u.href
	}
}

export default PageState
