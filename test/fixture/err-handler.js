try {
  return cache()
} catch (ex) {
  try {
    return server()
  } catch (ex) {
    return 'default'
  }
}