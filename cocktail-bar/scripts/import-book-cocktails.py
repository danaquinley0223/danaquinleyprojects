"""Import cocktail recipes from the three source PDFs into src/data/book-cocktails.json.

Sources (extract each PDF's text to /tmp first):
  - The NoMad Cocktail Book      -> /tmp/nomad.txt     (232 recipes, auto-parsed)
  - Seedlip: Cocktails at Home   -> /tmp/seedlip.txt   (30 non-alcoholic, auto-parsed)
  - COCKTAIL-RECIPES.pdf         -> hand-curated below (26 classics)

Text extraction (requires `pip install pymupdf`):
    python -c "import fitz; d=fitz.open('<pdf>'); \
        open('/tmp/<name>.txt','w').write(chr(10).join(p.get_text() for p in d))"

Then run:  python scripts/import-book-cocktails.py

Recipes are categorised by base spirit/type; any name that collides with an
existing IBA cocktail (or another book recipe) is kept as a distinct variant,
e.g. "Margarita (NoMad)".
"""
import re, json

# ---------- shared helpers ----------
FRAC = {'¼':'1/4','½':'1/2','¾':'3/4','⅓':'1/3','⅔':'2/3','⅛':'1/8','⅜':'3/8','⅝':'5/8','⅞':'7/8'}
def ascii_qty(s):
    out=[]
    for ch in s:
        if ch in FRAC:
            if out and out[-1].isdigit(): out.append(' ')
            out.append(FRAC[ch])
        else:
            out.append(ch)
    return re.sub(r'\s+',' ',''.join(out)).strip()

SMALL={'and','or','the','of','in','a','an','on','to','with','for','de','et','la','le','el'}
def titlecase(s):
    s=ascii_qty(s).strip().lower()
    words=s.split()
    out=[]
    for i,w in enumerate(words):
        if i!=0 and w in SMALL:
            out.append(w)
        elif w and (w[0].isalpha()):
            out.append(w[0].upper()+w[1:])
        else:
            # leading punct/digit e.g. "'n'", "8th", "#2"
            m=re.match(r'^([^a-zA-Z]*)([a-zA-Z])(.*)$', w)
            out.append(m.group(1)+m.group(2).upper()+m.group(3) if m else w)
    s=' '.join(out)
    s=re.sub(r'\b(\d+)(St|Nd|Rd|Th)\b', lambda m:m.group(1)+m.group(2).lower(), s)
    s=re.sub(r'/([a-z])', lambda m:'/'+m.group(1).upper(), s)  # N/a -> N/A
    return s

def classify(text):
    t=text.lower()
    def has(*w): return any(re.search(r'\b'+x, t) for x in w)
    if 'seedlip' in t or 'non-alcoholic' in t: return 'Non-Alcoholic'
    if has('mezcal','tequila'): return 'Agave (Tequila / Mezcal)'
    if has('cachaça','cachaca') or re.search(r'\brum\b|\brhum\b|\bron\b', t): return 'Rum / Cane'
    if has('bourbon','rye','scotch') or re.search(r'\bwhisk(e)?y\b', t): return 'Whiskey'
    if re.search(r'\bgin\b', t): return 'Gin'
    if re.search(r'\bvodka\b', t): return 'Vodka'
    if has('cognac','armagnac','calvados','pisco','brandy','grappa','eau de vie','eau-de-vie'): return 'Brandy'
    if has('aquavit','akvavit'): return 'Aquavit'
    if has('aperol','campari','rabarbaro','amaro','averna','cynar','fernet','suze','gentian','aperitivo','bonal','becherovka'): return 'Aperitivo / Amaro'
    if has('sherry','port ','madeira','vermouth','lillet','cocchi','quinquina','americano','barolo','caperetif','dubonnet'): return 'Fortified Wine'
    if has('champagne','prosecco','sparkling','cava',r'\bwine\b','sake'): return 'Sparkling / Wine'
    return 'Other / Low-ABV'

UNITS=['ounces','ounce','dashes','dash','drops','drop','teaspoons','teaspoon','tablespoons','tablespoon',
       'barspoons','barspoon','bar spoon','cups','cup','pieces','piece','sprigs','sprig','leaves','leaf',
       'slices','slice','wedges','wedge','bottles','bottle','splashes','splash','parts','part','pinch','pinches','stalk','stalks']
QTY_START=re.compile(r'^[\d¼½¾⅓⅔⅛⅜⅝⅞]')
QUAL=re.compile(r'^(Scant|Heaping|Heavy|Light|Barely|Generous|About|A scant|A heaping)\s+(?=[\d¼½¾⅓⅔⅛⅜⅝⅞])', re.I)
# trailing annotations that mark an ingredient/garnish line (kept narrow so prose isn't matched)
ING_ANNOT=re.compile(r',\s*(for\s+(garnish|rimming|muddling|the\s+rim|spritzing|flaming)'
                     r'|as\s+(a\s+)?(rinse|needed|garnish|float)|to\s+(top|taste|finish|rinse|float))', re.I)

def is_ing(s):
    return bool(QTY_START.match(s) or QUAL.match(s) or ING_ANNOT.search(s))

# words a NoMad method paragraph begins with (used to split ingredients from method)
METHOD_VERBS={'In','Combine','Fill','Add','Use','Using','Muddle','Wrap','Pour','Build','Stir',
 'Shake','Strain','Express','Rinse','Spray','Run','Moisten','Place','Float','Top','Garnish',
 'Whip','Swizzle','Dry','Prime','Pack','Squeeze','Roll','Drop','Char','Flame','Light','With',
 'Carefully','Gently','Once','Layer','Serve','Skewer','Cut','Grate','Shave','Wipe','Twist','For',
 'Heat','Pinch','Smack','Spoon','Make','Brew','Chill','Measure','Set','Hold','Take','Crack','Wash',
 'Spritz','Divide','Swab','Insert','Mound','Coat','Line','Tuck','Fold','Sprinkle','Press','Scoop',
 'Warm','Bring','Steep','Be','Without','Hollow','Halve','Peel','Slice','Slap','Snap','Spin','Rim','Hold'}
def is_method_start(s):
    w=s.split()
    if not w or is_ing(s): return False
    return w[0] in METHOD_VERBS or (len(s)>55 and s[:1].isupper())

def split_measure(full):
    full=QUAL.sub('', full.strip())
    m=re.match(r'^([\d¼½¾⅓⅔⅛⅜⅝⅞][\d¼½¾⅓⅔⅛⅜⅝⅞\s./-]*?)\s+(.*)$', full)
    if not m:
        return ('','',clean_name(full))
    qty=ascii_qty(m.group(1)); rest=m.group(2).strip(); unit=''; name=rest; low=rest.lower()
    for u in UNITS:
        if low.startswith(u+' '): unit=u; name=rest[len(u):].strip(); break
        if low==u: unit=u; name=''; break
    return (qty,unit,clean_name(name))

def clean_name(name):
    name=re.sub(r'\(this page\)','',name,flags=re.I)
    name=name.split(',')[0]
    return re.sub(r'\s+',' ',name).strip().rstrip('.')

# ---------- NoMad ----------
def parse_nomad():
    lines=open('/tmp/nomad.txt').read().split('\n'); n=len(lines)
    def nne(i):
        j=i+1
        while j<n and not lines[j].strip(): j+=1
        return j
    def is_title(s):
        s=s.strip()
        if not s or s.startswith('====='): return False
        letters=[c for c in s if c.isalpha()]
        return len(letters)>=2 and all(c.upper()==c for c in letters)
    starts=[i for i,l in enumerate(lines) if is_title(l) and nne(i)<n and lines[nne(i)].strip().startswith('GLASS:')]
    starts.append(n); out=[]
    def is_caps_heading(s):
        # an ALL-CAPS line (other than a batch "SERVES N" note) — marks the start of the
        # book's Basics appendix or trailing sections, which must not leak into a method
        s=s.strip()
        if re.match(r'^(SERVES|MAKES)\b', s): return False
        letters=[c for c in s if c.isalpha()]
        return len(letters)>=5 and all(c.isupper() for c in letters)
    for k in range(len(starts)-1):
        block=[b.rstrip() for b in lines[starts[k]:starts[k+1]] if not b.strip().startswith('=====')]
        cut=next((bi for bi in range(1,len(block)) if is_caps_heading(block[bi])), None)
        if cut is not None: block=block[:cut]
        title=block[0].strip(); glass=''
        body=[]
        for b in block[1:]:
            s=b.strip()
            if not s: continue
            if s.startswith('GLASS:'): glass=s[6:].strip(); continue
            if s.startswith('ICE:'): continue
            if s.startswith('CREATOR:'): continue
            if re.match(r'^(SERVES|MAKES)\b', s): continue
            body.append(s)
        first=next((i for i,s in enumerate(body) if is_ing(s)), None)
        if first is None: continue
        header=body[:first]
        rest=body[first:]
        mstart=next((i for i,s in enumerate(rest) if is_method_start(s)), len(rest))
        ing_region=rest[:mstart]; meth=rest[mstart:]
        # re-join lines that wrapped across the PDF line break (continuations)
        ing=[]
        for s in ing_region:
            prev=ing[-1].rstrip() if ing else ''
            lastword=prev.split()[-1].lower() if prev.split() else ''
            cont = ing and (s[:1].islower() or lastword in ('for','the','and') or prev.endswith((',','-','(this')))
            if cont:
                ing[-1]=prev+' '+s.strip()
            else:
                ing.append(s)
        flavor=header[-1] if header else ''
        ingredients=[]; garnish=[]
        for s in ing:
            if re.search(r'\bfor\s+(garnish|rimming)\b',s,re.I) and 'muddling' not in s.lower():
                garnish.append(re.sub(r',?\s*for\s+(garnish|rimming).*$','',s,flags=re.I).strip()); continue
            q,u,name=split_measure(s)
            if not name: continue
            ingredients.append({'ingredient':name,'measure':ascii_qty((q+' '+u).strip())})
        cat=classify(flavor+' '+' '.join(i['ingredient'] for i in ingredients))
        out.append({'name':titlecase(title),'category':cat,
                    'alcoholic':'Non-Alcoholic' if cat=='Non-Alcoholic' else 'Alcoholic',
                    'glass':glass,'source':'NoMad','garnish':'; '.join(g for g in garnish if g),
                    'method':' '.join(meth).strip(),'ingredients':ingredients[:15]})
    return out

# ---------- Seedlip ----------
def despace(line):
    parts=re.split(r' {2,}', line.strip())
    return ' '.join(p.replace(' ','') for p in parts if p.strip())
def is_spaced(line):
    toks=[t for t in line.strip().split(' ') if t]
    if len(toks)<3: return False
    return sum(1 for t in toks if len(t)==1)/len(toks)>0.55
def dline(line):
    return despace(line) if is_spaced(line) else line.strip()

def parse_seedlip():
    pages=open('/tmp/seedlip.txt').read().split('===== PAGE')
    out=[]
    MARK={'INGREDIENTS','GLASS & GARNISH','METHOD','COCKTAIL INSPIRATION'}
    for pg in pages:
        raw=[l for l in pg.split('\n')
             if l.strip() and '=====' not in l and not re.fullmatch(r'\d+', l.strip())]
        if not raw: continue
        tl=[dline(l) for l in raw]
        norm=[re.sub(r'\s+',' ',t).upper().replace(' & ',' & ') for t in tl]
        if 'INGREDIENTS' not in norm: continue
        # title = lines before "BY ..."
        by_idx=next((i for i,t in enumerate(norm) if t.startswith('BY ')), None)
        if by_idx is None: continue
        title=titlecase(' '.join(tl[:by_idx]))
        def find(label): return next((i for i,t in enumerate(norm) if t==label), None)
        i_ing=find('INGREDIENTS'); i_gl=find('GLASS & GARNISH'); i_me=find('METHOD')
        i_ci=find('COCKTAIL INSPIRATION')
        end=len(raw)
        # ingredient content lines are the ORIGINAL (non-spaced) lines
        ing_lines=raw[i_ing+1:i_gl]
        ingredients=[]
        for s in ing_lines:
            s=s.strip()
            if ':' not in s: continue
            name,amt=s.split(':',1)
            name=re.sub(r'\s*\(see page \d+\)','',name,flags=re.I).strip()
            amt=amt.strip()
            # drop the metric half of dual measures, e.g. "2 oz / 60 ml" -> "2 oz"
            amt=re.sub(r'\s*/\s*[\d.]+\s*ml\b.*$','',amt, flags=re.I)
            ingredients.append({'ingredient':name,'measure':ascii_qty(amt)})
        gl=raw[i_gl+1:i_me]; glass=gl[0].strip() if gl else ''
        garnish='; '.join(x.strip() for x in gl[1:]) if len(gl)>1 else ''
        meth_end=i_ci if i_ci is not None else end
        meth=[x.strip() for x in raw[i_me+1:meth_end] if not re.match(r'^\d+$',x.strip())]
        out.append({'name':title,'category':'Non-Alcoholic','alcoholic':'Non-Alcoholic',
                    'glass':glass,'source':'Seedlip','garnish':garnish,
                    'method':' '.join(meth).strip(),'ingredients':ingredients[:15]})
    return out

# ---------- Classics (hand-curated from COCKTAIL-RECIPES.pdf; clean canonical ingredients) ----------
def _ing(spec):
    return [{'ingredient':name,'measure':(qty+' '+unit).strip()} for qty,unit,name in spec]

CLASSICS=[
 ('French 75','Collins',[('2','oz','Gin'),('1','tsp','Superfine Sugar'),('1/2','oz','Lemon Juice'),('1/2','oz','Simple Syrup'),('5','oz','Brut Champagne')],'Lemon twist',
  'Shake all the ingredients except the Champagne with cracked ice. Strain into a chilled Collins glass or flute, top off with Champagne, and garnish with a lemon twist.'),
 ('Aviation','Coupe',[('1 1/2','oz','Gin'),('1/2','oz','Lemon Juice'),('3/4','oz','Maraschino Liqueur'),('1/4','oz','Crème de Violette')],'Maraschino cherry',
  'Add the gin, lemon juice, maraschino liqueur and crème de violette to a shaker with ice. Shake until well chilled and strain into a coupe. Garnish with a maraschino cherry.'),
 ('Gimlet','Cocktail',[('2','oz','Gin'),('1/2','oz','Lime Juice'),('1/2','oz','Simple Syrup')],'Lime wheel',
  'Pour all the ingredients into a shaker filled with ice. Shake and strain into a chilled cocktail glass. Garnish with a lime wheel.'),
 ('Gin & Tonic','Highball',[('2','oz','Gin'),('4','oz','Tonic Water'),('1/2','oz','Lemon Juice')],'Lemon slice',
  'Add the gin and lemon to a glass filled with ice. Top with tonic water and stir gently. Garnish with a slice of lemon and serve immediately.'),
 ('Martini','Cocktail',[('2 1/2','oz','Gin'),('1/2','oz','Dry Vermouth')],'Olive or lemon twist',
  'Pour the ingredients into a mixing glass filled with ice and stir. Strain into a chilled cocktail glass. Garnish with an olive or a lemon twist.'),
 ('Tom Collins','Collins',[('2','oz','Gin'),('1','tsp','Superfine Sugar'),('1/2','oz','Lemon Juice'),('3','oz','Club Soda')],'Lemon slice and maraschino cherry',
  'Shake the gin, sugar and lemon juice with ice until chilled. Strain into a Collins glass filled with ice and top with club soda. Garnish with a lemon slice and a maraschino cherry.'),
 ('White Lady','Cocktail',[('2','oz','Gin'),('1/2','oz','Cointreau'),('1/2','oz','Lemon Juice'),('1','','Egg White')],'Lemon peel',
  'Add all the ingredients to a shaker and dry-shake without ice. Add ice and shake again until chilled. Strain into a chilled cocktail glass and garnish with a lemon peel.'),
 ('Blue Hawaii','Highball',[('3/4','oz','Light Rum'),('3/4','oz','Vodka'),('1/2','oz','Blue Curaçao'),('3','oz','Pineapple Juice'),('1','oz','Sweet and Sour Mix')],'Pineapple slice',
  'Add all the ingredients to a shaker with ice and shake well. Pour into a tall glass and garnish with a slice of pineapple.'),
 ('Caipirinha','Old Fashioned',[('2','oz','Cachaça'),('1','','Lime'),('2','tsp','Sugar')],'Lime wedges',
  'Cut the lime into wedges and place in an old-fashioned glass with the sugar. Muddle well, fill with ice, pour in the cachaça, and stir.'),
 ('Daiquiri','Coupe',[('2','oz','White Rum'),('1','oz','Lime Juice'),('3/4','oz','Simple Syrup')],'Lime wheel',
  'Add all the ingredients to a shaker filled with ice. Shake well and strain into a chilled coupe.'),
 ('Mai Tai','Old Fashioned',[('1 1/2','oz','Dark Rum'),('1','oz','White Rum'),('1/2','oz','Lime Juice'),('1/2','oz','Orange Curaçao'),('1/2','oz','Orgeat Syrup')],'Pineapple wedge and maraschino cherry',
  'Shake the white rum, orange curaçao, orgeat and lime juice with cracked ice. Strain into a glass filled with ice and float the dark rum on top. Garnish with a pineapple wedge and a maraschino cherry.'),
 ('Mojito','Highball',[('1 1/2','oz','White Rum'),('1','oz','Lime Juice'),('6','','Mint Leaves'),('2','tsp','Sugar'),('3','oz','Soda Water')],'Mint sprig and lime wedge',
  'Gently muddle the mint, lime juice and sugar. Add the rum and stir to dissolve the sugar. Pour into a glass, fill with ice and top with soda water. Garnish with mint and a lime wedge.'),
 ('Piña Colada','Hurricane',[('6','oz','Pineapple Juice'),('2','oz','White Rum'),('1/2','oz','Coconut Cream')],'Pineapple wedge',
  'Pour the coconut cream, pineapple juice and rum into a shaker with crushed ice and shake until smooth. Pour into a chilled glass and garnish with a pineapple wedge.'),
 ('Zombie','Highball',[('1','oz','Light Rum'),('1','oz','Dark Rum'),('1','oz','Bacardi 151 Rum'),('1/2','oz','Apricot Brandy'),('1','oz','Lime Juice'),('1','oz','Orange Juice'),('2','dashes','Grenadine')],'Maraschino cherry and orange slice',
  'Shake the light and dark rum, apricot brandy, lime juice and grenadine with ice. Strain into a highball glass filled with cracked ice. Add the orange juice and float the 151 rum on top. Garnish with a cherry and orange slice.'),
 ('Long Island Iced Tea','Highball',[('1/2','oz','Vodka'),('1/2','oz','Gin'),('1/2','oz','Light Rum'),('1/2','oz','Tequila'),('1/2','oz','Triple Sec'),('1 1/2','oz','Sweet and Sour Mix'),('1','oz','Cola')],'Lemon wedge',
  'Add all the ingredients except the cola to a shaker with ice. Shake briefly and strain into a tall glass filled with ice. Top with a splash of cola and garnish with a lemon wedge.'),
 ('Margarita','Margarita',[('1 1/2','oz','Tequila'),('1/2','oz','Triple Sec'),('1','oz','Lime Juice')],'Lime wheel and salt rim',
  'Pour all the ingredients into a shaker with ice and shake vigorously. Strain into a salt-rimmed margarita glass and garnish with a slice of lime.'),
 ('Paloma','Highball',[('2','oz','Tequila'),('6','oz','Grapefruit Soda'),('1/2','oz','Lime Juice')],'Grapefruit wedge and salt rim',
  'Fill a salt-rimmed highball glass with ice. Add the tequila and lime juice, then top with grapefruit soda. Garnish with a grapefruit wedge.'),
 ('Tequila Sunrise','Highball',[('2','oz','Tequila'),('4','oz','Orange Juice'),('1/2','oz','Grenadine')],'Orange slice and maraschino cherry',
  'Pour the tequila and orange juice into a tall glass with ice and stir. Slowly pour the grenadine around the inside edge so it sinks. Garnish with an orange slice and a cherry.'),
 ('Bloody Mary','Highball',[('2','oz','Vodka'),('4','oz','Tomato Juice'),('1/2','oz','Lemon Juice'),('2','dashes','Worcestershire Sauce'),('2','dashes','Hot Sauce')],'Celery stalk and lemon wedge',
  'Add all the ingredients to a shaker with ice and shake gently. Strain into an ice-filled glass. Garnish with a celery stalk and a lemon wedge. Season to taste.'),
 ('Cosmopolitan','Cocktail',[('1 1/2','oz','Citrus Vodka'),('1/2','oz','Triple Sec'),('1/2','oz','Cranberry Juice'),('1/2','oz','Lime Juice')],'Orange twist',
  'Fill a shaker with ice. Add the vodka, triple sec, cranberry and lime juice and shake until well chilled. Strain into a chilled cocktail glass and garnish with an orange twist.'),
 ('Kamikaze','Cocktail',[('1','oz','Vodka'),('1','oz','Cointreau'),('1','oz','Lime Juice')],'Lime wedge',
  'Add all the ingredients to a shaker filled with ice. Shake vigorously and strain into a cocktail glass with a few ice cubes. Garnish with a lime wedge.'),
 ('Sex on the Beach','Highball',[('1 1/2','oz','Vodka'),('3/4','oz','Peach Schnapps'),('2','oz','Orange Juice'),('2','oz','Cranberry Juice')],'Orange slice and maraschino cherry',
  'Pour all the ingredients into a shaker filled with ice and shake well. Pour into a highball glass and garnish with an orange slice and a maraschino cherry.'),
 ('John Collins','Collins',[('2','oz','Bourbon'),('1','oz','Lemon Juice'),('1','tsp','Superfine Sugar'),('3','oz','Club Soda')],'Orange slice and maraschino cherry',
  'Combine the bourbon, lemon juice and sugar in a shaker with ice and shake until chilled. Strain into a Collins glass filled with ice, top with club soda and stir. Garnish with an orange slice and a cherry.'),
 ('Sidecar','Cocktail',[('2','oz','Cognac'),('1','oz','Cointreau'),('1','oz','Lemon Juice')],'Orange twist and sugar rim',
  'Add the cognac, Cointreau and lemon juice to a shaker with ice. Shake for about ten seconds and strain into a chilled cocktail glass. Garnish with an orange twist; sugar the rim if desired.'),
 ('Manhattan','Cocktail',[('2','oz','Rye Whiskey'),('1','oz','Sweet Vermouth'),('4','dashes','Angostura Bitters')],'Maraschino cherry',
  'Pour the whiskey, sweet vermouth and bitters into a mixing glass filled with ice. Stir until well chilled, then strain over a maraschino cherry in a chilled cocktail glass.'),
 ('Sangria','Wine',[('26','oz','Dry Red Wine'),('1','oz','Brandy'),('1','tbsp','Sugar'),('2','oz','Orange Juice'),('1','oz','Lemon Juice'),('8','oz','Club Soda')],'Orange and lemon slices',
  'Mix the wine, brandy, sugar and citrus juices in a large pitcher with sliced fruit. Refrigerate for 4 to 8 hours. Just before serving, stir in the club soda and serve over ice in wine glasses.'),
]

def parse_classics():
    out=[]
    for name,glass,spec,garnish,method in CLASSICS:
        ings=_ing(spec)
        out.append({'name':name,'category':classify(' '.join(i['ingredient'] for i in ings)),
                    'alcoholic':'Alcoholic','glass':glass,'source':'Classic','garnish':garnish,
                    'method':method,'ingredients':ings})
    return out

# ---------- merge ----------
def slug(s): return re.sub(r'-+',' ',re.sub(r'[^a-z0-9]+','-',s.lower())).strip().replace(' ','-').strip('-')

import os
DATA=os.path.join(os.path.dirname(__file__), '..', 'src', 'data')

def main():
    nomad=parse_nomad(); seed=parse_seedlip(); classic=parse_classics()
    iba=json.load(open(os.path.join(DATA,'iba-cocktails.json')))
    used={c['name'].lower():'IBA' for c in iba}
    allb=nomad+seed+classic
    pageref=re.compile(r'\s*\((?:see )?(?:this page|page \d+)\)', re.I)
    final=[]
    for r in allb:
        r['method']=pageref.sub('', r['method'])
        r['garnish']=pageref.sub('', r['garnish'])
        base=r['name']; key=base.lower()
        if key in used:
            r['name']=f"{base} ({r['source']})"
            while r['name'].lower() in used:
                r['name']+=' II'
        used[r['name'].lower()]=r['source']
        r['id']=f"book-{slug(r['source'])}-{slug(r['name'])}"
        final.append(r)
    json.dump(final, open(os.path.join(DATA,'book-cocktails.json'),'w'),
              ensure_ascii=False, indent=1)
    from collections import Counter
    print("NoMad:",len(nomad)," Seedlip:",len(seed)," Classics:",len(classic)," TOTAL:",len(final))
    print("by source:",Counter(r['source'] for r in final))
    print("by category:",Counter(r['category'] for r in final))
    print("collisions->variant:",[r['name'] for r in final if r['name'].endswith(')')][:30])
    print("empty ingredients:",[r['name'] for r in final if not r['ingredients']])
    print("empty method:",[r['name'] for r in final if not r['method']])

if __name__=='__main__': main()
