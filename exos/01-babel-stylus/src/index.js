import { pick } from 'lodash-es'

import './index.styl'

const DEFAULTS = { first: 'John', last: 'Smith', age: 42 }
const INTERMEDIARY = pick(DEFAULTS, 'first', 'last')
const FINAL = { age: 36, ...INTERMEDIARY, first: 'Jane' }

document.getElementById('result').textContent = JSON.stringify(FINAL)
