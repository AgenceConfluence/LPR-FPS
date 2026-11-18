# Lycée FPS — 1v1 blasters en mousse

Map 3D du lycée du Pays de Retz (Pornic), agrandie façon FPS, jouable en 1 contre 1 dans le navigateur.

**Jouer :** https://agenceconfluence.github.io/LPR-FPS/ → « Créer une partie » → envoyer le lien à l'adversaire.

- Connexion directe entre les deux navigateurs (WebRTC via PeerJS), aucun serveur à gérer.
- Manches de 1:45, 12 s d'achat, le premier qui élimine l'autre marque, premier à 5.
- Fléchettes balistiques : vitesse propre à chaque arme et chute due à la gravité.
- Boutique façon CS : Piston (USP-S), Vortex (MP5-SD), Tempête (SPAS-12), Rafale (M4A1-S), Longue-Vue (AWP).
- Commandes : ZQSD / flèches, souris, clic gauche tirer, clic droit lunette, R recharger, 1/2 ou molette changer d'arme, B boutique, Maj courir, Espace sauter.

`index.html` est généré à partir de `src/` (head.html + map.js + game.js).
HDRI « park » : Poly Haven, CC0, via @pmndrs/assets.
