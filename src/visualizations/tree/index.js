import * as d3 from 'd3'
import ReactiveProperty from '@/reactive-prop'
import { getFieldsOfType } from '@/utils'
export default class Tree {
  constructor(props) {
    this.id = props.id
    this.data = props.data.hierarchy
    this.nodeId = props.nodeId || Object.keys(props.data.nodes[0])[0] || 'id'
    this.el = null
    this._init()
  }

  _renderSVG() {
    const { clientWidth: width, clientHeight: height } = this.el
    let root = d3.hierarchy(this.data.get())
    root.dx = 10
    root.dy = width / (root.height + 1)
    root = d3.tree().nodeSize([root.dx, root.dy])(root)

    let x0 = Infinity
    let x1 = -x0
    root.each((d) => {
      if (d.x > x1) x1 = d.x
      if (d.x < x0) x0 = d.x
    })

    const svg = d3
      .create('svg')
      .attr('viewBox', [0, 0, width, x1 - x0 + root.dx * 2])

    const g = svg
      .append('g')
      .attr('font-family', 'sans-serif')
      .attr('font-size', 10)
      .attr(
        'transform',
        `translate(${(root.data.name.length + 1) * 5},${root.dx - x0})`
      )

    const link = g
      .append('g')
      .attr('fill', 'none')
      .attr('stroke', '#555')
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', 1.5)
      .selectAll('path')
      .data(root.links())
      .join('path')
      .attr(
        'd',
        d3
          .linkHorizontal()
          .x((d) => d.y)
          .y((d) => d.x)
      )

    const node = g
      .append('g')
      .attr('stroke-linejoin', 'round')
      .attr('stroke-width', 3)
      .selectAll('g')
      .data(root.descendants())
      .join('g')
      .attr('transform', (d) => `translate(${d.y},${d.x})`)

    node
      .append('circle')
      .attr('fill', (d) => (d.children ? '#555' : '#999'))
      .attr('r', 2.5)

    node
      .append('text')
      .attr('dy', '0.31em')
      .attr('x', (d) => (d.children ? -6 : 6))
      .attr('text-anchor', (d) => (d.children ? 'end' : 'start'))
      .text((d) => d.data.name)
      .clone(true)
      .lower()
      .attr('stroke', 'white')
    // this.el.addEventListener('resize', (e) => {
    //   console.log('resizeEvent', e.target.clientHeight, e.target.clientWidth)
    // })
    return svg.node()
  }
  _init() {
    // set被调用时，**这个**可视化该做什么
    this.data = new ReactiveProperty(
      this,
      'data',
      this.data,
      '_onDataChange',
      'set',
      'data'
    )
    this.selection = new ReactiveProperty(
      this,
      'selection',
      this.selection,
      '_onSelectionChange',
      'select',
      'items'
    )
  }
  mount(el) {
    if (typeof el === 'string' && !el.startsWith('#')) {
      el = `#${el}`
    }
    this.el = d3
      .select(el)
      .append('div')
      .style('position', 'relative')
      .style('box-sizing', 'border-box')
      .style('width', '100%')
      .style('height', '100%')
      .style('user-select', 'none')
      .style('overflow', 'auto')
      .node()

    this.el.appendChild(this._renderSVG())
  }
}
