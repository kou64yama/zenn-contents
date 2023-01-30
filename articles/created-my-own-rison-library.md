---
title: Rison ライブラリを自作してみた
emoji: 🔗
type: tech
topics: [rison, npm]
published: true
---

## Rison とは

Rison は JSON ライクなデータフォーマットで，URL に載せても `%` だらけにならないという特徴があります．

https://github.com/Nanonid/rison

> This page describes _Rison_, a data serialization format optimized for compactness in URIs. Rison is a slight variation of JSON that looks vastly superior after URI encoding. Rison still expresses exactly the same set of data structures as JSON, so data can be translated back and forth without loss or guesswork.

こんな感じです．

```
(q:*,start:0,count:10)
```

より詳しい説明などはこちらの記事がとても参考になります．

https://qiita.com/townewgokgok/items/290c587c30b583dacd9e

JSON と Rison の変換はこちらのサイトで試すことができます．

https://rison.io

NPM パッケージも公開されています．

https://www.npmjs.com/package/rison

## なぜ新しい Rison のライブラリを作ったのか

オリジナルのライブラリは `rison.encode()`/`rison.decode()` という関数でエンコード・デコードを行います．

これに特に問題があるわけではないのですが，JSON ライクなフォーマットなら，`encode()`/`decode()` ではなく，`stringify()`/`parse()` となっている方が嬉しいです．

これを叶えるために Rison ライブラリを自作してみました．

https://www.npmjs.com/package/rison2

もちろん，関数名を変えたいだけならラッパーを作ればいいので，わざわざ自作したのは単にやってみたかったというだけです．

## 使い方

使い方は [README](https://github.com/kou64yama/rison2#readme) の通りで，`rison2` を import して `RISON.stringify()`/`RISON.parse()` を呼び出すだけです．

```js
import { RISON } from 'rison2'

console.info(RISON.stringify({ message: 'こんにちは，世界' }))
// '(message:こんにちは，世界)'

console.info(RISON.parse('(message:こんにちは，世界)'))
// { message: 'こんにちは，世界' }
```

`RISON` の代わりに O-Rison や A-Rison 形式に対応した `ORISON` や `ARISON` を import して使うこともできます．たぶん Tree Shaking なんかもちゃんと動いてくれるので，Webpack や Rollup などを使用しているなら import したものだけがバンドルされるされるはずです．

README にはシンプルな使い方しか書いていないですが，もう少し実践的な使い方も考えてみます．

例として [Express](https://expressjs.com) で何らかのワードを検索するエンドポイントを作成するとします．このエンドポイントは検索キーワード，返す検索結果の開始位置，件数（開始位置と件数は省略可）をクエリパラメータで指定できるとします．

`rison2` を使用したコードは次のようになります．

```js
import express from 'express'
import { ORISON } from 'rison2'
import { searchEngine } from './searchEngine'

const first = (value) => {
  return Array.isArray(value) ? value[0] : value
}

const app = express()

app.get('/search', async (req, res) => {
  const { q, start, count } = ORISON.parse(first(req.query.query) ?? '')
  const result = await searchEngine.search(q, { start, count })
  res.json(result)
})
```

また，このエンドポイントにリクエストを投げるコードはこのようになります．

```js
import { RISON, escape } from 'rison2'

const params = ORISION.stringify({
  q: '*',
  start: 0,
  count: 10
})
await fetch(`/search?query=${escape(params)}`)
```

ポイントは `start` と `count` です．この 2 つのパラメータは数値型となるわけですが，Rison には JSON 相当の型があるため，特に何もしなくても数値型として扱えています．また，今回は説明のために単純なクエリを使用していますが，何階層にもネストされているようなオブジェクトでも簡単に扱うことができます．

## 終わりに

このライブラリは 1 年以上前に作成していて，遊びで作ってみただけのものだったのでその後何もしないで放置していました．作って何もしない（GitHub や NPM で公開しているとはいえ，その存在を誰も知らない）というのは作っていないのと同じです．そういうのばかりでよくないなと思ったので，今回こういう紹介記事を書いてみました．Rison はあまりメジャーではない印象ですが，もし便利そうだと感じたらぜひ使ってみてください．

## 参考リンク

- [JSON を URI に埋め込んでも%地獄にならない「Rison」のススメ - Qiita](https://qiita.com/townewgokgok/items/290c587c30b583dacd9e)
- [rison - json for uris](https://web.archive.org/web/20130910064110/http://mjtemplate.org/examples/rison.html)
