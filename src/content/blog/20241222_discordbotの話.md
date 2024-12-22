---
title: "DiscordでMinecraft用のEC2サーバーを操作するBotを作った話"
description: "Lambdaで実装したDiscord BotでEC2を管理、TerraformでIaC、esbuildでビルド、Biomeでformat, lint"
pubDate: "2024-12-22"
heroImage: "/blog-placeholder-4.jpg"
---

## Intro
 ブログを作って満足で１年が経過しそうなので、滑り込みで今年の６月ごろに作ったDiscord Botの話をさらっと紹介します。  
（流石に１年で記事一本は寂しいですしね

リポジトリはこちら  
[https://github.com/nakamo326/discord-mc2-bot](https://github.com/nakamo326/discord-mc2-bot)

当時Minecraftをやっており、せっかくなのでAWSの勉強も兼ねてEC2でサーバー構築をしました。（サーバーの構築については割愛）  
使わない時はインスタンスを停止しておきたいのですが、毎回ポータルからぽちぽちするのが面倒になったのでDiscord Bot経由で操作したいというのが主旨になります。  
なるべくコストはかけたくないのでDiscord BotはAWS Lambdaで実装しました。

## 想定読者

- Minecraftサーバーをこまめに起動、停止したい人
- AWS Lambdaを利用したDiscord Botの運用に興味のある人
- Terraformを利用したAWS LambdaのIaCに興味がある人

## 構成
今回Discord経由で実現したは以下のようになります。

- スラッシュコマンドでDiscord BotからMinecraftサーバーを開始、停止
- EC2起動時に、Route53にレコードを作成（停止時には削除
- スラッシュコマンドでサーバー状態（起動状態、アクティブプレイヤー数）を確認
- Lambda functionをAmazon EventBridgeで定期実行、プレイヤーがいない時、サーバーを停止

機能単位ごとにAWS Lambdaとして実装されており、必要に応じて[InvokeCommand](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/lambda/command/InvokeCommand/)によってそれぞれの機能を呼び出して利用する形になっています。
（例: 自動停止のLambdaは、サーバー状態を確認するLambdaをinvokeし、起動状態のサーバーにプレイヤーがいない時、サーバーを停止するLambdaをinvokeするなど）

構成を図にするとこんな感じです。

![構成図](/posts/20241222/構成図.png)

## 良かったこといくつかを紹介


### TerraformでLambdaのデプロイが簡単
AWSのリソース管理にはTerraformを利用しました。
Data Sourceの`archive_file`を使うことで、生成されたzipファイルのハッシュに差分があると、Lambdaのリソースも更新がトリガーされます。
Lambdaのコードを修正、デプロイのサイクルが回しやすく開発体験が良かったです。

```hcl

data "archive_file" "source_code_start_ec2" {
  type        = "zip"
  source_dir  = "${path.module}/../dist/start_ec2"
  output_path = "${path.module}/../dist/lambda_function_payload_start_ec2.zip"
}

resource "aws_lambda_function" "discord_mc2_start_ec2" {
  filename      = "${path.module}/../dist/lambda_function_payload_start_ec2.zip"
  function_name = "discord_mc2_start_ec2"
  role          = aws_iam_role.iam_role_for_start_ec2.arn
  handler       = "index.handler"

  source_code_hash = data.archive_file.source_code_start_ec2.output_base64sha256

  runtime       = "nodejs20.x"
  architectures = ["arm64"]
  timeout       = 60

  environment {
    variables = {
      EC2_INSTANCE_ID = var.ec2_instance_id
      HOSTED_ZONE_ID  = var.route53_hosted_zone_id
      DOMAIN_NAME     = var.route53_server_domain
    }
  }
}

```

Azure Functionsなどにも同じようなことができそうな[attribute](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/windows_function_app#zip_deploy_file-1)があるので、近いうちに試してみたいなと思っています。
（Azure FunctionsのCIを何回か構築したのですが、いまいちすっきり設定できず。。デプロイがTerraformのCIサイクルに乗せられると小さいプロジェクトは管理がしやすいかもと考えています
### esbuildによるビルド
構築当初は依存パッケージをzipファイルにまとめて、[Layer](https://docs.aws.amazon.com/ja_jp/lambda/latest/dg/chapter-layers.html)としてLambdaにアップロードしていたのですが、途中で面倒になりesbuildによるビルドに切り替えました。
結果として不要なコードのTree Shakingによるデプロイパッケージサイズの削減もでき良かったです。
esbuildのビルド速度の速さ（0.5秒ほど！）も体感できました。
entryPointsの抽出がコマンドラインオプションで上手く行かなかったのか、以下のような`esbuild.mjs`でビルドしています。

```js esbuild.mjs
import * as esbuild from "esbuild";
import * as glob from "glob";

const entryPoints = glob.sync("./src/*").map((file) => `./${file}`);
console.log(entryPoints);

await esbuild.build({
  entryPoints: entryPoints,
  entryNames: "[dir]/[name]/index",
  bundle: true,
  minify: true,
  sourcemap: true,
  platform: "node",
  target: ["node20"],
  external: ["@aws-sdk/*"],
  outdir: "dist",
});
```
### Biomeによるお手軽format, lint
サクッと開発したかったのでBiomeをformatter, linterとして採用しました。
設定もシンプルだし、実行も早いしで良かったです。
prettierはともかくeslintは設定むずかしすぎませんか？

## Outro
Minecraftだけに限らず、コスト効果の高いEC2の管理インターフェイスとして活用できるのではと思っています。
良かったら使ってみてください。感想待ってます。

思い出しながらの記事になってしまったので次は忘れる前に書きたいなという所存です。  
CPUの作り方に沿って自作CPUを会社の友人と作成しているので、キリのいいところでまとめようと思っています。  
それでは、またいつか
