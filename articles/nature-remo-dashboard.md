---
title: Nature Remo で自宅環境ダッシュボードを作る
emoji: 📊
type: idea
topics: [natureremo, prometheus, grafana]
published: true
---

## はじめに

先日（1 年以上前），[Nature Remo 3](https://nature.global/nature-remo/nature-remo-3/) を購入しました．Nature Remo 3 はいわゆるスマートリモコンです．温度，湿度，照度，人感センサーを搭載し，赤外線リモコンで操作できる家電をコントロールする優れものです．

また，[Nature Remo Cloud API](https://developer.nature.global) を通して，各センサーの情報を取得できます．

となると，まず最初にすることは可視化です．スマホアプリ（[Google Play](https://play.google.com/store/apps/details?id=global.nature.remo&hl=ja&gl=US)，[App Store](https://apps.apple.com/jp/app/nature-remo/id1193531669)）でも現在の値を見ることはできますが，過去の情報も記録し，傾向などがわかるようにしたいのです．

そこで，センサー情報を [Grafana](https://grafana.com) で可視化できるようにしてみました．ある程度目的を達成できたので，どんなことをしたのかをこの記事にまとめていきます．

https://twitter.com/kou64yama/status/1618820985758834688

## やったこと

### Prometheus Exporter の作成

Grafana でデータを可視化するには，Grafana が対応する[データソース](https://grafana.com/docs/grafana/latest/datasources/)にデータを格納しなければなりません．

今回は [Prometheus](https://prometheus.io) を利用するため，Nature Remo Cloud API から取得したデータを Prometheus に取り込むための Exporter を作成しました（プロトタイプなのでコードの品質については触れないでください）．

https://github.com/kou64yama/nature-remo-exporter

### Docker Compose でのサービス化

上記の Nature Remo Exporter と Prometheus，Grafana を Docker Compose で起動できるようにしました．アクセストークンさえ設定すれば，誰でもすぐに同じ環境を作成できます．

## 今後の展開

### クラウド環境への移行

現在は Docker Compose を利用して Nature Remo Exporter，Prometheus，Grafana をローカル環境で起動しています．これでは PC をシャットダウンはおろか，スリープすらできません．また，自宅ネットワーク外からはアクセスできません．

なので，AWS や GCP などのクラウド環境で動作させることを考えています．

### 人感センサーを利用できるようにする

人感センサーも Prometheus に格納できているのですが，この値は他のセンサーとは異なり，常に 1 が記録されています．

これは [Swagger](https://swagger.nature.global/#/default/get_1_devices) に書かれている通りなのですが，人感センサーは値ではなくイベントの作成日時（`created_at`）を見る必要があります．今はセンサーの値しか取得していないため，人感センサーは使うことができません．

> The val of "mo" is always 1 and when movement event is captured created_at is updated.

### 複雑な条件でのオートメーション

スマホアプリでもオートメーションを設定できますが，もっと複雑な条件でのオートメーションを考えています．

例えば「室温が一定以下かつ人感センサーに反応がある場合にエアコンを入れる」「不在中に人感センサーが反応したら通知する」などです．

### 加湿器を買う

冬なので湿度がずっと低いです．加湿器の購入を検討中です．
