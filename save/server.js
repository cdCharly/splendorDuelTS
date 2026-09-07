const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Configuration de Socket.IO pour accepter les connexions de votre site
const io = new Server(server, {
    cors: { origin: "*" }
});

// ==========================================
// 1. CLASSES DU JEU
// ==========================================
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
        this.paquet = []; // Cartes achetées
        this.poche = [];  // Jetons récoltés
    }
}

// ==========================================
// 2. ÉTAT GLOBAL DE LA PARTIE
// ==========================================
let connexions = []; // Stocke les ID Socket et les rôles
let etatPartie = {
    plateau: [],
    poche: [],
    paquet: [],
    joueurs: {},
    tourActuel: "Player1"
};

// ==========================================
// 3. FONCTIONS D'INITIALISATION
// ==========================================
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

// ==========================================
// 4. GESTION DU RÉSEAU (SOCKET.IO)
// ==========================================
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

    // Gestion de la pioche
    socket.on('demande_pioche', (selection) => {
        let client = connexions.find(c => c.id === socket.id);
        if (!client || (client.role !== etatPartie.tourActuel )){
		console.log("action refusee : pas au tour de ${client.role}");
		return; // action terminee
	}

        let instanceJoueur = etatPartie.joueurs[client.role];

        selection.forEach(choix => {
            let jeton = etatPartie.plateau[choix.ligne][choix.colonne];
            if (jeton) {
                jeton.owner = instanceJoueur.nom;
                instanceJoueur.poche.push(jeton);
                etatPartie.plateau[choix.ligne][choix.colonne] = null;
            }
        });

	// changement de role
	if(etatPartie.tourActuel === 'Player1'){
		etatPartie.tourActuel = 'Player2';
	}
	else{
		etatPartie.tourActuel = 'Player1';
	}


        // On renvoie le plateau mis à jour à tout le monde
        io.emit('mise_a_jour_partie', etatPartie);
    });

    // Déconnexion
    socket.on('disconnect', () => {
        console.log(`Déconnexion : ${socket.id}`);
        connexions = connexions.filter(c => c.id !== socket.id);
    });
});

// Lancement du serveur
server.listen(3000, () => {
    console.log('Le serveur Splendor tourne sur le port 3000 !');
});
