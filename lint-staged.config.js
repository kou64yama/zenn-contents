module.exports = {
  "**/*.md": (filenames) => [
    `textlint --fix ${filenames.join(" ")}`,
    `git add --force ${filenames.join(" ")}`,
  ],
  "**/*.json": (filenames) => [
    `prettier --write ${filenames.join(" ")}`,
    `git add --force ${filenames.join(" ")}`,
  ],
};
