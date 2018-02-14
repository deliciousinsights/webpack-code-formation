// exports.secretEmoji = …
export const secretEmoji = '🤕'

// exports.hangman = function hangman…
export function hangman(text) {
  return text.replace(/\S/g, '-')
}

// module.exports = hangman
// hangman.secretEmoji = …
export default hangman
