module.exports = {
  rules: {
    "preset-ja-spacing": {
      "ja-space-between-half-and-full-width": {
        space: "always",
        expectPunctuation: true,
      },
    },
    "preset-ja-technical-writing": {
      "ja-no-mixed-period": {
        periodMark: "．",
      },
    },
    "preset-japanese": true,
    "preset-jtf-style": {
      "1.2.1.句点(。)と読点(、)": false,
      "1.2.2.ピリオド(.)とカンマ(,)": false,
      "3.1.1.全角文字と半角文字の間": false,
      "4.1.3.ピリオド(.)、カンマ(,)": false,
    },
  },
};
