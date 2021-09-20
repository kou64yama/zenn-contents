module.exports = {
  "**/*.md": (filenames) => [
    `prettier --write ${filenames.join(" ")}`,
    `textlint --fix ${filenames.join(" ")}`,
    `git add --force ${filenames.join(" ")}`,
  ],
  "**/*.json": (filenames) => [
    `prettier --write ${filenames.join(" ")}`,
    `git add --force ${filenames.join(" ")}`,
  ],
};
