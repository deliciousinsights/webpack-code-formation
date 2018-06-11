import hackerCase, { secretEmoji as hackerEmoji } from './utils/hacker-case'

import './index.scss'

const { hangman, secretEmoji: hangmanEmoji } = require('./utils/hangman')

console.log('hello world')
console.log(hackerEmoji, hackerCase('hello world'))
console.log(hangmanEmoji, hangman('hello world'))

document.body.insertAdjacentHTML(
  'afterBegin',
  `
    <h1>Et hop avec la CSS appliquée…</h1>
    <p>C’est <strong>super cool</strong> quand même…</p>
  `
)
