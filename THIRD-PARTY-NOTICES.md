# Third-party notices

This package's rules and UI are independently implemented for the project rules. No third-party poker engine, bot weights, wallet implementation, Tencent assets, or DouZero source is bundled.

React is provided by the native DSH ModuleLoader at runtime; its existing host licensing applies. The root build tool esbuild is a build dependency and is not shipped as an inference or game runtime.

Rule research references: Poker Tournament Directors Association 2026 rules; Caesars Entertainment WSOP 2026 Live Action rules; kwai/DouZero move generation inspected for attachment boundary comparison. References do not constitute copied implementation or endorsement. DSH package structure follows the existing AI Buddy native bundle format.

Project license is included in LICENSE.md from the frozen baseline.

## Card-table artwork and fonts

The new table, card and effect artwork was generated with the built-in Codex image tool. Character cards use existing AI Buddy character artwork as visual references. See the [host's third-party notices](https://github.com/lXiaoSel1/AI-Buddy/blob/v2.0.4/THIRD_PARTY_NOTICES.md) for the character-specific sources and terms. Reference sources include the [AI Gijinka gallery](https://genderswapai.com/zh-CN/ai-gijinka/gallery) and artwork by [上善](https://www.pixiv.net/users/62155430) and [ZipZipPipe](https://www.pixiv.net/users/18604994). DeepSeek character imagery references the [DeepSeek Girl desktop pet](https://github.com/f0909172434/dsh-deepseek-girl-pet) under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/). These notices document provenance and applicable upstream terms. They do not certify that every right has been cleared.

The offline fonts are WOFF2 subsets of [Ma Shan Zheng](https://github.com/google/fonts/tree/66285aa2951a3634d74aa447951a8ca7362d3c7d/ofl/mashanzheng) and [ZCOOL QingKe HuangYou](https://github.com/google/fonts/tree/66285aa2951a3634d74aa447951a8ca7362d3c7d/ofl/zcoolqingkehuangyou), both under SIL OFL 1.1. The subset files use the names Buddy Card Brush and Buddy Card Display. The original copyright and license texts are distributed alongside the subsets in `lib/assets/fonts/`.
