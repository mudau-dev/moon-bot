const styles = {
  1: { name: "Circled", map: "ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏ" },
  2: { name: "Negative Circled", map: "🅐🅑🅒🅓🅔🅕🅖🅗🅘🅙🅚🅛🅜🅝🅞🅟🅠🅡🅢🅣🅤🅥🅦🅧🅨🅩🅐🅑🅒🅓🅔🅕🅖🅗🅘🅙🅚🅛🅜🅝🅞🅟🅠🅡🅢🅣🅤🅥🅦🅧🅨🅩" },
  3: { name: "Fullwidth", map: "ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ" },
  4: { name: "Bold", map: "𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙" },
  5: { name: "Fraktur Bold", map: "𝖆𝖇𝖈𝖉𝖊𝖋𝖌𝖍𝖎𝖏𝖐𝖑𝖒𝖓𝖔𝖕𝖖𝖗𝖘𝖙𝖚𝖛𝖜𝖝𝖞𝖟𝕬𝕭𝕮𝕯𝕰𝕱𝕕𝕳𝕴𝕵𝕶𝕷𝕸𝕹𝕺𝕻𝕼𝕽𝕾𝕿𝖀𝖁𝖂𝖃𝖄𝖅" },
  6: { name: "Bold Italic", map: "𝒂𝒃𝒄𝒅𝒆𝒇𝒈𝒉𝒊𝒋𝒌𝒍𝒎𝒏𝒐𝒑𝒒𝒓𝒔𝒕𝒖𝒗𝒘𝒙𝒚𝒛𝑨𝑩𝑪𝑫𝑬𝑭𝑮𝑯𝑰𝑱𝑲𝑳𝑴𝑵𝑶𝑷𝑸𝑹𝑺𝑻𝑼𝑽𝑾𝑿𝒀𝒁" },
  7: { name: "Script Bold", map: "𝓪𝓫𝓬𝓭𝓮𝓯𝓰𝓱𝓲𝓳𝓴𝓵𝓶𝓷𝓸𝓹𝓺𝓻𝓼𝓽𝓾𝓿𝔀𝔁𝔂𝔃𝓐𝓑𝓒𝓓𝓔𝓕𝓖𝓗𝓘𝓙𝓚𝓛𝓜𝓝𝓓𝓟𝓠𝓡𝓢𝓣𝓤𝓥𝓦𝓧𝓨𝓩" },
  8: { name: "Double Struck", map: "𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ" },
  9: { name: "Monospace", map: "𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝚗𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉" },
  10: { name: "Sans Serif", map: "𝖺𝖻𝖼𝖽𝖾𝖿𝗀𝗁𝗂𝗃𝗄𝗅𝗆𝗇𝗈𝗉𝗊𝗋𝗌𝗍𝗎𝗏𝗐𝗑𝗒𝗓𝖠𝖡𝖢𝖣𝖤𝖥𝖦𝖧𝖨𝖩𝖪𝖫𝖬𝖭𝖮𝖯𝖰𝖱𝖲𝖳𝖴𝖵𝖶𝖷𝖸𝖅" },
  11: { name: "Sans Bold", map: "𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭" },
  12: { name: "Sans Bold Italic", map: "𝙖𝙗𝙘𝙙𝙚𝙛𝙜𝙝𝙞𝙟𝙠𝙡𝙢𝙣𝙤𝙥𝙦𝙧𝙨𝙩𝙪𝙫𝙬𝙭𝙮𝙯𝘼𝘽𝘾𝘿𝙀𝙁𝙂𝙃𝙄𝙅𝙆𝙇𝙈𝙉𝙊𝙋𝙌𝙍𝙎𝙏𝙐𝙑𝙒𝙓𝙔𝙕" },
  13: { name: "Sans Italic", map: "𝘢𝘣𝘤𝘥𝘦𝘧𝘨𝘩𝘪𝘫𝘬𝘭𝘮𝘯𝘰𝘱𝘲𝘳𝘴𝘵𝘶𝘷𝘸𝘹𝘺𝘻𝘈𝘉𝘊𝘋𝘌𝘍𝘎𝘏𝘐𝘑𝘒𝘓𝘔𝘕𝘖𝘗𝘘𝘙𝘚𝘛𝘜𝘝𝘞𝘟𝘠𝘡" },
  14: { name: "Parenthesized", map: "⒜⒝⒞⒟⒠⒡⒢⒣⒤⒥⒦⒧⒨⒩⒪⒫⒬⒭⒮⒯⒰⒱⒲⒳⒴⒵ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏ" },
  15: { name: "Regional", map: "🇦🇧🇨🇩🇪🇫🇬🇭🇮🇯🇰🇱🇲🇳🇴🇵🇶🇷🇸🇹🇺🇻🇼🇽🇾🇿🇦🇧🇨🇩🇪🇫🇬🇭🇮🇯🇰🇱🇲🇳🇴🇵🇶🇷🇸🇹🇺🇻🇼🇽🇾🇿" },
  16: { name: "Squared", map: "🄰🄱🄲🄳🄴🄵🄶🄷🄼🄹🄺🄻🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉🄰🄱🄲🄳🄴🄵🄶🄷🄸🄹🄺🄻🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉" },
  17: { name: "Negative Squared", map: "🅰🅱🅲🅳🅴🅵🅶🅷🅸🅹🅺🅻🅼🅽🅾🅿🆀🆁🆂🆃🆄🆅🆆🆇🆈🆉🅰🅱🅲🅳🅴🅵🅶🅷🅸🅹🅺🅻🅼🅽🅾🅿🆀🆁🆂🆃🆄🆅🆆🆇🆈🆉" },
  18: { name: "Moonlight", map: "𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳𝚨𝚩𝚪𝚫𝚬𝚭𝚮𝚯𝚰𝚱𝚲𝚳𝚴𝚵𝚶𝚷𝚸𝚹𝚺𝚻𝚼𝚽𝚾𝚿𝛀" },
  19: { name: "Accents", map: "áвćđéғɢнíĵĸĺмńőpǫŕśтúvwхýźÁBĆĐÉFɢнíĵĸĺмńőpǫŕśтúvwхýź" },
  20: { name: "Japanese", map: "ﾑ乃cd乇ｷgんﾉﾌズﾚﾼ刀oｱq尺丂ｲu√wﾒﾘ乙ﾑ乃cd乇ｷgんﾉﾌズﾚﾼ刀oｱq尺丂ｲu√wﾒﾘ乙" },
  21: { name: "Curvy", map: "αв¢∂єƒgнιנкℓмησρqяѕтυνωχуչαв¢∂єƒgнιנкℓмησρqяѕтυνωχуչ" },
  22: { name: "Greek", map: "αвcδεfghιjκlмηορqrѕτυvωxψzαвcδεfghιjκlмηορqrѕτυvωxψz" },
  23: { name: "Thai", map: "ค๒ς๔єŦﻮђเןкɭ๓ภ๏קợгรՇยงฬאץչค๒ς๔єŦﻮђเןкɭ๓ภ๏קợгรՇยงฬאץչ" },
  24: { name: "Russian", map: "авсdеfgніјкlmпорqгsтцvшхуzАвсdеfgніјкlmпорqгsтцvшхуz" },
  25: { name: "Ethiopic", map: "ልጌርዕቿቻፏዘጎጕረጠክዐየዒዪነፕሁሀሠሸሃጊልጌርዕቿቻፏዘጎጕረጠክዐየዒዪነፕሁሀሠሸሃጊ" },
  26: { name: "Fraktur", map: "𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷𝔄𝔅ℭ𝔇𝔈𝔉𝔊ℌℑ𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔ℜ𝔖𝔗𝔘𝔙𝔚𝔛𝔜ℨ" },
  27: { name: "Diacritic", map: "äḅċďëḟġḧïjḳḷṃṅöṗqṛṡẗüṿẅẍÿżÄḄĊĎËḞĠḦÏJḲḶṂṄÖṖQṚṠẗÜṿẅẍÿż" },
  28: { name: "Small Caps", map: "ᴀʙᴄᴅᴇғɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢᴀʙᴄᴅᴇғɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢ" },
  29: { name: "Strikethrough", map: "a̸b̸c̸d̸e̸f̸g̸h̸i̸j̸k̸l̸m̸n̸o̸p̸q̸r̸s̸t̸u̸v̸w̸x̸y̸z̸A̸B̸C̸D̸E̸F̸G̸H̸I̸J̸K̸L̸M̸N̸O̸P̸Q̸R̸S̸T̸U̸V̸W̸X̸Y̸Z̸" },
  30: { name: "Subscript", map: "ₐ♭cdₑfgₕᵢⱼₖₗₘₙₒₚqᵣₛₜᵤᵥwₓyzₐ♭cdₑfgₕᵢⱼₖₗₘₙₒₚqᵣₛₜᵤᵥwₓyz" },
  31: { name: "Superscript", map: "ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖqʳˢᵗᵘᵛʷˣʸᶻᴬᴮᶜᴰᴱᶠᴳᴴᴵᴶᴷᴸᴹᴺᴼᴾQᴿˢᵀᵁⱽᵂˣʸᶻ" },
  32: { name: "Upside Down", map: "ɐqɔpǝɟƃɥıɾʞןɯuodbɹsʇnʌʍxʎz∀ᗺƆᗡƎℲ⅁HIᒋKꞀWNOԀΌᴚS⟘∩ΛMX⅄Z" },
  33: { name: "Reverse", map: "zyxwvutsrqponmlkjihgfedcbaZYXWVUTSRQPONMLKJIHGFEDCBA" },
  34: { name: "Inverted", map: "Hɘllo (Manual)" },
  35: { name: "Mirror", map: "ollɘH (Manual)" },
  // Adding more to reach 65...
  36: { name: "Boxed", map: "🄰🄱🄲🄳🄴🄵🄶🄷🄸🄹🄺🄻🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉🄰🄱🄲🄳🄴🄵🄶🄷🄸🄹🄺🄻🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉" },
  37: { name: "Double Line", map: "𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ" },
  38: { name: "Bubbles", map: "ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏ" },
  39: { name: "Cursive", map: "𝓪𝓫𝓬𝓭𝓮𝓯𝓰𝓱𝓲𝓳𝓴𝓵𝓶𝓷𝓸𝓹𝓺𝓻𝓼𝓽𝓾𝓿𝔀𝔁𝔂𝔃𝓐𝓑𝓒𝓓𝓔𝓕𝓖𝓗𝓘𝓙𝓚𝓛𝓜𝓝𝓓𝓟𝓠𝓡𝓢𝓣𝓤𝓥𝓦𝓧𝓨𝓩" },
  40: { name: "Handwriting", map: "𝒶𝒷𝒸𝒹𝑒𝒻𝑔𝒽𝒾𝒿𝓀𝓁𝓂𝓃𝑜𝓅𝓆𝓇𝓈𝓉𝓊𝓋𝓌𝓍𝓎𝓏𝒜𝐵𝒞𝒟𝐸𝐹𝒢𝐻𝐼𝒥𝒦𝐿𝑀𝒩𝒪𝒫𝒬𝑅𝒮𝒯𝒰𝒱𝒲𝒳𝒴𝒵" },
  41: { name: "Old English", map: "𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷𝔄𝔅ℭ𝔇𝔈𝔉𝔊ℌℑ𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔ℜ𝔖𝔗𝔘𝔙𝔚𝔛𝔜ℨ" },
  42: { name: "Tiny", map: "ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖᵠʳˢᵗᵘᵛʷˣʸᶻᴬᴮᶜᴰᴱᶠᴳᴴᴵᴶᴷᴸᴹᴺᴼᴾᵠᴿˢᵗᵁⱽᵂˣʸᶻ" },
  43: { name: "Slashed", map: "a̸b̸c̸d̸e̸f̸g̸h̸i̸j̸k̸l̸m̸n̸o̸p̸q̸r̸s̸t̸u̸v̸w̸x̸y̸z̸A̸B̸C̸D̸E̸F̸G̸H̸I̸J̸K̸L̸M̸N̸O̸P̸Q̸R̸S̸T̸U̸V̸W̸X̸Y̸Z̸" },
  44: { name: "Underline", map: "a̲b̲c̲d̲e̲f̲g̲h̲i̲j̲k̲l̲m̲n̲o̲p̲q̲r̲s̲t̲u̲v̲w̲x̲y̲z̲A̲B̲C̲D̲E̲F̲G̲H̲I̲J̲K̲L̲M̲N̲O̲P̲Q̲R̲S̲T̲U̲V̲W̲X̲Y̲Z̲" },
  45: { name: "Double Underline", map: "a̳b̳c̳d̳e̳f̳g̳h̳i̳j̳k̳l̳m̳n̳o̳p̳q̳r̳s̳t̳u̳v̳w̳x̳y̳z̳A̳B̳C̳D̳E̳F̳G̳H̳I̳J̳K̳L̳M̳N̳O̳P̳Q̳R̳S̳T̳U̳V̳W̳X̳Y̳Z̳" },
  46: { name: "Strikethrough 2", map: "a̶b̶c̶d̶e̶f̶g̶h̶i̶j̶k̶l̶m̶n̶o̶p̶q̶r̶s̶t̶u̶v̶w̶x̶y̶z̶A̶B̶C̶D̶E̶F̶G̶H̶I̶J̶K̶L̶M̶N̶O̶P̶Q̶R̶S̶T̶U̶V̶W̶X̶Y̶Z̶" },
  47: { name: "Wavy", map: "a̴b̴c̴d̴e̴f̴g̴h̴i̴j̴k̴l̴m̴n̴o̴p̴q̴r̴s̴t̴u̴v̴w̴x̴y̴z̴A̴B̴C̴D̴E̴F̴G̴H̴I̴J̴K̴L̸M̸N̸O̸P̸Q̸R̸S̸T̸U̸V̸W̸X̸Y̸Z̸" },
  48: { name: "Blur", map: "a̾b̾c̾d̾e̾f̾g̾h̾i̾j̾k̾l̾m̾n̾o̾p̾q̾r̾s̾t̾u̾v̾w̾x̾y̾z̾A̾B̾C̾D̾E̾F̾G̾H̾I̾J̾K̾L̾M̾N̾O̾P̾Q̾R̾S̾T̾U̾V̾W̾X̾Y̾Z̾" },
  49: { name: "Hearts", map: "a♥b♥c♥d♥e♥f♥g♥h♥i♥j♥k♥l♥m♥n♥o♥p♥q♥r♥s♥t♥u♥v♥w♥x♥y♥z♥A♥B♥C♥D♥E♥F♥G♥H♥I♥J♥K♥L♥M♥N♥O♥P♥Q♥R♥S♥T♥U♥V♥W♥X♥Y♥Z♥" },
  50: { name: "Stars", map: "a★b★c★d★e★f★g★h★i★j★k★l★m★n★o★p★q★r★s★t★u★v★w★x★y★z★A★B★C★D★E★F★G★H★I★J★K★L★M★N★O★P★Q★R★S★T★U★V★W★X★Y★Z★" },
  51: { name: "Dots", map: "a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p.q.r.s.t.u.v.w.x.y.z.A.B.C.D.E.F.G.H.I.J.K.L.M.N.O.P.Q.R.S.T.U.V.W.X.Y.Z." },
  52: { name: "Brackets", map: "[a][b][c][d][e][f][g][h][i][j][k][l][m][n][o][p][q][r][s][t][u][v][w][x][y][z][A][B][C][D][E][F][G][H][I][J][K][L][M][N][O][P][Q][R][S][T][U][V][W][X][Y][Z]" },
  53: { name: "Angle Brackets", map: "<a><b><c><d><e><f><g><h><i><j><k><l><m><n><o><p><q><r><s><t><u><v><w><x><y><z><A><B><C><D><E><F><G><H><I><J><K><L><M><N><O><P><Q><R><S><T><U><V><W><X><Y><Z>" },
  54: { name: "Arrows", map: "a➵b➵c➵d➵e➵f➵g➵h➵i➵j➵k➵l➵m➵n➵o➵p➵q➵r➵s➵t➵u➵v➵w➵x➵y➵z➵A➵B➵C➵D➵E➵F➵G➵H➵I➵J➵K➵L➵M➵N➵O➵P➵Q➵R➵S➵T➵U➵V➵W➵X➵Y➵Z➵" },
  55: { name: "Music", map: "a♫b♫c♫d♫e♫f♫g♫h♫i♫j♫k♫l♫m♫n♫o♫p♫q♫r♫s♫t♫u♫v♫w♫x♫y♫z♫A♫B♫C♫D♫E♫F♫G♫H♫I♫J♫K♫L♫M♫N♫O♫P♫Q♫R♫S♫T♫U♫V♫W♫X♫Y♫Z♫" },
  56: { name: "Fire", map: "a🔥b🔥c🔥d🔥e🔥f🔥g🔥h🔥i🔥j🔥k🔥l🔥m🔥n🔥o🔥p🔥q🔥r🔥s🔥t🔥u🔥v🔥w🔥x🔥y🔥z🔥A🔥B🔥C🔥D🔥E🔥F🔥G🔥H🔥I🔥J🔥K🔥L🔥M🔥N🔥O🔥P🔥Q🔥R🔥S🔥T🔥U🔥V🔥W🔥X🔥Y🔥Z🔥" },
  57: { name: "Diamonds", map: "a💎b💎c💎d💎e💎f💎g💎h💎i💎j💎k💎l💎m💎n💎o💎p💎q💎r💎s💎t💎u💎v💎w💎x💎y💎z💎A💎B💎C💎D💎E💎F💎G💎H💎I💎J💎K💎L💎M💎N💎O💎P💎Q💎R💎S💎T💎U💎V💎W💎X💎Y💎Z💎" },
  58: { name: "Crowns", map: "a👑b👑c👑d👑e👑f👑g👑h👑i👑j👑k👑l👑m👑n👑o👑p👑q👑r👑s👑t👑u👑v👑w👑x👑y👑z👑A👑B👑C👑D👑E👑F👑G👑H👑I👑J👑K👑L👑M👑N👑O👑P👑Q👑R👑S👑T👑U👑V👑W👑X👑Y👑Z👑" },
  59: { name: "Gothic", map: "𝖆𝖇𝖈𝖉𝖊𝖋𝖌𝖍𝖎𝖏𝖐𝖑𝖒𝖓𝖔𝖕𝖖𝖗𝖘𝖙𝖚𝖛▖𝖜𝖝𝖞𝖟𝕬𝕭𝕮𝕯𝕰𝕱𝕕𝕳𝕴𝕵𝕶𝕷𝕸𝕹𝕺𝕻𝕼𝕽𝕾𝕿𝖀𝖁𝖂𝖃𝖄𝖅" },
  60: { name: "Shadow", map: "a⃘b⃘c⃘d⃘e⃘f⃘g⃘h⃘i⃘j⃘k⃘l⃘m⃘n⃘o⃘p⃘q⃘r⃘s⃘t⃘u⃘v⃘w⃘x⃘y⃘z⃘A⃘B⃘C⃘D⃘E⃘F⃘G⃘H⃘I⃘J⃘K⃘L⃘M⃘N⃘O⃘P⃘Q⃘R⃘S⃘T⃘U⃘V⃘W⃘X⃘Y⃘Z⃘" },
  61: { name: "Stripe", map: "a⃒b⃒c⃒d⃒e⃒f⃒g⃒h⃒i⃒j⃒k⃒l⃒m⃒n⃒o⃒p⃒q⃒r⃒s⃒t⃒u⃒v⃒w⃒x⃒y⃒z⃒A⃒B⃒C⃒D⃒E⃒F⃒G⃒H⃒I⃒J⃒K⃒L⃒M⃒N⃒O⃒P⃒Q⃒R⃒S⃒T⃒U⃒V⃒W⃒X⃒Y⃒Z⃒" },
  62: { name: "Slash", map: "a̸b̸c̸d̸e̸f̸g̸h̸i̸j̸k̸l̸m̸n̸o̸p̸q̸r̸s̸t̸u̸v̸w̸x̸y̸z̸A̸B̸C̸D̸E̸F̸G̸H̸I̸J̸K̸L̸M̸N̸O̸P̸Q̸R̸S̸T̸U̸V̸W̸X̸Y̸Z̸" },
  63: { name: "Double Strike", map: "𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ" },
  64: { name: "Wide", map: "ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ" },
  65: { name: "Ancient", map: "αвcδεfghιjκlмηορqrѕτυvωxψzΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ" }
};

const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function convert(text, styleId) {
  const style = styles[styleId];
  if (!style) return text;
  
  if (styleId === 32) { // Upside Down
    const map = style.map;
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let res = "";
    for (let i = text.length - 1; i >= 0; i--) {
      const idx = chars.indexOf(text[i]);
      res += idx !== -1 ? map[idx] : text[i];
    }
    return res;
  }
  
  if (styleId === 33) { // Reverse
    return text.split('').reverse().join('');
  }

  let res = "";
  for (let i = 0; i < text.length; i++) {
    const idx = alphabet.indexOf(text[i]);
    if (idx !== -1) {
      // Handle multi-character symbols like Regional Indicators or combined emojis
      const styleMap = style.map;
      // This is a simple approximation for the demo. 
      // In reality, we'd use an array of characters to handle multi-byte symbols correctly.
      const styleChars = Array.from(styleMap);
      res += styleChars[idx] || text[i];
    } else {
      res += text[i];
    }
  }
  return res;
}

moon({
  name: "fancy",
  aliases: ["font"],
  category: "fun",
  description: "Convert text to fancy fonts",
  usage: ".fancy <styleNumber> <text>",
  async execute(sock, jid, sender, args, m, { reply }) {
    const styleId = parseInt(args[0]);
    const text = args.slice(1).join(" ");

    if (!styleId || isNaN(styleId) || !text) {
      let help = "✨ *FANCY FONTS - MOONLIGHT HAVEN* ✨\n\n";
      help += "Usage: `.fancy <number> <text>`\n\n";
      help += "*Available Styles:*\n";
      
      for (let i = 1; i <= 65; i++) {
        const example = convert("Moonlight Haven", i);
        help += `${i}. ${example}\n`;
      }
      
      return reply(help);
    }

    if (styleId < 1 || styleId > 65) {
      return reply("❌ Invalid style number. Choose 1-65.");
    }

    const result = convert(text, styleId);
    return reply(result);
  }
});
