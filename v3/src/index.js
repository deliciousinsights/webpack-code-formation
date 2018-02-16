import hackerCase, { secretEmoji as hackerEmoji } from './utils/hacker-case'

import chillingURL from '../images/chilling.jpg'
import { heroUnit } from './index.scss'

const { hangman, secretEmoji: hangmanEmoji } = require('./utils/hangman')

console.log('hello world')
console.log(hackerEmoji, hackerCase('hello world'))
console.log(hangmanEmoji, hangman('hello world'))

document.body.insertAdjacentHTML(
  'afterBegin',
  `
    <h1>Et hop avec la CSS appliquée…</h1>
    <p>C’est <strong>super cool</strong> quand même…</p>

    <div class="${heroUnit}">Hero Unit</div>

    <p><img src="${chillingURL}"/></p>
  `
)

const clock = setInterval(
  () => console.log(new Date().toLocaleString('fr')),
  1000
)

if (module.hot) {
  module.hot.accept()
  module.hot.dispose(() => clearInterval(clock))
}
