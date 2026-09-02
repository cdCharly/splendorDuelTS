// Connexion au serveur (Remplacez par votre IP si besoin)
const socket = io("http://192.168.1.50:3000");

// Variables globales pour l'interface
let jetonsSelectionnes = [];
let monRole = "Spectateur";

// ==========================================
// 1. RÉCEPTION DES DONNÉES DU SERVEUR
// ==========================================

// Le serveur nous donne notre rôle (Player1 ou Player2)
socket.on('role_attribue', (role) => {
    monRole = role;
    console.log(`Je suis ${monRole}`);
});

// Le serveur nous envoie l'état officiel de la partie (le vrai plateau)
socket.on('mise_a_jour_partie', (etatServeur) => {
    console.log("Mise à jour reçue du serveur !");
    // On dessine le plateau et les cartes en utilisant UNIQUEMENT les données du serveur
    afficherPlateau(etatServeur.plateau);
    afficherPaquetCarte(etatServeur.paquet);
});

// ==========================================
// 2. AFFICHAGE (FRONT-END)
// ==========================================

function afficherPlateau(plateau) {
    const conteneur = document.getElementById("plateauAffichage");
    conteneur.innerHTML = ""; 
    jetonsSelectionnes = []; // On réinitialise la sélection à chaque mise à jour

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
        // Les jetons du coût ont été transformés en objets classiques par le réseau
        const texteCout = carte.cout.map(j => j.couleur).join(", ");
        paragraphe.innerHTML = `<strong>Carte ${index + 1}</strong> : Niveau ${carte.niveau} | Points : ${carte.points} | Coût : ${texteCout}`;
        conteneur.appendChild(paragraphe);
    });
}

// ==========================================
// 3. INTERACTIONS DU JOUEUR
// ==========================================

function cliquerJeton(ligne, colonne, jeton, elementHTML) {
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

// L'action finale est envoyée au serveur !
function validerPioche() {
    if (jetonsSelectionnes.length === 0) return;

    // On prépare juste les coordonnées à envoyer au serveur
    let demande = jetonsSelectionnes.map(choix => {
        return { ligne: choix.ligne, colonne: choix.colonne };
    });

    // On dit au serveur : "Voici les cases que je veux prendre"
    socket.emit('demande_pioche', demande);
}
