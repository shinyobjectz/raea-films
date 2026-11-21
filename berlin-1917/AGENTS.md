# Agents

Run `raea context .` here before any work: the taste, this project's brief.ts and script.ts, its look and the guides
its modes need, in the order to read them. Specs are TypeScript (`export default brief({...})` from "raea/brief").

Where files go (docs/layout.feature):

- compositions/: what renders, a registerRoot <Composition> or a default export; versions are NAME-v2.tsx
- components/: what compositions import; every prop is a component whose props animate it
- controllers/: this project's controllers, over the workspace's shared ones by id
- assets/: media in (footage, stills, audio, models, fonts) and the brand kit in assets/brand/
- artifacts/: the small React apps posted to the feed
- out/: renders

The workspace's shared/ holds the same five folders for every project: import them as
`@shared/components/desk`, never by a relative path out of this folder.
