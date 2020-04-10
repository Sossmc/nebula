import * as d3 from 'd3'

function getNbidsFromData(data) {
  return data.map((d) => d._nbid_)
}

function getFieldsOfType(data, type) {
  const datum = data[0]
  if (datum) {
    return Object.keys(datum).filter((key) => typeof datum[key] === type)
  }
  return []
}

function getDataExtent(data, key) {
  return d3.extent(data, (d) => d[key])
}

function boolDataHasAttributes(data, ...attrNames) {
  const datum = data[0]
  return datum && attrNames.every((attrName) => datum[attrName] !== undefined)
}

function isArrayOfType(array, type, col, row) {
  if (!array) return false
  if (row === undefined) row = 1
  if (row === 1 && array.length > 1) {
    array = [array]
  }
  return (
    Array.isArray(array) &&
    array.length === row &&
    array.every(
      (r) =>
        Array.isArray(r) &&
        r.length === col &&
        r.every((c) => typeof c === type)
    )
  )
}

export {
  getNbidsFromData,
  getFieldsOfType,
  getDataExtent,
  boolDataHasAttributes,
  isArrayOfType,
}
