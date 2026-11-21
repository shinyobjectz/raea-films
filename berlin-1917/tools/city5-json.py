# writes assets/rebuilt/shots5/ID.json for the city table, seconds from the installed mp4
import json, subprocess, pathlib
S = (pathlib.Path(__file__).resolve().parent.parent / 'assets/rebuilt/shots5')
T = [
 ('s5-smoke-aerial','real','an aerial at first light over the Friedrichstadt roofs toward the Gendarmenmarkt domes, coal smoke leaning east','v05 "the winter outside"'),
 ('s5-graybox-aerial','model','the graybox Friedrichstadt, every building at its 1887 height, a slow descending aerial','v06 "drew every building"'),
 ('s5-stream-run','model',"the city's tiles streaming in along Leipziger Strasse as the camera runs east",'v08 "we needed the buildings themselves"'),
 ('rb-dive','real','the dive from high over central Berlin into Leipziger Strasse, finished as film','v09 Hobrecht\'s blocks'),
 ('s5-blocks-aerial','real',"high over the blocks south of Leipziger Strasse, courtyard behind courtyard, a slow crane down",'v09 "one courtyard after another"'),
 ('s5-shops-corner','real','Friedrichstrasse at dusk, the ground-floor shops lit, a slow track along the street','v12 "which shops were on the ground floor"'),
 ('s5-facade-windows','real',"a Friedrichstrasse house front at dusk with lit windows, a slow tilt up the floors",'v12 "who rented the flats above"'),
 ('s5-skyline-dusk','real','the skyline from the south at dusk over miles of roofs, a slow push north','v21 "the city above"'),
 ('s5-roof-copper','real','low over the roofs and chimneys toward the copper domes of the Gendarmenmarkt, a slow lateral','v22 "copper ordered off the roofs"'),
 ('s5-queue','real','the 07:15 bread queue along the house front at the side-street bakery, a slow push','v05 "the people next door"'),
 ('s5-queue-wide','real','the same side street wider, the whole queue along the house fronts, a slow rise','v22 "By December…"'),
 ('s5-wilhelm','real',"Wilhelmstrasse's offices of state by day from across the street, drifting north",'coda'),
 ('s5-ending-walk','real','a walk north up Wilhelmstrasse at dusk past the Foreign Office, people of 1917 walking home','the ending title'),
]
for i, k, w, l in T:
    f = S / f'{i}.mp4'
    if not f.exists(): print('missing', i); continue
    sec = round(float(subprocess.check_output(['/opt/homebrew/bin/ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',str(f)])), 2)
    json.dump({'id': i, 'seconds': sec, 'kind': k, 'what': w, 'line': l}, open(S / f'{i}.json', 'w'), indent=1, ensure_ascii=False)
    print(i, sec, k)
