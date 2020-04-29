import * as d3 from 'd3'
import ReactiveProperty from '@/reactive-prop'
import VueBarCahrt from './vue-bar-chart'
import { getFieldsOfType } from '@/utils'
export default class BarCahrt {
  constructor(props) {
    this.id = props.id
    this.data = props.data
    const numericFields = getFieldsOfType(this.data, 'number')
    const x = props.x || numericFields[0]
    const y =
      props.y ||
      (props.stacked
        ? numericFields.filter((field) => field !== x)
        : numericFields[1])
    const selection = props.selection || this.data
    let color = props.color || '#FF7400'
    if (props.stacked && !Array.isArray(props.color))
      color = y.map(() => props.color)

    this.x = x
    this.y = y
    this.aggregate =
      props.aggregate || (props.stacked ? y.map((item) => 'count') : 'count')
    this.count = props.count
    this.bottomEdge = props.bottomEdge
    this.color = color
    this.selectionColor = props.selectionColor
    this.stacked = props.stacked
    this.isDisplay = props.isDisplay

    this.selection = selection
    this.selectedXRange = props.selectedXRange || {}
    this.xRange = props.xRange || []
    this.el = null
    this.vm = null

    this._init()
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
      .node()
    this.vm.$mount(this.el)
  }

  _init() {
    this._initReactiveProperty()
    this.vm = new VueBarCahrt({
      data: {
        id: this.id,
        data: this.data.get(),
        selection: this.selection.get(),
        selectedXRange: this.selectedXRange.get(),
        xRange: this.xRange.get(),
        encoding: {
          x: this.x.get(),
          y: this.y.get(),
          aggregate: this.aggregate.get(),
          stacked: this.stacked,
          color: this.color,
          count: this.count,
          selectionColor: this.selectionColor,
          bottomEdge: this.bottomEdge,
          isDisplay: this.isDisplay,
        },
      },
      watch: {
        data(val) {
          this.selection = []
          this.selectedXRange = {}
        },
      },
    })
    this.vm.$on('selection', (val) => {
      this.selection.set(val)
    })
    this.vm.$on('selectedXRange', (val) => {
      this.selectedXRange.set(val)
    })
  }
  _initReactiveProperty() {
    // set被调用时，**这个**可视化该做什么
    this.data = new ReactiveProperty(
      this,
      'data',
      this.data,
      '_onDataChange',
      'set',
      'data'
    )
    this.x = new ReactiveProperty(
      this,
      'x',
      this.x,
      '_onXChange',
      'encode',
      'x'
    )
    this.y = new ReactiveProperty(
      this,
      'y',
      this.y,
      '_onYChange',
      'encode',
      'y'
    )
    this.aggregate = new ReactiveProperty(
      this,
      'aggregate',
      this.aggregate,
      '_onAggregateChange',
      'encode',
      'aggregate'
    )
    this.selection = new ReactiveProperty(
      this,
      'selection',
      this.selection,
      '_onSelectionChange',
      'select',
      'items'
    )
    this.selectedXRange = new ReactiveProperty(
      this,
      'selectedXRange',
      this.selectedXRange,
      '_onSelectedXRangeChange',
      'select',
      'ranges'
    )
    this.xRange = new ReactiveProperty(
      this,
      'xRange',
      this.xRange,
      '_onXRangeChange',
      'navigate',
      'ranges'
    )
  }

  _onDataChange(val) {
    if (!Array.isArray(val)) {
      throw new TypeError(`BarChart: expect data to be Array, got ${val}`)
    }
    this.vm.data = val
  }

  _onAggregateChange(val) {
    if (typeof val !== 'string') {
      throw new TypeError(`BarChart: expect x to be string, got ${val}`)
    }
    this.vm.aggregate = val
  }

  _onXChange(val) {
    if (typeof val !== 'string') {
      throw new TypeError(`BarChart: expect x to be string, got ${val}`)
    }
    this.vm.x = val
  }

  _onYChange(val) {
    if (
      typeof val !== 'string' &&
      Object.prototype.toString.call(val) !== '[object Array]'
    ) {
      throw new TypeError(`BarChart: expect y to be string, got ${val}`)
    }
    this.vm.y = val
  }

  _onSelectionChange(val) {
    if (!Array.isArray(val)) {
      throw new TypeError(`BarChart: expect selection to be Array, got ${val}`)
    }
    this.vm.selection = val
  }

  _onSelectedXRangeChange(val) {
    // if (!Array.isArray(val)) {
    //   throw new TypeError(
    //     `BarChart: expect selectedXRange to be Array, got ${val}`
    //   )
    // }
    this.vm.selectedXRange = val
  }

  _onXRangeChange(val) {
    // if (!Array.isArray(val)) {
    //   throw new TypeError(
    //     `BarChart: expect selectedXRange to be Array, got ${val}`
    //   )
    // }
    this.vm.xRange = val
  }
}
