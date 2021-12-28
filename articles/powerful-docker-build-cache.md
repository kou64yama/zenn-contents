---
title: Docker のキャッシュを全力で使いこなそう
emoji: 🐳
type: tech
topics: [docker]
published: false
---

## tl;dr

- 依存パッケージのダウンロードは最初に実行しよう
- マルチステージビルドは必須と覚えておこう
- [`RUN --mount=cache=type`](https://github.com/moby/buildkit/blob/master/frontend/dockerfile/docs/syntax.md#run---mounttypecache) を使おう（でも BuildKit を使えるかは確認して！）
- [`pnpm fetch`](https://pnpm.io/ja/cli/fetch) も期待大

## はじめに

みなさん，Docker を使って開発するときに依存パッケージのダウンロードをずっと待ち続けた経験はありませんか？「依存パッケージの追加なんて頻繁に発生しないし，我慢しよう…」と妥協している方も多いでしょう．

頻繁に発生しない？本当にそうですか？

追加ではなくても依存パッケージの更新なんてよく発生するし，ベースイメージを更新することもあります．その度に全部ダウンロードし直しなんて堪ったもんじゃありません．モバイル回線だったら一瞬でギガがなくなっちゃいますよ！

ということで，この記事ではキャッシュを活用して依存パッケージのダウンロードが何度も発生しないようにする方法を模索してみました．

## 方法

### 方法 1. 何も考えずに Dockerfile を記述する

まずは出発点として，何も考えずに `Dockerfile` を書いてみましょう．例として React アプリケーションを作成してみます．

```bash
npx create-react-app myapp
```

そして，この React アプリケーションをビルドする `Dockerfile` を作成します．ここではマルチステージビルドを活用して，[node](https://hub.docker.com/_/node) でビルドしたアプリケーションを [nginx](https://hub.docker.com/_/nginx) に載せています．キャッシュのことを考えないなら大体こんな感じでしょう．

```dockerfile
FROM node:16 AS builder

WORKDIR /workspace

# ハッシュ値がなるべく変わりにくいように，ビルドに関係するファイルだけをコピーします．
COPY package.json package-lock.json ./
COPY public public
COPY src src

RUN npm install
RUN npm run build

FROM nginx:stable

COPY --from=builder /workspace/build /usr/share/nginx/html
```

これを 2 回連続でビルドしてみましょう．

```bash
docker build --progress=plain -t localhost/myapp:latest .
```

2 回目のログでは `npm install` したときに `CACHED` と表示されており，レイヤーのキャッシュを使用したことがわかります．もちろんこのステップは一瞬で終わります．

```
#12 [builder 6/7] RUN npm install
#12 sha256:b8677258444adb8833e63e5b338e22cd569bf6a6e4fd5120f94873af48fc058e
#12 CACHED
```

キャッシュが効いていることがわかったので，コードを適当に変更してもう一度ビルドしてみましょう．

```
#12 [builder 6/7] RUN npm install
#12 sha256:3575b466596b16098e185319b3ff5472a0163b1e89c520132a214019cd20b47a
（省略）
#12 DONE 234.2s
```

に，にひゃくさんじゅうよんびょう…
そういえば大雪でトラフィックが詰まってるってニュースで言ってたもんな？きっとそのせいだ．

https://www3.nhk.or.jp/news/html/20211227/k10013405421000.html

`src/App.js` を書き換えたので `npm install` を実行するレイヤーのハッシュ値が変わってしまったからです．これではソースコードを変更するたびに依存パッケージをダウンロードし直してしまいます．

### 方法 2. 最初に依存パッケージのインストールだけを行う

ソースコードを変更しても依存パッケージのダウンロードが実行されないようにするにはどうしたらいいでしょう？

よくある方法は，依存パッケージが記載されたファイルを `COPY` して，先にインストールだけ済ませてしまうというものです．npm の場合，インストールされるパッケージは `package.json`, `package-lock.json` に記載されています．これらを `COPY` してすぐに `npm install` を実行してみましょう．

```dockerfile
FROM node:16 AS builder

WORKDIR /workspace

# npm install だけ先に実行します．
COPY package.json package-lock.json ./
RUN npm install

COPY public public
COPY src src
RUN npm run build

FROM nginx:stable

COPY --from=builder /workspace/build /usr/share/nginx/html
```

方法 1 と同じように，ビルド → コード変更 → ビルドをしてみましょう．

```
#10 [builder 4/7] RUN npm install
#10 sha256:bcd99585d52f56e16d250aad7fcf7f66cebb1aa1b45fe4da6ed44bfaaf7da65f
#10 CACHED

（省略）

#13 [builder 7/7] RUN npm run build
#13 sha256:f76e83bb9755ce32925e9b302c7b14c2509a4b3cc78b3841cda79c144c7c0c40
（省略）
#13 DONE 32.0s
```

成功です！`npm install` がちゃんとキャッシュされています！ソースコードを変更しても `npm install` を実行する時点では関係ないのでキャッシュが使われるんです．

ちなみに，マルチステージビルドがなかった時代は `RUN command1 && command2 && ...` というように 1 つの `RUN` に全てのコマンドをまとめてしまっていたと思いますが，今は最後のステージ以外では分けるのが基本です．これもキャッシュの恩恵を最大限受けられるようにするためですね．今回は node のイメージから nginx のイメージに載せ替えていますが，たとえ実行時のイメージが node だったとしてもマルチステージビルドはもう必須だと思っておきましょう．

あとは `package.json` の `author` を変更して，念のため^[もちろん，「念のため」でビルドする必要はありません．]もう一度ビルドして…

```
#10 [builder 4/7] RUN npm install
#10 sha256:fcb3324fa550e83d308b200f83db0bd7051983aca78b6418b49a603bf815da82
（省略）
#10 DONE 128.3s
```

知ってた．

ソースコードの変更には影響されなくても，`package.json` を変更したらレイヤーのハッシュ値が変わっちゃいますよね．

`package.json` の変更なんてそんなにない？`package.json` に `eslintConfig` や `browserslist` を書いてたりしませんか？`version` はずっと同じですか？依存パッケージを追加，削除，バージョンアップすることありませんか？その度に全パッケージダウンロードするのは厳しいでしょう．

## 方法 3. `--mount=type=cache` を使う

:::message
[BuildKit](https://github.com/moby/buildkit) を使っていることが前提です．`/etc/docker/daemon.json` や Docker Desktop の設定で `features.buildkit=true` となっていることを確認してください．

https://docs.docker.com/develop/develop-images/build_enhancements/
:::

ここからが本命です．

イメージのビルドに使われている BuildKit には [`RUN --mount=...`](https://github.com/moby/buildkit/blob/master/frontend/dockerfile/docs/syntax.md#build-mounts-run---mount) という構文があります．これは `RUN` の実行時に特定のディレクトリをマウントしておく機能です．

なんとこの中に [`RUN --mount=type=cache`](https://github.com/moby/buildkit/blob/master/frontend/dockerfile/docs/syntax.md#run---mounttypecache) というキャッシュディレクトリを指定する機能があるのです．指定されたディレクトリはビルドを跨いでデータを保持しておくことができます．また，ディレクトリ内のファイルはレイヤーに含まれなくなります．

npm は `/root/.npm` をキャッシュディレクトリとして使用しているため，このディレクトリを指定すれば `package.json` が更新されてもキャッシュされている tarball の再取得は行わないはずです．

```dockerfile
# syntax=docker/dockerfile:1

FROM node:16 AS builder

WORKDIR /workspace

COPY package.json package-lock.json ./
# /root/.npm をキャッシュします．
RUN --mount=type=cache,target=/root/.npm npm install

COPY public public
COPY src src
RUN npm run build

FROM nginx:stable

COPY --from=builder /workspace/build /usr/share/nginx/html
```

:::message
先頭の `# syntax=docker/dockerfile:1` は `RUN --mount=...` 構文を使うための記述です．

https://docs.docker.com/develop/develop-images/build_enhancements/#overriding-default-frontends
:::

方法 2 と同じく `package.json` の `author` を変更してビルドすると…

```
#14 [builder 4/7] RUN --mount=type=cache,target=/root/.npm npm install
#14 sha256:84029e3950b71f66b6565a5937851cdcbfc9a3f6948b8fd7840560bb562468fe
（省略）
#14 DONE 34.2s
```

レイヤーのハッシュ値は変わってしまうのでコマンド自体がキャッシュされることはありませんが，`npm install` が 34 秒と大幅に改善されています．これは以前ダウンロードしたパッケージに対しては npm のキャッシュが使われるからですね．これならパッケージの追加や更新があってもその分だけダウンロードすればいいのでもう 2 度と全パッケージダウンロードすることはありません．

やったね！

### 補足 1. `node_modules` をキャッシュしてもいいのでは？

`/workspace/node_modules` をキャッシュする方が速いですが，実行時にも使うなら `npm install --production` して `devDependencies` を削除することもあります．そうすると `devDependencies` の分はまたダウンロードからやり直しになってしまうので `/root/.npm` を指定しました．

`--mount=...` は複数指定してもいいので，両方ともキャッシュしてしまうのもいいでしょう．

```dockerfile
RUN \
  --mount=type=cache,target=/root/.npm \
  --mount=type=cache,target=/workspace/node_modules \
  npm install
```

### 補足 2. Yarn や pnpm の場合は？

Yarn や pnpm の場合，パッケージの lock ファイルは `package-lock.json` ではなく，それぞれ `yarn.lock`, `pnpm-lock.yaml` です．また，キャッシュディレクトリは `/usr/local/share/.cache/yarn/v6`，`/root/.pnpm-store` です．

ここを読み替えれば同じようにキャッシュしてくれるでしょう．

pnpm には実験的なコマンドですが [`pnpm fetch`](https://pnpm.io/ja/cli/fetch) という `pnpm-lock.yaml` だけでパッケージをダウンロードするコマンドもあります．こちらを使えば `package.json` の変更にさらに強くなります．ただし，pnpm は [node](https://hub.docker.com/_/node) のイメージには含まれないのでその点は注意が必要です．

### 補足 3. APT や yum の場合

ここまで npm を例にして書いてきましたが，APT や yum を使って追加パッケージを入れたいときもありますね．`RUN --mount=type=cache` はそんなときにも活躍しますよ．

ちなみに，これまでは実行時に必要なパッケージを入れる場合，最後に `apt-get clean` や `rm -rf ...` を実行してキャッシュを消していたと思います．キャッシュディレクトリに指定しておけばその必要もありません．

APT の場合：

```dockerfile
FROM ubuntu:20.04

RUN \
  --mount=type=cache,target=/var/lib/apt/lists \
  --mount=type=cache,target=/var/cache/apt/archives \
  apt-get update \
  && apt-get install -y --no-install-recommends build-essential
```

yum の場合：

```dockerfile
FROM centos:7

RUN --mount=type=cache,target=/var/cache/yum \
  yum groupinstall -y 'Development Tools' \
  && yum install -y kernel-devel kernel-headers
```

### 補足 4. BuildKit が使えないんだけど…

- 「うちで使っていい Docker はバージョンが指定されていて BuildKit より前のバージョンなんだ」
- 「CI/CD が BuildKit 使えない環境なんだ」
- 「そもそも Podman だ^[Podman でも [BuildKit を使う方法](https://github.com/moby/buildkit#podman)はありますが，流石にちょっと面倒です]」

など，さまざまな理由により BuildKit を使えないことがあります．BuildKit を使えるように頑張るか，諦めて「方法 2」で妥協しましょう（結局妥協するんかい）．

## まとめ

いかがでしたか？

仕事で使うには BuildKit が使えるかどうかを調べておく必要はありますが，`RUN --mount=...` はすごく便利です．`type=cache` 以外にも `type=bind`, `type=secret`, `type=tmpfs` などがあるので，使いこなしてみると面白いかもしれません．

もし BuildKit が使えなくてもパッケージだけは先にダウンロードしてください．そしてマルチステージビルドも必須です．

また，今回はテーマをキャッシュだけに絞っていますが，`.dockerignore` で余計なファイルを Docker デーモンへ送らないようにするのも結構重要だったりします．`node_modules` はブラックホールよりも重いですからね．

https://www.reddit.com/r/ProgrammerHumor/comments/6s0wov/heaviest_objects_in_the_universe/
