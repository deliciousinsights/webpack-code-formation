export function hackerCase(text) {
  let upperCase = true
  return text.replace(/\S/g, (c) =>
    c[(upperCase = !upperCase) ? 'toUpperCase' : 'toLowerCase']()
  )
}

export default hackerCase
