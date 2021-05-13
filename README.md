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

- Renseigner les champs email et password correspondant au compte KelDoc
- Vérifier les informations du Vaccinodrome (par défaut Toulouse)
- Lancer une première fois l'application avec `npm start`, l'application propose les choix disponibles dans le vaccinodrome
- Choisir un motiveCategory et l'inscrire dans le config.json
- Relancer l'application

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