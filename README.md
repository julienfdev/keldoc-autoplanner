# Keldoc AutoPlanner

## Prérequis

### Software

**Node.js**

- Installer node.js+npm (https://nodejs.org/en/) (version LTS)
- Lancer un terminal et installer nodemon :

```
npm install -g nodemon
```

### KelDoc

**Un compte Keldoc complété et validé**

- Rubrique "Mon Compte" complétée
- Téléphone renseigné
- Téléphone validé (envoi de code par SMS)

## Installation

Ouvrir un terminal dans le dossier racine (où se trouve l'index.ts et package.json), installer les dépendances de l'appli : 

```
npm install
```

## Préparation
Afin de fonctionner, l'application a besoin de plusieurs informations à rassembler dans le fichier ./config/config.json

- Se conecter à son compte KelDoc
- Ouvrir la console développeurs du navigateur (F12)
- Sélectionner l'onglet "Network"
- Dans le navigateur, page d'accueil de KelDoc, rechercher "Covid" à Toulouse, page suivante, sélectionner le vaccinodrome
- Effacer les requêtes dans la console pour y voir plus clair (le signe interdit de stationner à côté du point rouge)
- dans le point 3, catégorie de motif, sélectionner "personnes de +18 ans pour rdv <24h (Pfizer ou Moderna, mais Moderna bien plus dispo!)
- Au moment du clic, plusieurs requêtes s'affichent
- Ignorer les requêtes qui commencent par "?sentry_key et cliquer sur la requête qui commence par 5 chiffres, une colonne s'ouvre à droite (ou en bas selon position de la console)
- en bas des "Requests Headers", il existe une clé `"X-Jwt-Token"`, copier la clé (ey....)
- aller sur https://jwt.io/ , dans le debugger, et coller le token dans la partie gauche "Encoded", le site décode le payload sous cette forme : 
```
{
  "user_id": 2079074,
  "device_id": "5d0612736761388a4b1524a769857932",
  "exp": 1620917251
}
```
- dans la partie payload, vérifier la date du `"exp"` en passant la souris dessus, si le token périme bientôt (< 1h), se déconnecter et reconnecter à KelDoc et refaire la manipulation
- copier le token encodé (ey...) dans le fichier ./config/config.json dans la clé `"jwt"`
- copier le user_id dans le fichier config.json dans la clé `"userId"`
- retourner sur la requête, il existe un header cookie de la forme :
```
nehs_consent=eyJzIjpbeyJrIjoiZ2EiLCJhIjoxfSx7ImsiOiJuZWhzIiwiYSI6MX1dfQ==
```
- copier la partie droite (ey....) dans le fichier config.json dans la clé `"nehs"`
- en bas de la requête, dans les Query String Parameters, copier `"from"` et `"to"` dans les clés correspondantes dans le config.json
- renseigner les `"firstMotiveId"` et `"secondMotiveId"` en fonction des infos du champ `"comments"` du fichier config.json, elles sont par défaut en mode "Moderna"
- Enfin, la barre d'adresse se présente actuellement sous la forme

```
https://www.keldoc.com/cabinet-medical/toulouse-31000/vaccinodrome-toulouse/vaccinodrome-toulouse?agenda=53180,...,56241&motive=96875&category=3832&cabinet=18777&specialty=144
```
- Dans le fichier config.json, copier dans le tableau `"agendaIds"`, entre les [], toutes les valeurs de `agenda=` jusqu'à `&motive`, si tout va bien, `"agendaIds"` se présente désormais sous la forme
```
"agendaIds": [53180, 53xxx, 53xxx, ...]
```

L'application est désormais configurée

## Lancement

Dans un terminal à la racine du dossier
```
npm start
```

Au bout de 10 secondes, l'application va commencer à rechercher des RDV, selon le mode opératoire suivant : 

- L'application interroge les dispos de "premier rdv" (J à J+4)
- S'il n'y a aucun créneau dispo, l'appli se met en veille 10 sec
- lorsque l'application détecte des disponibilités, it's on bitch! elle met de côté le premier créneau disponible, requête les dispos à J+42 pour la deuxième dose, met de côté le premier créneau dispo et réserve immédiatement les deux RDV
- KelDoc confirme la prise de RDV par SMS / Mail

## Enjoy!