import Vue from 'vue/dist/vue.js'
import * as d3 from 'd3'
import { forEach, cloneDeep } from 'lodash'
import { boolArraySame, findItemWithKey } from '../../utils'

export default Vue.extend({
  name: 'LineChart',
  template: `
<div style="position: relative; width: 100%; height: 100%;">
  <div style="position: absolute; top: 3px; left: calc(100% - 50px); width: 50px;">
    <div v-for="l in legends" :key="l[0]" :style="{ color: l[1] }">
      {{ l[0] }}
    </div>
  </div>
  <svg width="100%" height="100%" ref="svg" style="position: absolute; left: 0;">
    <g
      class="axis"
      ref="x-axis2"
      :transform="'translate(0, ' + (height - xAxisSpace - margin) + ')'"
    />
    <g
      class="axis"
      ref="y-axis2"
      :transform="'translate(' + yAxisSpace+ ', ' + 0 + ')'"
    />
  </svg>
  <svg
    ref="chart"
    :width="elementLayout.chartSvg.width"
    :height="elementLayout.chartSvg.height"
    :transform="
      'translate(' + elementLayout.xAxisStartLocation + ',' +
      elementLayout.yAxisEndLocation + ')'
    "
    style="position: absolute; left: 0;"
    >
    <g ref="paths" id="path">
      <g v-if="dataFormatter.brushListener" ref="brush"></g>
    </g>
    <g ref="circles" id="circle"></g>
  </svg>
</div>
  `,
  data() {
    return {
      id: '',
      data: [],
      selection: [],
      defaultEncodings: {},
      selectedData: [],
      width: 50,
      height: 50,
      margin: 10,
      xAxisSpace: 10,
      yAxisSpace: 15,
      defaultSpace: 30,
      brushIndices: {},
      paths: null,
      circles: null,
    }
  },
  computed: {
    legends() {
      const keys = Object.keys(this.rowData)
      const legends = []
      forEach(keys, (key) => {
        legends.push([key, this.rowData[key].color])
      })
      return legends
    },
    dataSorted() {
      const tempData = cloneDeep(this.data)
      return tempData.sort(
        (a, b) => a[this.defaultEncodings.x] - b[this.defaultEncodings.x]
      )
    },
    rowData() {
      const rowData = {}
      const detail = this.defaultEncodings.detail

      let nC = 0
      this.dataSorted.forEach((d) => {
        if (!rowData[d[detail]]) {
          rowData[d[detail]] = {
            rows: [],
            color: d3.schemeTableau10[nC],
          }
          nC += 1
        }
        rowData[d[detail]].rows.push(d)
      })

      return rowData
    },
    elementLayout() {
      return {
        xAxisStartLocation: this.yAxisSpace,
        xAxisEndLocation: this.width - this.margin,
        yAxisStartLocation: this.height - this.xAxisSpace - this.margin,
        yAxisEndLocation: this.margin,
        chartSvg: {
          x: this.yAxisSpace,
          y: this.margin,
          width: this.width - this.margin - this.yAxisSpace,
          height: this.height - this.xAxisSpace - this.margin - this.margin,
        },
      }
    },
    dataFormatter() {
      // 上方将对象合成点数据的大数组方便下方找出所有点数据的x、y的范围
      const xExtent = d3.extent(this.data, (d) => d[this.defaultEncodings.x]) // x坐标范围
      const yExtent = d3.extent(this.data, (d) => d[this.defaultEncodings.y]) // y坐标范围
      const xSpace = Math.ceil(xExtent[1]).toString().length // 根据x坐标最大值长短确定间隔大小
      const ySpace = Math.ceil(yExtent[1]).toString().length

      // 基于数据和配置确定的坐标配置
      const axisConfig = {
        x: d3
          .scaleLinear()
          .domain(xExtent)
          .nice()
          .range([
            this.elementLayout.xAxisStartLocation,
            this.elementLayout.xAxisEndLocation,
          ]),
        y: d3
          .scaleLinear()
          .domain(yExtent)
          .nice()
          .range([
            this.elementLayout.yAxisStartLocation,
            this.elementLayout.yAxisEndLocation,
          ]),
        xSpace: xSpace,
        ySpace: ySpace,
        domain: { x: xExtent, y: yExtent },
        xRange: [this.yAxisSpace, this.width - this.margin],
        yRange: [this.height - this.xAxisSpace - this.margin, this.margin],
      }

      // 根据左边轴配置生成轴的生成器
      const xAxis = d3
        .axisBottom(axisConfig.x)
        .ticks(
          Math.round(this.height / (axisConfig.xSpace * this.defaultSpace))
        )
      const yAxis = d3
        .axisLeft(axisConfig.y)
        .ticks(Math.round(this.height / this.defaultSpace))

      const xScale = d3
        .scaleLinear()
        .domain(xExtent)
        .nice()
        .range([0, this.elementLayout.chartSvg.width])
      const yScale = d3
        .scaleLinear()
        .domain(yExtent)
        .nice()
        .range([this.elementLayout.chartSvg.height, 0])

      // 将选择框选中的数据输出
      const self = this
      const brush = d3
        .brush()
        .extent([
          [0, 0],
          [
            this.elementLayout.chartSvg.width,
            this.elementLayout.chartSvg.height,
          ],
        ])
        .on('end', function () {
          const brushArr = d3.brushSelection(this)
          if (!brushArr) return undefined
          const [[x0, y0], [x1, y1]] = brushArr
          const minX = xScale.invert(x0)
          const maxY = yScale.invert(y0)
          const maxX = xScale.invert(x1)
          const minY = yScale.invert(y1)

          const indices = []
          const selection = []
          forEach(self.rowData, (item) => {
            item.rows.forEach((d) => {
              if (
                d[self.defaultEncodings.x] >= minX &&
                d[self.defaultEncodings.x] <= maxX &&
                d[self.defaultEncodings.y] >= minY &&
                d[self.defaultEncodings.y] <= maxY
              ) {
                indices.push(d._key)
              }
            })
          })
          indices.forEach((item) => {
            const resultItem = findItemWithKey(self.data, item)
            if (resultItem) selection.push(resultItem)
          })
          if (!boolArraySame(self.selectedData, selection)) {
            self.$emit('selection', selection)
            self.selectedData = selection
          }

          self.circles.selectAll('circle').attr('r', 2)

          if (self.circles) {
            self.circles
              .selectAll('circle')
              .filter(function () {
                const cx = parseFloat(d3.select(this).attr('cx'))
                const cy = parseFloat(d3.select(this).attr('cy'))
                if (x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1) {
                  return true
                } else {
                  return false
                }
              })
              .attr('r', 4)
          }
        })
      const brushListener = brush

      return {
        axisConfig,
        brushListener,
        xAxis,
        yAxis,
        xScale,
        yScale,
      }
    },
  },
  watch: {
    dataFormatter: function () {
      this.paths.selectAll('path').remove()
      this.paths.selectAll('circle').remove()
      this.paths.selectAll('text').remove()
      this.circles.selectAll('g').remove()

      this.updateRowData()
      this.renderFun()
    },
    selection: function () {
      this.paths.selectAll('path').remove()
      this.paths.selectAll('circle').remove()
      this.paths.selectAll('text').remove()
      this.circles.selectAll('g').remove()

      this.updateRowData()
      this.renderFun()
    },
  },
  mounted() {
    // 首先根据图实际的大小初始化设置width和height等配置
    const rect = this.$refs['svg'].getBoundingClientRect()
    this.width = rect.width
    this.height = rect.height
    this.yAxisSpace = this.yAxisSpace * this.dataFormatter.axisConfig.ySpace

    const paths = d3.select(this.$refs['paths'])
    const circles = d3.select(this.$refs['circles'])
    this.paths = paths
    this.circles = circles

    // 根据dataFormatter中所得数据渲染路径
    this.updateRowData()
    this.renderFun()

    d3.select(this.$refs['x-axis2']).call(this.dataFormatter.xAxis)
    d3.select(this.$refs['y-axis2']).call(this.dataFormatter.yAxis)
    d3.selectAll('.axis text').style('user-select', 'none')
  },
  methods: {
    updateRowData() {
      // 用于生成path数据的函数集合
      forEach(this.rowData, (value, key) => {
        this.rowData[key].lineD = d3
          .line(value)
          .defined((d) => !isNaN(d[this.defaultEncodings.y]))
          .x((d) => this.dataFormatter.xScale(d[this.defaultEncodings.x]))
          .y((d) => this.dataFormatter.yScale(d[this.defaultEncodings.y]))
      })
    },
    renderFun() {
      const self = this

      // 根据dataFormatter中所得数据渲染路径
      forEach(this.rowData, (item) => {
        this.paths
          .append('path')
          .datum(item.rows)
          .attr('fill', 'none')
          .attr('stroke', `${item.color}`)
          .attr('stroke-width', 2.0)
          .attr('stroke-linejoin', 'round')
          .attr('stroke-linecap', 'round')
          .attr('d', item.lineD)

        this.circles
          .append('g')
          .selectAll('circle')
          .data(item.rows)
          .enter()
          .append('circle')
          .attr('cx', (d) =>
            this.dataFormatter.xScale(d[this.defaultEncodings.x])
          )
          .attr('cy', (d) =>
            this.dataFormatter.yScale(d[this.defaultEncodings.y])
          )
          .attr('r', (d) =>
            this.selection.find((item) => item._nbid_ === d._nbid_) ? 4 : 2
          )
          .attr('fill', `${item.color}`)
          .on('click', function (d) {
            const r = d3.select(this).attr('r')
            if (r !== '4') {
              self.circles.selectAll('circle').attr('r', 2)
              d3.select(this).attr('r', 4)
            } else {
              self.circles.selectAll('circle').attr('r', 2)
            }
            this.selectedData = [d]
          })
      })

      if (this.dataFormatter.brushListener) {
        // 设置brush事件
        d3.select(this.$refs['brush']).call(this.dataFormatter.brushListener)
      }
    },
  },
})
