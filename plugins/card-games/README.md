# 一起玩牌 1.1.4 / Card Games 1.1.4

一个原生DSH包提供斗地主和德州积分桌。需要本交付的 `voice-games-v1` 小游戏宿主补丁；旧宿主显示需要升级，不能静默创建另一套钱包。

界面可开桌、选择真实角色、行动、请求绑定模型、等待、取消、暂停恢复、手间补筹、安排下一手座位、公开聊天及按需德州全牌复盘。德州默认用户+4位AI，角色不足提示调整，绝不复制角色补位。

规则由后台验证，页面和模型只能提出行动。AI没有机器人、随机动作或强制超时兜底。模型失败暂停或重试同一冻结绑定；角色改绑下一局/手生效，授权撤销立即生效。页面“自动继续AI回合”仅在用户本次勾选后有效，刷新后关闭；恢复不自动付费请求。

两个游戏复用本体唯一用户钱包、角色钱包和每日低保。游戏自己的页面不读取数据库或发任意金额命令。财务、奖励、存档和请求凭据由宿主权威服务保存。钱包负奖励修订不能侵蚀活动牌局本金。

正常私有投影仅包含自己的底牌；公开桌聊没有任何隐藏牌。德州只有指定手最终结算后能通过回放入口查看全部已发底牌；回放不包含未发牌堆，也不重发奖励。斗地主首版无独立复盘。

原生入口 `src/index.mjs`，客户端入口 `src/client/index.mjs`，纯规则入口 `src/rules/index.mjs`。根构建脚本统一产出 `lib/index.js`、`lib/client.js`、`lib/rules.js`，包和补丁由唯一整合者整合；本包不自行安装正式版本或发布。

测试见实现根 `tests/games`，测试席位明确标注synthetic。规则/Mock通过不等于真实模型、真实宿主或用户验收通过，最终状态以根 `TEST-RESULTS.json` 与回执为准。

## 1.1.4

只改了兼容声明（AI 酱 >= 2.0.4、DSH >= 0.2.1-rc.3），规则和功能和 1.1.3 相同。

Compatibility declarations only (AI Buddy >= 2.0.4, DSH >= 0.2.1-rc.3); rules and features match 1.1.3.

## 1.1.3

沿用本机 1.1.2 的牌桌恢复、语音与字幕同步和音频设置修复，保留大厅与牌桌 BGM、音效及独立音量。斗地主和德州规则、素材、四项权限与 voice-games-v1 合同保持原值。语音需要本体及用户配置；本包不含私人声线或账号。本轮不增加业务行为。

Publishes local 1.1.2 table-recovery, speech/subtitle synchronization and audio-setting fixes, preserving lobby/table music, effects and separate volume controls. Rules, assets, the four permissions and the voice-games-v1 contract are unchanged. Voice requires the host and user configuration; no private voice references or accounts are included. This preparation adds no new runtime behavior.
