# Task "test": received

The task you started from Stay's feed reached an agent, which read the project and posted this item. Tasks reach agents.

## One thing to look at: the feed's brief and brief.ts disagree

- **The feed's brief** (what an agent gets as the project's brief) is the blank template: "One line on what this is and who it's for.", empty `for`, `audience` and `believe`, and one stage, *First pass*, with the tasks "Write the plan" and "test".
- **`projects/stay/brief.ts` on disk** is the full Stay brief, 134 lines: the logline, audience, the belief, pitch + story, the 5:4 vintage look, your verbatim notes from v7-7 to assembly 23, and the stages Storyboard, Graybox and Build with their gates. It is uncommitted: git's last commit of it is still the one-line `title: "stay"`.

If the app writes its brief over `brief.ts`, the full brief and your notes in it would be lost. I haven't changed either of them.

**What I need from you:** say which one is current. If it's the full brief, I'll commit `brief.ts` as it stands so it's safe, then add "test" to its tasks. If the blank one is right, the full brief can live in another file.
