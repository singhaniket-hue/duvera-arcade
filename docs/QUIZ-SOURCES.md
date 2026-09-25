# Quiz question provenance

Checked 2026-09-24 against primary sources. Wording, distractors and explanations are original; facts describe general game mechanics, with no Moosher biography or invented inside jokes.

| Primary source | Facts used |
| --- | --- |
| [Minecraft: How to craft](https://www.minecraft.net/en-us/article/how-craft) | Crafting-table planks, inventory grid, wood-to-plank output, buckets and pickaxes |
| [Tetris: About](https://play.tetris.com/about) | Seven standard shapes assembled from four squares |
| [Innersloth: Among Us](https://www.innersloth.com/games/among-us/) | Crew tasks, voting, sabotage and an Impostor's disguise |
| [FIDE Laws of Chess, articles 3.2–3.7](https://handbook.fide.com/chapter/e012023) | Bishop, rook, queen, knight and pawn movement |

`multiplayer/quiz-questions.json` contains ten multiplayer questions; `games/quiz/practice.json` contains ten separate practice questions. Each entry has an ID, question, four distinct options, correct index, explanation and source URL. Automated validation checks these structural requirements; the source review above establishes the factual basis. Neither pack contains trivia about the creator.

The Worker randomizes question and option order. Only the current question and options reach participants before closure. Neither correct indexes, explanations, source URLs nor other participants' selections are sent early. Scores are also held until closure to avoid disclosing correctness through score changes. The multiplayer pack is excluded from `dist/`, and the local server rejects `/multiplayer/` requests. The source repository is public, so this casual private-room quiz does not claim resistance to someone researching the published questions.

Each online question lasts 20 seconds, or closes when all eligible participants answer. A correct answer earns 500 points plus up to 500 based on server-observed response time. The host advances after the explanation, and ten questions produce final standings. Practice can pause; online timers continue in hidden tabs. Ties share the same score and are not resolved by client timing.
