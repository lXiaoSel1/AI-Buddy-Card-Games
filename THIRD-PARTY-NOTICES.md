# Third-party notices

This package's rules and UI are independently implemented for the project rules. No third-party poker engine, bot weights, wallet implementation, Tencent assets, or DouZero source is bundled.

React is provided by the native DSH ModuleLoader at runtime; its existing host licensing applies. The root build tool esbuild is a build dependency and is not shipped as an inference or game runtime.

Rule research references: Poker Tournament Directors Association 2026 rules; Caesars Entertainment WSOP 2026 Live Action rules; kwai/DouZero move generation inspected for attachment boundary comparison. References do not constitute copied implementation or endorsement. DSH package structure follows the existing AI Buddy native bundle format.

Project license is included in LICENSE.md from the frozen baseline.

## Card-table artwork and fonts

The new table, card and effect artwork was generated with the built-in Codex image tool. Character cards use existing AI Buddy character artwork as visual references. See the [host's third-party notices](https://github.com/lXiaoSel1/AI-Buddy/blob/v2.0.4/THIRD_PARTY_NOTICES.md) for the character-specific sources and terms. Reference sources include the [AI Gijinka gallery](https://genderswapai.com/zh-CN/ai-gijinka/gallery) and artwork by [上善](https://www.pixiv.net/users/62155430) and [ZipZipPipe](https://www.pixiv.net/users/18604994). DeepSeek character imagery references the [DeepSeek Girl desktop pet](https://github.com/f0909172434/dsh-deepseek-girl-pet) under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/). These notices document provenance and applicable upstream terms. They do not certify that every right has been cleared.

The offline fonts are WOFF2 subsets of [Ma Shan Zheng](https://github.com/google/fonts/tree/66285aa2951a3634d74aa447951a8ca7362d3c7d/ofl/mashanzheng) and [ZCOOL QingKe HuangYou](https://github.com/google/fonts/tree/66285aa2951a3634d74aa447951a8ca7362d3c7d/ofl/zcoolqingkehuangyou), both under SIL OFL 1.1. The subset files use the names Buddy Card Brush and Buddy Card Display. The original copyright and license texts are distributed alongside the subsets in `lib/assets/fonts/`.

## Audio

Background tracks (Generated with Suno).

| Bundled track | Suno track ID |
| --- | --- |
| `lobby.ogg` | `229ac723-5270-4ee4-bfaf-cb7d6ce5ee96` |
| `ddz.ogg` | `40155e17-3d4a-4aa7-86e7-a78502041644` |
| `texas.ogg` | `1becd4d7-f673-4eb8-a542-e1bc035c09f3` |
| `tension.ogg` | `c9b43954-4d5b-44c3-af91-c1a1a02e8441` |

| Bundled effect | Source |
| --- | --- |
| `deal.ogg`, `flip.ogg`, `chip.ogg` | Kenney's `card-slide-2`, `card-place-1` and `chip-lay-1` from [54 Casino sound effects](https://opengameart.org/content/54-casino-sound-effects-cards-dice-chips), CC0 |
| `tap.ogg`, `turn.ogg` | Synthesized for this project |
| `landlord.ogg` | Project composition with horn samples from [VSCO 2 Community Edition](https://versilian-studios.com/vsco-community/), CC0 |
| `plane.ogg` | [Propeller plane by Breviceps](https://freesound.org/people/Breviceps/sounds/515293/), CC0 |
| `bomb.ogg`, `rocket.ogg` | `bang_03.ogg` and `bang_01.ogg` from rubberduck's [25 CC0 bang / firework SFX](https://opengameart.org/content/25-cc0-bang-firework-sfx), CC0 |
| `spring.ogg` | Project composition with harp samples from [VSCO 2 Community Edition](https://versilian-studios.com/vsco-community/) and Mark Trees samples from the [Versilian Community Sample Library](https://versilian-studios.com/vcsl/), both CC0 |
| `win.ogg`, `lose.ogg` | Project compositions with Steinway B piano samples from the [Versilian Community Sample Library](https://versilian-studios.com/vcsl/), CC0 |

Only the rendered effects are bundled.
