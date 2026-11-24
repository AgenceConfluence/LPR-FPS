# Génère index.html (Nerf) et paintball/index.html à partir de head.html + map.js + game.js
import os
h=open('head.html').read(); m=open('map.js').read(); g=open('game.js').read()
def build(theme):
    t=h
    if theme=='pb':
        t=t.replace("<title>Lycée FPS — 1v1 blasters mousse</title>","<title>Lycée Paintball — 1v1</title>")
        t=t.replace('<script src="https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js"></script>','<script>window.THEME="paintball";</script>\n<script src="https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js"></script>')
        t=t.replace("__TITLE__","LYCÉE <em>PAINTBALL</em>").replace("__TAG__","1v1 en ligne · billes .68 · peinture partout").replace(":root{--acc:#9ccc3c}",":root{--acc:#ff4fa3}")
    else:
        t=t.replace("__TITLE__","LYCÉE <em>ARENA</em>").replace("__TAG__","1v1 en ligne · blasters en mousse · premier à 5 manches")
    assert '__TITLE__' not in t
    return t+m+g
os.makedirs('paintball',exist_ok=True)
open('index.html','w').write(build('nerf')); open('paintball/index.html','w').write(build('pb'))
print('build ok')
