import 'regenerator-runtime/runtime'
import './hacker-background.scss'

// exports.secretEmoji = …
export const secretEmoji = '😎'

// exports.hackerCase = function hackerCase…
export function hackerCase(text) {
  let upperCase = true
  return text.replace(/\S/g, (c) => {
    upperCase = !upperCase
    return c[upperCase ? 'toUpperCase' : 'toLowerCase']()
  })
}

export async function askDeepHacker(text) {
  const { default: deepHack } = await import(
    /* webpackChunkName: 'deeper-hacker', webpackPreload: true */ './deeper-hacker'
  )
  deepHack(text)
}

// module.exports = hackerCase
// hackerCase.secretEmoji = …
export default hackerCase

// Unused export, will be tree-shaken
export function uselessCruft() {
  console.log('THIS IS USELESS CRUFT')
  uselessSubCruft()
}

// Unused because caller code is an unused export that’ll be tree-shaken
function uselessSubCruft() {
  console.log('THIS IS USELESS SUBCRUFT')
}
