module.exports = {
  '**/*.{md,json}': (filenames) => [
    `prettier --write ${filenames.join(' ')}`,
    `git add --force ${filenames.join(' ')}`,
  ],
};
