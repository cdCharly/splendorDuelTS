const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// config socket
const io = new Server(server, {
    cors: { origin: "*" }
});

// classes du jeu
class Carte {
    constructor(niveau, points, cout, couleur) {
        this.niveau = niveau;
        this.points = points;
        this.cout = cout;
        this.couleur = couleur;
        this.owner = "plateau";
    }
}

class Jeton {
    constructor(couleur, owner) {
        this.couleur = couleur;
        this.owner = owner;
    }
}

class Joueur {
    constructor(nom, role) {
        this.nom = nom;
        this.role = role;
        this.paquet = []; // cartes achetées
        this.poche = [];  // jetons recoltés
    }
}

// etat de la partie
let connexions = []; // Stocke les ID Socket et les rôles
let etatPartie = {
    plateau: [],
    poche: [],
    paquet: [],
    joueurs: {},
    tourActuel: "Player1"
};

// initialisation de la partie
function creerPlateau() {
    let plateau = [];
    for (let i = 0; i < 5; i++) {
        plateau.push([null, null, null, null, null]);
    }
    return plateau;
}

function creerPocheJeton() {
    const poche = [];
    for (let i = 0; i < 2; i++) poche.push(new Jeton("Pink", "nobody"));
    for (let i = 0; i < 3; i++) poche.push(new Jeton("Gold", "nobody"));
    for (let i = 0; i < 4; i++) poche.push(new Jeton("Blue", "nobody"));
    for (let i = 0; i < 4; i++) poche.push(new Jeton("Red", "nobody"));
    for (let i = 0; i < 4; i++) poche.push(new Jeton("Green", "nobody"));
    for (let i = 0; i < 4; i++) poche.push(new Jeton("White", "nobody"));
    for (let i = 0; i < 4; i++) poche.push(new Jeton("Black", "nobody"));
    return poche;
}

function creerPaquet() {
    const paquet = [];
    const coutA = [new Jeton("Blue", "Player1"), new Jeton("Blue", "Player1")];
    const coutB = [new Jeton("Blue", "Player1"), new Jeton("Green", "Player1")];
    paquet.push(new Carte(1, 1, coutA, "Red"));
    paquet.push(new Carte(2, 4, coutB, "Black"));
    return paquet;
}

function remplirPlateau(plateau, poche) {
    const chemin = [
        [4, 4], [1, 4], [2, 0], [2, 1], [2, 2],
        [4, 3], [1, 3], [0, 1], [0, 2], [2, 3],
        [4, 2], [1, 2], [0, 0], [0, 3], [2, 4],
        [4, 1], [1, 1], [1, 0], [0, 4], [3, 0],
        [4, 0], [3, 4], [3, 3], [3, 2], [3, 1]
    ];

    for (let i = 0; i < chemin.length; i++) {
        let ligne = chemin[i][0];
        let colonne = chemin[i][1];

        if (plateau[ligne][colonne] === null && poche.length > 0) {
            let indexAleatoire = Math.floor(Math.random() * poche.length);
            let jetonPioche = poche.splice(indexAleatoire, 1)[0];
            jetonPioche.owner = "plateau";
            plateau[ligne][colonne] = jetonPioche;
        }
    }
    return plateau;
}




// gestion des connections réseau


io.on('connection', (socket) => {
    console.log(`Nouvelle connexion détectée : ${socket.id}`);

    // Attribution des rôles
    let roleAttribue = 'Spectateur';
    if (connexions.length === 0) roleAttribue = 'Player1';
    else if (connexions.length === 1) roleAttribue = 'Player2';

    connexions.push({ id: socket.id, role: roleAttribue });
    socket.emit('role_attribue', roleAttribue);
    console.log(`Rôle assigné : ${roleAttribue}`);

    // Si les 2 joueurs sont là, on lance la partie
    if (connexions.length === 2) {
        etatPartie.joueurs['Player1'] = new Joueur("Joueur 1", "Player1");
        etatPartie.joueurs['Player2'] = new Joueur("Joueur 2", "Player2");
        
        etatPartie.poche = creerPocheJeton();
        let plateauVide = creerPlateau();
        etatPartie.plateau = remplirPlateau(plateauVide, etatPartie.poche);
        etatPartie.paquet = creerPaquet();

        console.log("Partie initialisée ! Envoi des données aux joueurs...");
        io.emit('mise_a_jour_partie', etatPartie);
    } else if (connexions.length > 2) {
        // Envoi de la partie en cours au spectateur
        socket.emit('mise_a_jour_partie', etatPartie);
    }

        socket.on('demande_pioche', (selection) => {
        let client = connexions.find(c => c.id === socket.id);
        
        // 1. On vérifie si c'est bien le tour du joueur
        if (!client || client.role !== etatPartie.tourActuel) {
            console.log(`Refusé : Action non autorisée pour ${client ? client.role : 'Inconnu'}`);
            return; 
        }

        let instanceJoueur = etatPartie.joueurs[client.role];

        // 2. SÉCURITÉ ANTI-CRASH : On s'assure que le client a bien envoyé un tableau
        if (!Array.isArray(selection)) {
            console.log("Erreur : Les données reçues ne sont pas valides.");
            return;
        }

        // 3. Traitement des jetons
        selection.forEach(choix => {
            // SÉCURITÉ ANTI-CRASH : On vérifie que la ligne demandée existe avant de chercher la colonne
            if (etatPartie.plateau[choix.ligne] !== undefined && etatPartie.plateau[choix.ligne][choix.colonne] !== undefined) {
                
                let jeton = etatPartie.plateau[choix.ligne][choix.colonne];
                
                if (jeton) {
                    jeton.owner = instanceJoueur.nom;
                    instanceJoueur.poche.push(jeton);
                    etatPartie.plateau[choix.ligne][choix.colonne] = null;
                }
            } else {
                console.log(`Erreur : La case [${choix.ligne}][${choix.colonne}] n'existe pas.`);
            }
        });

        // 4. CHANGEMENT DE TOUR : On bascule le tour
        if (etatPartie.tourActuel === 'Player1') {
            etatPartie.tourActuel = 'Player2';
        } else {
            etatPartie.tourActuel = 'Player1';
        }

        // 5. On renvoie le nouveau plateau à tout le monde
        io.emit('mise_a_jour_partie', etatPartie);
    });



        // On renvoie le plateau mis à jour à tout le monde
        io.emit('mise_a_jour_partie', etatPartie);
    });

    // Déconnexion
    socket.on('disconnect', () => {
        console.log(`Déconnexion : ${socket.id}`);
        connexions = connexions.filter(c => c.id !== socket.id);
});


// Lancement du serveur
server.listen(3000, () => {
    console.log('Le serveur Splendor tourne sur le port 3000 !');
});
