import hackerCase, { secretEmoji as hackerEmoji } from './utils/hacker-case'

const { hangman, secretEmoji: hangmanEmoji } = require('./utils/hangman')

console.log('hello world')
console.log(hackerEmoji, hackerCase('hello world'))
console.log(hangmanEmoji, hangman('hello world'))
