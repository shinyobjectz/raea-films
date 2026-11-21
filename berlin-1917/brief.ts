import { brief } from "raea/brief";

export default brief({
  title: "Berlin, Winter 1917",
  logline:
    "A documentary built on one photograph from the Berlin sick fund's 1917 housing survey, the porter's flat at Ritterstraße 120, and on one question: could we stand in that room? To answer it, the city around the room is rebuilt from the record.",
  for: "the director",
  audience: "People who like history told from primary sources, and people who make things with code and AI and want to see how far a record can be pushed. Watched with sound, start to finish.",
  believe: "Everything in this film was counted once, by someone in 1917, and anyone can check our city against the record and count it again.",
  mode: ["story"],
  voice:
    "One calm narrator (Fish Audio), five chapters, each one question told in time order: the photograph, finding the house, the neighbours, under the street, the winter and the room. The records speak: the plate's caption is read aloud in translation. Every fact has its source line in docs/narration.md; nothing is claimed that the record doesn't say.",
  sound: "The narration over the song Count You Too, arranged from its stems: the song with its words over the cold open, instrumental mixes under the chapters, the vocals back for the ending. -14 LUFS.",
  look:
    "The records themselves on screen: plates, plans, the address book and the sewer atlas, pinned on one canvas the camera travels over. The city as our 3D model built from them, and as that model finished by AI video, each labelled for what it is.",
  notDoing: [
    "Invented history: rooms the fund never photographed (the salons) are reasoned, not seen, and the film says so whenever you're in one",
    "Residents' names: the 1917 address book's names are never put on a character",
    "Unlabelled AI: every AI-finished shot carries \"Our 3D city, finished by AI video\"",
    "A rush of facts: one question a chapter, sentences joined by cause and time",
  ],
  deliver: [
    {
      name: "Documentary",
      specs: ["16:9, 1920x1080, 24 fps", "9:32", "with sound, -14 LUFS"],
    },
  ],
});
