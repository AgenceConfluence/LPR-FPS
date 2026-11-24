# Lycée FPS — 1v1 blasters en mousse

Map 3D du lycée du Pays de Retz (Pornic), agrandie façon FPS, jouable en 1 contre 1 dans le navigateur.

**Jouer :** https://agenceconfluence.github.io/LPR-FPS/ → « Créer une partie » → envoyer le lien à l'adversaire.

- Connexion directe entre les deux navigateurs (WebRTC via PeerJS), aucun serveur à gérer.
- Manches de 1:45, 12 s d'achat, le premier qui élimine l'autre marque, premier à 5.
- Fléchettes balistiques : vitesse propre à chaque arme et chute due à la gravité.
- Boutique façon CS : Piston (USP-S), Vortex (MP5-SD), Tempête (SPAS-12), Rafale (M4A1-S), Longue-Vue (AWP).
- Commandes : ZQSD / flèches, souris, clic gauche tirer, clic droit viser (lunette pour la Longue-Vue), R recharger, 1/2 ou molette changer d'arme, B boutique, Maj courir, C s'accroupir (silencieux), Espace sauter, Échap réglages.
- Modes : Classique, One-shot (une touche = éliminé), Territoire (paintball : repeindre le plus de sol en 90 s, résultat en % avec jauge).
- Touches entièrement réassignables, chat vocal de proximité en 3D (micro ouvert par défaut, ou appuyer pour parler). Réglages > Son : test du micro, état du micro des deux joueurs, bouton « Relancer la liaison voix ».
- Personnages articulés et animés (marche, course, accroupi, visée, mains posées sur l'arme), tenue aux couleurs de l'équipe, lunettes ou masque de paintball.
- Armes modélisées (silhouettes biseautées, plastique, alu anodisé, caoutchouc), gants et manches, visée épaulée et balancement de l'arme.
- Textures photo (pelouse, pavés, béton, terrazzo, carrelage, bardage bois, enrobé), ciel photographique, arbres et massifs à feuillage.
- Grenades : grenade à billes (jusqu'à 98 dégâts, rayon 6 m), flash (aveugle jusqu'à 4 s), fumigène (15 s) ; touches 3/4/5, clic gauche lancer loin, clic droit lober, G lancer rapide.
- Salles détaillées : tableaux écrits à la main, plaques de porte, horloges, radiateurs, vidéoprojecteurs, panneaux de liège, menu du self, écran d'info.
- Vitres cassables (fissures puis éclatement, réparées à chaque manche) ; rampes d'escalier solides.
- Audio : pas différents selon le sol, sons étouffés derrière les murs, écho en intérieur.

**Version paintball :** https://agenceconfluence.github.io/LPR-FPS/paintball/ — mêmes règles, lanceurs de paintball (TPX, Etha 3, AMP, CS3 Pro, First Strike), billes .68 avec chute, éclaboussures persistantes sur les murs, sols, vitres et joueurs, grenade de peinture.

`index.html` (Nerf) et `paintball/index.html` sont générés par `src/build.py` à partir de `src/head.html`, `src/map.js` et `src/game.js`.
HDRI « park » : Poly Haven, CC0, via @pmndrs/assets. Textures : ambientCG (CC0). Ciel : Poly Haven « Kloofendal 38d Partly Cloudy (Pure Sky) » (CC0). Personnage : X Bot (Mixamo), fichier d'exemple de three.js.
