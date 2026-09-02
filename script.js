// ==========================================
// 1. CONNEXION AU SERVEUR
// ==========================================
// Remplacer l'IP par celle de votre Proxmox
const socket = io("http://192.168.1.50:3000");

// Variables globales côté client
let monRole = "Spectateur";
let jetonsSelectionnes = []; // Stocke les clics locaux avant validation

// ==========================================
// 2. ÉCOUTE DES MESSAGES DU SERVEUR
// ==========================================

// Le serveur nous informe de notre rôle (Player1, Player2, ou Spectateur)
socket.on('role_attribue', (role) => {
    monRole = role;
    console.log("Je suis connecté en tant que : " + monRole);
    
    // On l'affiche sur la page pour savoir qui on est
    document.getElementById("plateauName").innerText = `Plateau de Jeu (${monRole})`;
});

// Le serveur nous envoie l'état officiel de la partie
socket.on('mise_a_jour_partie', (etatPartie) => {
    console.log("Nouvelle mise à jour reçue du serveur !");
    
    // On vide notre sélection locale pour éviter les bugs visuels
    jetonsSelectionnes = [];
    
    // On met à jour l'affichage avec les données du serveur
    afficherPlateau(etatPartie.plateau);
    afficherPaquetCarte(etatPartie.paquet);
});

// ==========================================
// 3. FONCTIONS D'AFFICHAGE (LES VUES)
// ==========================================

function afficherPlateau(plateau) {
    const conteneur = document.getElementById("plateauAffichage");
    conteneur.innerHTML = ""; // On vide la zone avant de dessiner

    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            const caseDiv = document.createElement("div");
            caseDiv.classList.add("case");

            const jeton = plateau[i][j];
            
            if (jeton !== null) {
                caseDiv.innerText = jeton.couleur.charAt(0); 
                caseDiv.style.color = jeton.couleur.toLowerCase();

                // On rend la case cliquable
                caseDiv.onclick = function() {
                    cliquerJeton(i, j, jeton, caseDiv);
                };
            }

            conteneur.appendChild(caseDiv);
        }
    }
}

function afficherPaquetCarte(paquet) {
    const conteneur = document.getElementById("paquet-affichage");
    conteneur.innerHTML = ""; 

    paquet.forEach((carte, index) => {
        const paragraphe = document.createElement("p");
        const texteCout = carte.cout.map(j => j.couleur).join(", ");
        paragraphe.innerHTML = `<strong>Carte ${index + 1}</strong> : Niveau ${carte.niveau} | Points : ${carte.points} | Coût : ${texteCout}`;
        conteneur.appendChild(paragraphe);
    });
}

// ==========================================
// 4. INTERACTIONS DU JOUEUR (CLICS)
// ==========================================

function cliquerJeton(ligne, colonne, jeton, elementHTML) {
    // Les spectateurs ne peuvent pas jouer
    if (monRole === "Spectateur") {
        console.log("Vous êtes spectateur !");
        return;
    }

    if (jeton.couleur === "Gold") {
        console.log("Impossible de prendre un jeton Or !");
        return;
    }

    const index = jetonsSelectionnes.findIndex(s => s.ligne === ligne && s.colonne === colonne);
    
    if (index !== -1) {
        jetonsSelectionnes.splice(index, 1);
        elementHTML.classList.remove("selectionne");
    } else {
        if (jetonsSelectionnes.length >= 3) {
            console.log("Vous ne pouvez sélectionner que 3 jetons maximum.");
            return;
        }

        jetonsSelectionnes.push({ ligne, colonne, jeton, elementHTML });

        if (verifierAlignement(jetonsSelectionnes)) {
            elementHTML.classList.add("selectionne"); 
        } else {
            jetonsSelectionnes.pop(); 
            console.log("Les jetons doivent être adjacents et alignés !");
        }
    }
}

function verifierAlignement(selection) {
    if (selection.length <= 1) return true;

    const tri = [...selection].sort((a, b) => (a.ligne !== b.ligne) ? a.ligne - b.ligne : a.colonne - b.colonne);

    let deltaLigne = tri[1].ligne - tri[0].ligne;
    let deltaColonne = tri[1].colonne - tri[0].colonne;

    if (Math.abs(deltaLigne) > 1 || Math.abs(deltaColonne) > 1) return false;

    if (tri.length === 3) {
        let deltaLigne2 = tri[2].ligne - tri[1].ligne;
        let deltaColonne2 = tri[2].colonne - tri[1].colonne;
        if (deltaLigne !== deltaLigne2 || deltaColonne !== deltaColonne2) return false;
    }

    return true;
}

// ==========================================
// 5. ENVOI DES ACTIONS AU SERVEUR
// ==========================================

function validerPioche() {
    if (jetonsSelectionnes.length === 0) return;

    // On prépare un tableau simplifié (juste les coordonnées) à envoyer au serveur
    const demande = jetonsSelectionnes.map(choix => {
        return { ligne: choix.ligne, colonne: choix.colonne };
    });

    // On envoie l'action à notre serveur Node.js !
    socket.emit('demande_pioche', demande);

    // On nettoie notre interface en attendant la réponse du serveur
    jetonsSelectionnes.forEach(choix => {
        choix.elementHTML.classList.remove("selectionne");
    });
    jetonsSelectionnes = [];
}