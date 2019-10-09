// exports.secretEmoji = …
export const secretEmoji = '😎'

// exports.hackerCase = function hackerCase…
export function hackerCase(text) {
  let upperCase = true
  return text.replace(/\S/g, (c) =>
    c[(upperCase = !upperCase) ? 'toUpperCase' : 'toLowerCase']()
  )
}

// module.exports = hackerCase
// hackerCase.secretEmoji = …
export default hackerCase
