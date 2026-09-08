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

class Privilege {
    constructor(numero, owner){
        this.numero = numero;   // le combientieme privilege sur le jeu (0 à 2) 1 à 3
        this.owner = owner;
    }
}

class Joueur {
    constructor(nom, role) {
        this.nom = nom;
        this.role = role;
        this.paquet = []; // cartes achetées
        this.poche = [];  // jetons recoltés
        this.privileges = [];
    }
}

// etat de la partie
let connexions = []; // Stocke les ID Socket et les rôles
let etatPartie = {
    plateau: [],
    poche: [],
    paquetLv1: [],
    paquetLv2: [],
    paquetLv3: [],
    joueurs: {},
    privileges: [],
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


function creerPrivileges(){
    p1 = new Privilege(1,"plateau");
    p2 = new Privilege(2,"plateau");
    p3 = new Privilege(3,"plateau");

    return [p1,p2,p3];
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




// Fonction outil pour écrire les coûts en 1 ligne : (Blanc, Bleu, Vert, Rouge, Noir, Perle_Rose)
function genererCout(w, u, g, r, b, pink = 0) {
    let cout = [];
    for(let i=0; i<w; i++) cout.push(new Jeton("White", "plateau"));
    for(let i=0; i<u; i++) cout.push(new Jeton("Blue", "plateau"));
    for(let i=0; i<g; i++) cout.push(new Jeton("Green", "plateau"));
    for(let i=0; i<r; i++) cout.push(new Jeton("Red", "plateau"));
    for(let i=0; i<b; i++) cout.push(new Jeton("Black", "plateau"));
    for(let i=0; i<pink; i++) cout.push(new Jeton("Pink", "plateau"));
    return cout;
}

function creerPaquetNiveau1() {
    const paquet = [];

    // ==========================================
    // CARTES BLANCHES (White)
    // format : niveau, points, cout(W, U, G, R, B, Pink), couleur, couronnes, pouvoir
    // ==========================================
    paquet.push(new Carte(1, 0, genererCout(0, 2, 0, 0, 1, 0), "White", 0, "rejouer"));
    paquet.push(new Carte(1, 0, genererCout(0, 0, 3, 0, 0, 1), "White", 0, "privilege"));
    paquet.push(new Carte(1, 0, genererCout(0, 1, 1, 1, 1, 0), "White", 1, null));
    paquet.push(new Carte(1, 1, genererCout(0, 0, 0, 4, 0, 0), "White", 0, null));
    paquet.push(new Carte(1, 0, genererCout(0, 1, 2, 0, 0, 1), "White", 0, "jeton_bonus"));
    paquet.push(new Carte(1, 0, genererCout(0, 0, 0, 2, 2, 0), "White", 0, "voler_jeton"));

    // ==========================================
    // CARTES BLEUES (Blue)
    // ==========================================
    paquet.push(new Carte(1, 0, genererCout(1, 0, 2, 0, 0, 0), "Blue", 0, "rejouer"));
    paquet.push(new Carte(1, 0, genererCout(0, 0, 0, 3, 0, 1), "Blue", 0, "privilege"));
    paquet.push(new Carte(1, 0, genererCout(1, 0, 1, 1, 1, 0), "Blue", 1, null));
    paquet.push(new Carte(1, 1, genererCout(0, 0, 0, 0, 4, 0), "Blue", 0, null));
    paquet.push(new Carte(1, 0, genererCout(0, 0, 1, 2, 0, 1), "Blue", 0, "jeton_bonus"));
    paquet.push(new Carte(1, 0, genererCout(2, 0, 0, 0, 2, 0), "Blue", 0, "voler_jeton"));

    // ==========================================
    // CARTES VERTES (Green)
    // ==========================================
    paquet.push(new Carte(1, 0, genererCout(0, 1, 0, 2, 0, 0), "Green", 0, "rejouer"));
    paquet.push(new Carte(1, 0, genererCout(0, 0, 0, 0, 3, 1), "Green", 0, "privilege"));
    paquet.push(new Carte(1, 0, genererCout(1, 1, 0, 1, 1, 0), "Green", 1, null));
    paquet.push(new Carte(1, 1, genererCout(4, 0, 0, 0, 0, 0), "Green", 0, null));
    paquet.push(new Carte(1, 0, genererCout(0, 0, 0, 1, 2, 1), "Green", 0, "jeton_bonus"));
    paquet.push(new Carte(1, 0, genererCout(2, 2, 0, 0, 0, 0), "Green", 0, "voler_jeton"));

    // ==========================================
    // CARTES ROUGES (Red)
    // ==========================================
    paquet.push(new Carte(1, 0, genererCout(0, 0, 1, 0, 2, 0), "Red", 0, "rejouer"));
    paquet.push(new Carte(1, 0, genererCout(3, 0, 0, 0, 0, 1), "Red", 0, "privilege"));
    paquet.push(new Carte(1, 0, genererCout(1, 1, 1, 0, 1, 0), "Red", 1, null));
    paquet.push(new Carte(1, 1, genererCout(0, 4, 0, 0, 0, 0), "Red", 0, null));
    paquet.push(new Carte(1, 0, genererCout(2, 0, 0, 0, 1, 1), "Red", 0, "jeton_bonus"));
    paquet.push(new Carte(1, 0, genererCout(0, 2, 2, 0, 0, 0), "Red", 0, "voler_jeton"));

    // ==========================================
    // CARTES NOIRES (Black)
    // ==========================================
    paquet.push(new Carte(1, 0, genererCout(2, 0, 0, 1, 0, 0), "Black", 0, "rejouer"));
    paquet.push(new Carte(1, 0, genererCout(0, 3, 0, 0, 0, 1), "Black", 0, "privilege"));
    paquet.push(new Carte(1, 0, genererCout(1, 1, 1, 1, 0, 0), "Black", 1, null));
    paquet.push(new Carte(1, 1, genererCout(0, 0, 4, 0, 0, 0), "Black", 0, null));
    paquet.push(new Carte(1, 0, genererCout(1, 2, 0, 0, 0, 1), "Black", 0, "jeton_bonus"));
    paquet.push(new Carte(1, 0, genererCout(0, 0, 2, 2, 0, 0), "Black", 0, "voler_jeton"));

    // On mélange le paquet avant de le renvoyer (très important pour piocher aléatoirement !)
    return paquet.sort(() => Math.random() - 0.5);
}

function creerPaquetNiveau2() {
    const paquet = [];

    // ==========================================
    // CARTES BLANCHES (White)
    // format : niveau, points, cout(W, U, G, R, B, Pink), couleur, couronnes, pouvoir
    // ==========================================
    paquet.push(new Carte(2, 1, genererCout(0, 3, 0, 0, 2, 0), "White", 1, null));
    paquet.push(new Carte(2, 2, genererCout(2, 0, 0, 2, 0, 2), "White", 0, null));
    paquet.push(new Carte(2, 1, genererCout(0, 0, 4, 0, 0, 1), "White", 0, "rejouer"));
    paquet.push(new Carte(2, 2, genererCout(0, 2, 2, 0, 2, 0), "White", 1, "privilege"));

    // ==========================================
    // CARTES BLEUES (Blue)
    // ==========================================
    paquet.push(new Carte(2, 1, genererCout(0, 0, 3, 2, 0, 0), "Blue", 1, null));
    paquet.push(new Carte(2, 2, genererCout(2, 2, 0, 0, 0, 2), "Blue", 0, null));
    paquet.push(new Carte(2, 1, genererCout(0, 0, 0, 4, 0, 1), "Blue", 0, "rejouer"));
    paquet.push(new Carte(2, 2, genererCout(2, 0, 0, 2, 2, 0), "Blue", 1, "privilege"));

    // ==========================================
    // CARTES VERTES (Green)
    // ==========================================
    paquet.push(new Carte(2, 1, genererCout(2, 0, 0, 3, 0, 0), "Green", 1, null));
    paquet.push(new Carte(2, 2, genererCout(0, 2, 2, 0, 0, 2), "Green", 0, null));
    paquet.push(new Carte(2, 1, genererCout(0, 0, 0, 0, 4, 1), "Green", 0, "rejouer"));
    paquet.push(new Carte(2, 2, genererCout(2, 2, 0, 2, 0, 0), "Green", 1, "privilege"));

    // ==========================================
    // CARTES ROUGES (Red)
    // ==========================================
    paquet.push(new Carte(2, 1, genererCout(0, 2, 0, 0, 3, 0), "Red", 1, null));
    paquet.push(new Carte(2, 2, genererCout(0, 0, 2, 2, 0, 2), "Red", 0, null));
    paquet.push(new Carte(2, 1, genererCout(4, 0, 0, 0, 0, 1), "Red", 0, "rejouer"));
    paquet.push(new Carte(2, 2, genererCout(2, 2, 2, 0, 0, 0), "Red", 1, "privilege"));

    // ==========================================
    // CARTES NOIRES (Black)
    // ==========================================
    paquet.push(new Carte(2, 1, genererCout(3, 0, 2, 0, 0, 0), "Black", 1, null));
    paquet.push(new Carte(2, 2, genererCout(0, 0, 0, 2, 2, 2), "Black", 0, null));
    paquet.push(new Carte(2, 1, genererCout(0, 4, 0, 0, 0, 1), "Black", 0, "rejouer"));
    paquet.push(new Carte(2, 2, genererCout(0, 2, 2, 2, 0, 0), "Black", 1, "privilege"));

    // ==========================================
    // CARTES GRISES (Joker / Neutres)
    // ==========================================
    // Ces cartes offrent souvent des bonus de couleur au choix ("couleur_bonus") ou beaucoup de couronnes.
    paquet.push(new Carte(2, 2, genererCout(3, 3, 0, 0, 0, 1), "Joker", 0, "couleur_bonus"));
    paquet.push(new Carte(2, 1, genererCout(0, 0, 2, 2, 2, 1), "Joker", 2, null));
    paquet.push(new Carte(2, 0, genererCout(0, 0, 0, 4, 4, 0), "Joker", 2, "voler_jeton"));
    paquet.push(new Carte(2, 1, genererCout(3, 3, 3, 0, 0, 0), "Joker", 1, "jeton_bonus"));

    // On mélange le paquet comme pour le Niveau 1
    return paquet.sort(() => Math.random() - 0.5);
}


function creerPaquetNiveau3() {
    const paquet = [];

    // ==========================================
    // CARTES BLANCHES (White)
    // format : niveau, points, cout(W, U, G, R, B, Pink), couleur, couronnes, pouvoir
    // ==========================================
    paquet.push(new Carte(3, 4, genererCout(0, 4, 3, 0, 0, 1), "White", 1, "rejouer"));
    paquet.push(new Carte(3, 5, genererCout(0, 0, 5, 3, 0, 0), "White", 0, null));

    // ==========================================
    // CARTES BLEUES (Blue)
    // ==========================================
    paquet.push(new Carte(3, 4, genererCout(0, 0, 4, 3, 0, 1), "Blue", 1, "privilege"));
    paquet.push(new Carte(3, 5, genererCout(0, 0, 0, 5, 3, 0), "Blue", 0, null));

    // ==========================================
    // CARTES VERTES (Green)
    // ==========================================
    paquet.push(new Carte(3, 4, genererCout(0, 0, 0, 4, 3, 1), "Green", 1, "voler_jeton"));
    paquet.push(new Carte(3, 5, genererCout(3, 0, 0, 0, 5, 0), "Green", 0, null));

    // ==========================================
    // CARTES ROUGES (Red)
    // ==========================================
    paquet.push(new Carte(3, 3, genererCout(3, 0, 0, 0, 4, 1), "Red", 1, "jeton_bonus"));
    paquet.push(new Carte(3, 6, genererCout(0, 5, 0, 0, 3, 1), "Red", 0, null));

    // ==========================================
    // CARTES NOIRES (Black)
    // ==========================================
    paquet.push(new Carte(3, 4, genererCout(4, 3, 0, 0, 0, 1), "Black", 1, "couleur_bonus"));
    paquet.push(new Carte(3, 5, genererCout(5, 3, 0, 0, 0, 0), "Black", 0, null));

    // ==========================================
    // CARTES GRISES (Joker / Neutres)
    // ==========================================
    // Les cartes Joker de niveau 3 rapportent beaucoup de couronnes ou de points purs.
    paquet.push(new Carte(3, 3, genererCout(3, 3, 3, 0, 0, 1), "Joker", 2, null));
    paquet.push(new Carte(3, 4, genererCout(0, 0, 3, 3, 3, 1), "Joker", 1, "rejouer"));
    paquet.push(new Carte(3, 7, genererCout(2, 2, 2, 2, 2, 1), "Joker", 0, null));

    // On mélange le paquet avant de le renvoyer
    return paquet.sort(() => Math.random() - 0.5);
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
        etatPartie.paquetLv1 = creerPaquetNiveau1();
        etatPartie.paquetLv2 = creerPaquetNiveau2();
        etatPartie.paquetLv3 = creerPaquetNiveau3();
        etatPartie.privileges = creerPrivileges();

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

        let compteurRoses = 0;

        selection.forEach(choix => {
            if (etatPartie.plateau[choix.ligne] !== undefined && etatPartie.plateau[choix.ligne][choix.colonne] !== undefined) {
                let jeton = etatPartie.plateau[choix.ligne][choix.colonne];
                
                if (jeton) {
                    // On détecte la perle avant de la ranger
                    if (jeton.couleur === "Pink") {
                        compteurRoses++;
                    }

                    jeton.owner = instanceJoueur.nom;
                    instanceJoueur.poche.push(jeton);
                    etatPartie.plateau[choix.ligne][choix.colonne] = null;
                }
            }
        });

        // NOUVEAU : Attribution du privilège si 2 jetons roses sont pris
        if (compteurRoses === 2) {
            let roleAdversaire = (client.role === 'Player1') ? 'Player2' : 'Player1';
            bougerPrivilege(roleAdversaire);
        }

                // 4. CHANGEMENT DE TOUR : On bascule le tour
        if (etatPartie.tourActuel === 'Player1') {
            etatPartie.tourActuel = 'Player2';
        } else {
            etatPartie.tourActuel = 'Player1';
        }

        // 5. On renvoie le nouveau plateau à tout le monde
        io.emit('mise_a_jour_partie', etatPartie);
    }); // <-- Ceci ferme proprement 'demande_pioche'


    

    socket.on('demande_achat_carte', (donnees) => {
        let client = connexions.find(c => c.id === socket.id);
        
        // 1. On vérifie si c'est bien le tour du joueur
        if (!client || client.role !== etatPartie.tourActuel) return;

        let joueur = etatPartie.joueurs[client.role];
        let paquetSource = (donnees.niveau === 1) ? etatPartie.paquetLv1 : 
                           (donnees.niveau === 2) ? etatPartie.paquetLv2 : etatPartie.paquetLv3;

        let carteCible = paquetSource[donnees.index];
        if (!carteCible) return;

        // 2. Le joueur rend les jetons correspondants à la banque (poche centrale)
        carteCible.cout.forEach(jetonDemande => {
            let indexJetonJoueur = joueur.poche.findIndex(j => j.couleur === jetonDemande.couleur);
            
            if (indexJetonJoueur !== -1) {
                let jetonPaye = joueur.poche.splice(indexJetonJoueur, 1)[0];
                jetonPaye.owner = "nobody";
                etatPartie.poche.push(jetonPaye);
            }
        });

        // 3. On utilise votre fonction pour donner la carte au joueur
        deplacerCarte(donnees.niveau, donnees.index, client.role);

        // 4. On bascule le tour (sauf si la carte permet de rejouer)
        if (carteCible.pouvoir !== "rejouer") {
            etatPartie.tourActuel = (etatPartie.tourActuel === 'Player1') ? 'Player2' : 'Player1';
        }

        // 5. On actualise tous les écrans
        io.emit('mise_a_jour_partie', etatPartie);
    });



    // Déconnexion
    socket.on('disconnect', () => {
        console.log(`Déconnexion : ${socket.id}`);
        connexions = connexions.filter(c => c.id !== socket.id);
    }); // <-- Ceci ferme proprement 'disconnect'

}); 




// Fonction pour déplacer une carte vers l'inventaire d'un joueur
function deplacerCarte(niveauPaquet, indexCarte, roleJoueur) {
    let paquetSource;
    if (niveauPaquet === 1) paquetSource = etatPartie.paquetLv1;
    else if (niveauPaquet === 2) paquetSource = etatPartie.paquetLv2;
    else if (niveauPaquet === 3) paquetSource = etatPartie.paquetLv3;

    // On retire la carte de la rivière
    let carteAchetee = paquetSource.splice(indexCarte, 1)[0];
    
    // On change le propriétaire et on l'ajoute au joueur
    carteAchetee.owner = roleJoueur;
    etatPartie.joueurs[roleJoueur].paquet.push(carteAchetee);
}


function bougerPrivilege(roleBeneficiaire) {
    let joueur = etatPartie.joueurs[roleBeneficiaire];
    let roleAdversaire = (roleBeneficiaire === 'Player1') ? 'Player2' : 'Player1';
    let adversaire = etatPartie.joueurs[roleAdversaire];

    // 1. S'il reste des privilèges sur le plateau, on en prend un
    if (etatPartie.privileges.length > 0) {
        let priv = etatPartie.privileges.pop(); // Retire le dernier du plateau
        priv.owner = roleBeneficiaire;
        joueur.privileges.push(priv);
        console.log("privilege récupéré");
    } 
    // 2. Sinon, on en vole un à l'adversaire (s'il en a)
    else if (adversaire.privileges.length > 0) {
        let priv = adversaire.privileges.pop();
        priv.owner = roleBeneficiaire;
        joueur.privileges.push(priv);
        console.log("privilege volé");
    }
}


// Lancement du serveur
server.listen(3000, () => {
    console.log('Le serveur Splendor tourne sur le port 3000 !');
});
