# Berlin, Winter 1917: Could We Stand in That Room? (long cut, narration draft 2)

Rewritten from the analysis of eight real documentaries (how-docs-are-written.md), after the director's note that draft 1 "just moves so quickly":

- It has five chapters of 1½–2 minutes instead of nine short ones. Each chapter is one question, told in time order.
- It opens on the room as a scene, then why the fund took the picture.
- The record speaks: the caption is read aloud in translation.
- Sentences are joined by cause and time. Short ones are kept for turns and montage.
- Each chapter ends on a turn that the next one picks up.

Every fact is draft 1's, with its source line (prose.md). Nothing new is claimed.

**Length:** 1,263 words in 27 paragraphs. The median sentence is 13.5 words, and 12% of sentences have 6 words or fewer (draft 1 had 9 and 24%; the documentaries have 11–19 and 2–22%). Fish voice A reads it at about 160 words a minute, inside the documentaries' range of 136–200. That's about 8 minutes of voice, so with the cold open and the held moments the film runs about 9 minutes. To bring it to 8, cut chapter 3's Ritterstraße 124 paragraph and chapter 4's privy paragraph.

*Italic notes* say what's on screen. **Src** says where each fact comes from (G/ is this folder). A few Src lines point to working notes of the larger project that aren't in this folder: interiors/SYSTEM.md, research/period.md, research/scenes.md, research/survey.md, research/refs/cards.json, research/districts/ and plan.org. The records they cite are listed in ASSETS.md and map/SOURCES.md.

---

## Cold open (0:00–0:50): no narration

*The song's first verse over the city and its rooms, cut on the downbeats. It ends on the song's stop and a black frame.*

## 1. The photograph (0:50–2:35)

*Black. A flash. The plate of the Stube at Ritterstraße 120 fades up, sideways as it's printed, and turns upright.*

> [calm] On the eighteenth of October, nineteen seventeen, a photographer climbed an iron spiral stair in the side wing of a house in Ritterstrasse. At the top were two low rooms, built over a horse stable, and in them lived a sick woman of sixty-seven and her husband. The flash went off, and the room was caught exactly as it was that day.

**Src:** G/research/rooms.tsv:131; flash plates, G/interiors/SYSTEM.md:600; date, G/research/scenes.md:7.

> The photographer worked for the city's health insurance fund, and under the picture, the fund printed what it found. [soft tone] The sick woman of sixty-seven lives with her husband in a room and a small chamber, above a horse stable, reached by an iron spiral stair. She has lived in this porter's flat for fifteen years. Length, three metres ninety. Width, three metres. Height, one metre eighty.

**Src:** the caption of z2_1917_MP_0075, translated (G/research/rooms.tsv:131). *The Fraktur caption under the plate, each line lit as it's read. On screen: Ortskrankenkasse.*

> The fund wasn't taking pictures for an album. Between nineteen-oh-one and nineteen twenty, it went into the homes of its sick members, again and again, because it wanted to show the city how housing was making people ill. It photographed cellars, attics and kitchens with beds in them, and under nearly every picture, it wrote down the size of the room.

**Src:** G/research/interiors.md:15-21; kitchens with beds, G/research/survey-tally.tsv:46-50. *Other plates, slowly, one after another.*

> More than a hundred years later, we found that photograph among a library's scans, and it raised a question we couldn't put down. [break] Could we stand in that room? Not look at it in a book, but stand inside it, under that ceiling, by that small window.

*Hold on the plate. Two seconds of the song alone.*

> To stand in it, we'd have to rebuild everything the photograph leaves out: the house around it, the people next door, the pipes beneath it and the winter outside. And first, we'd have to find out where it stood.

*Title over the plate: BERLIN, WINTER 1917. Under it: COULD WE STAND IN THAT ROOM?*

## 2. Finding the house (2:35–4:20)

*The 1910 plan, scanned; a slow push through its sheets.*

> Our way in was a map. In nineteen ten, Straube's plan of Berlin drew every building in the city, at one to four thousand, with the street names of the day. And it turned out to be nearly a picture of nineteen seventeen, because in the years between, Berlin all but stopped building.

**Src:** G/research/period.md:11; G/map/SOURCES.md:39; G/research/period.md:15-16.

> In nineteen thirteen, the city finished four thousand five hundred and nineteen new homes. By nineteen sixteen, with the war on, it finished fifty-three, and in nineteen eighteen, only thirteen. So the city on the plan is, very nearly, the city in the photograph.

**Src:** G/research/period.md:15-16 (checked against Kholodilin, DIW DP 1477). *The housing chart from v3, the bars falling as they're said.*

> A scan is only a picture of a map, though, and we needed the buildings themselves. So we taught a small neural network to read the plan. It learned from twelve tiles, and then we tested it on three it had never seen, where it got eighty-six pixels in every hundred right.

**Src:** G/research/map-p0.md:24-32. *The network's read painting over a test tile.*

> The plan also showed us what kind of house we were looking for. Hobrecht's plan of eighteen sixty-two had laid out very large blocks, and builders filled them with tenements. There was a front building on the street, then side wings and rear buildings, around one courtyard after another.

**Src:** G/research/survey.md:78-80. *The plan rising into our model, down into one block.*

> Every part of that house had its class. The best flat was one floor up at the front, with five to eight rooms. Above it lived clerks, craftsmen and widows, and in the wings and at the back, whole families lived in a room and a kitchen, often with a lodger. The poorest were in the cellars and under the roof. Our woman lived in the side wing, one flight up, over the horses.

**Src:** G/research/interiors.md:45-57; G/research/rooms.tsv:131. *A cutaway down through the floors, front to back, ending on the stable door and the iron stair.*

> We knew now where she lived, and roughly how. What we didn't know was who lived around her.

## 3. The neighbours (4:20–6:15)

> Every year, Berlin's address book listed the city house by house: who owned each building, which shops were on the ground floor, and who rented the flats above. The volume for nineteen seventeen is printed in Fraktur, eight narrow columns to a page. The library's own text of it was closed to us, and ordinary text recognition got too many house numbers wrong. So we had Claude read the pages, one column at a time, for about five cents a column.

**Src:** G/map/SOURCES.md:53; G/plan.org:1969-1971 (the ZLB's full text refused, 403); G/tools/addr/columns.ts:1; G/tools/addr/transcribe.ts:1-3; G/research/replicate.md:236-237. *Pages turning; a column scrolling, its entries typing out beside it.*

> We haven't reached Ritterstrasse in the book yet. But the fund had been on the same street five years before. At number one hundred and twenty-four, in nineteen twelve, it found a man, his wife and two children in a single room with no heating at all. The room was also a workshop for ready-made clothes, and they cooked on a paraffin stove.

**Src:** G/interiors/CITY.md:6-7 (streets read); G/research/refs/cards.json:95. *The 1912 plate.*

> The fund's photographs gave us a hundred and twenty-seven rooms like that, and they became our way of furnishing the city. For each one, we read the caption first and built the walls to its measurements. Then we traced the furniture from the photograph, wall by wall. Lace curtains hang even in the poorest rooms, and in nine of the fifteen kitchens we counted, someone sleeps.

**Src:** G/research/survey-tally.tsv:1-3, 46-50; G/interiors/SYSTEM.md:590-604; G/research/interiors.md:61-85. *A plate beside our render of it; the loft set built up wall by wall.*

> And the walls told you who lived there. [break] Lassalle, or Marx, in a worker's flat. The Kaiser and a map of the front, in an official's. The Black Madonna, for Polish Catholics. And in a house at war, a frame with a black ribbon.

**Src:** G/interiors/plan/identity.ts:43; G/interiors/plan/dress.ts (~70-182). *Montage, one wall per line, on the beat.*

> The fund never photographed the rich, though, so there's no dated photograph of a salon. Those rooms are reasoned, not seen, and the film tells you so whenever you're in one.

**Src:** G/research/interiors.md:42, 226-227. *rooms/salon, captioned "reasoned, not photographed".*

> And beneath every one of these houses, out of sight, ran another city.

## 4. Under the street (6:15–7:20)

> Today's sewer maps aren't public, so we couldn't simply look the network up. What we found instead was an atlas from eighteen eighty-four: James Hobrecht's plan of Berlin's sewers, in fifty-seven plates. As far as we know, those plates are the only drawn plan of the old network.

**Src:** G/research/survey.md:66, 107-108; G/map/SOURCES.md:48. *The atlas plates; Blatt 4.*

> So we traced one of its systems by hand, the one under our part of the city. It's fifty-six point four kilometres long, mostly clay pipe, and the big sewers are brick, built in the shape of an egg, the largest of them two metres high. All of it ran down to a pumping station on the canal at Hallesches Ufer, and that station's chimney, forty-three point one metres tall, is still standing.

**Src:** G/map/SOURCES.md:29; G/research/replicate.md:104; G/plan.org:2380-2385, 342-347. *The trace drawn over Blatt 4; then walking the egg-profile sewer; the pumping station and its chimney.*

> Inside the houses, though, the modern city arrived slowly. Even in nineteen twenty-two, when the fund surveyed nine thousand four hundred tenants, more than half were still using a toilet on the landing, or a privy in the yard.

**Src:** G/interiors/kit/privy.ts:1-4. *A courtyard privy; a half-landing door.*

> And the autumn the photograph was taken, the city above all of it was going into its fourth winter of war.

## 5. The winter, and the room (7:20–8:45)

*Dusk on Leipziger Straße; the war kitchen.*

> That year, the war reached into people's homes. In March, copper was ordered off the roofs. In June, brass and copper were taken from people's homes. Coal was short, and it was rationed. The city ran public kitchens, where a portion was mostly swede. By December, they were serving between a hundred and sixty and a hundred and seventy thousand portions a day.

**Src:** G/research/weathering-1917.md ("Copper seized": KRA notices of 9 March and 20 June 1917); G/research/interiors.md:139; G/interiors/kit/warkitchen.ts:1-3; G/research/districts/report-perplexity-1117.md:1115.

> You can see that winter in the second photograph from the porter's flat. The old tiled range in the cooking room had fallen apart, and someone had pushed a small iron stove into it. A washing line runs across the room, under a ceiling of planks.

**Src:** G/research/rooms.tsv:132; G/research/catalogue.md:358, 447. *The second plate, the Kochraum.*

*Up the iron stair, into the loft (rb-loft, made real), pushing in slowly. The song's low section. Four seconds with no voice.*

> So we went back up the iron stair, with everything we'd found. Two windows, each eighty centimetres by fifty. A ceiling one metre eighty from the floor. And a woman of sixty-seven who had lived here for fifteen years, and whose name the caption doesn't give.

**Src:** G/research/rooms.tsv:131.

> [moved] Could we stand in that room? [break] We can. Just.

*Hold. The song's last verse: "When the morning bell rings through …"*

> Everything in this film was counted once, by someone in nineteen seventeen. The fund counted the rooms, and the people in them. The address book counted the houses. All we did was count them back in.

*"We'll count again, and count you too." Title: BERLIN, WINTER 1917 / REBUILT FROM THE RECORD.*

> Every asset we made is open source, so anyone can check our city against the record, and count it again.

*Coda: EVERY ASSET OPEN SOURCE, CHECK IT AGAINST THE RECORD, credits.*
