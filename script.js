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
    afficherPlateau(etatServeur.plateau);
    afficherPaquetCarte(etatServeur.paquet);

    afficherInventaires(etatServeur.joueurs);
    
    if(monRole === etatServeur.tourActuel){
        console.log("je joue");
    }
    else{
        console.log("à l'autre joueur de jouer");
    }
    
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
    // 1. Applique la couleur du jeton comme fond d'écran de la case
    caseDiv.style.backgroundColor = jeton.couleur.toLowerCase();
    
    // 2. Adapte la couleur du texte pour qu'il reste lisible
    if (jeton.couleur === "White" || jeton.couleur === "Gold") {
        caseDiv.style.color = "black";
    } else {
        caseDiv.style.color = "white";
    }
    
    // 3. Affiche la première lettre
    caseDiv.innerText = jeton.couleur.charAt(0); 

    // 4. Rend le jeton cliquable
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


function afficherInventaires(joueurs) {
    const pocheJ1 = document.getElementById("poche-j1");
    const pocheJ2 = document.getElementById("poche-j2");
    
    pocheJ1.innerHTML = ""; // On vide avant de redessiner
    pocheJ2.innerHTML = "";

    // Fonction outil pour créer le code HTML d'un jeton
    function creerElementJeton(jeton) {
        const div = document.createElement("div");
        div.classList.add("jeton-poche");
        div.style.backgroundColor = jeton.couleur.toLowerCase();
        
        if (jeton.couleur === "White" || jeton.couleur === "Gold") {
            div.style.color = "black";
        } else {
            div.style.color = "white";
        }
        div.innerText = jeton.couleur.charAt(0);
        return div;
    }

    // Si le joueur 1 existe, on dessine ses jetons
    if (joueurs['Player1']) {
        joueurs['Player1'].poche.forEach(jeton => {
            pocheJ1.appendChild(creerElementJeton(jeton));
        });
    }

    // Si le joueur 2 existe, on dessine ses jetons
    if (joueurs['Player2']) {
        joueurs['Player2'].poche.forEach(jeton => {
            pocheJ2.appendChild(creerElementJeton(jeton));
        });
    }
}
