import Nebula from '@/spec-parser'
import spec from '../public/nb-spec/fig-line-pie.json'

const nebulaInstance = new Nebula('#app', spec)
nebulaInstance.init()
window.nebulaInstance = nebulaInstance
