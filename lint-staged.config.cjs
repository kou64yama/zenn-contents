module.exports = {
  '**/*.md': ['prettier --write', 'textlint --fix'],
  '**/*.json': ['prettier --write']
}
