// Connexion au serveur (Remplacez par votre IP si besoin)
// const socket = io("http://192.168.1.50:3000"); // en local ssur la vm splendorduel
const socket = io({
    path: "/splendor/socket.io/"
});

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




// fonction privilèges





function afficherRivieres(etatServeur) {
    const colLv1 = document.getElementById('colonneLv1');
    const colLv2 = document.getElementById('colonneLv2');
    const colLv3 = document.getElementById('colonneLv3');

    // 1. On réinitialise les colonnes en ne gardant que l'image du dos de la pioche
    colLv1.innerHTML = `<div class="dos-pioche" style="background-image: url('apercus/cartelv1.png');"></div>`;
    colLv2.innerHTML = `<div class="dos-pioche" style="background-image: url('apercus/cartelv2.png');"></div>`;
    colLv3.innerHTML = `<div class="dos-pioche" style="background-image: url('apercus/cartelv3.png');"></div>`;

    // 2. Boucle pour le Niveau 1 (On affiche les 5 premières cartes maximum)
    let maxLv1 = Math.min(5, etatServeur.paquetLv1.length);
    for (let i = 0; i < maxLv1; i++) {
        colLv1.appendChild(creerElementCarte(etatServeur.paquetLv1[i], i));
    }

    // 3. Boucle pour le Niveau 2 (On affiche 4 cartes maximum)
    let maxLv2 = Math.min(4, etatServeur.paquetLv2.length);
    for (let i = 0; i < maxLv2; i++) {
        colLv2.appendChild(creerElementCarte(etatServeur.paquetLv2[i], i));
    }

    // 4. Boucle pour le Niveau 3 (On affiche 3 cartes maximum)
    let maxLv3 = Math.min(3, etatServeur.paquetLv3.length);
    for (let i = 0; i < maxLv3; i++) {
        colLv3.appendChild(creerElementCarte(etatServeur.paquetLv3[i], i));
    }
}




// Le serveur nous envoie l'état officiel de la partie (le vrai plateau)
socket.on('mise_a_jour_partie', (etatServeur) => {
    console.log("Mise à jour reçue du serveur !");
    afficherPlateau(etatServeur.plateau);
    // afficherPaquetCarte(etatServeur.paquet);

    afficherInventaires(etatServeur.joueurs);
    afficherRivieres(etatServeur);
    afficherPrivileges(etatServeur);
    
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
    // 1. On récupère toutes les zones HTML
    const pocheLocale = document.getElementById("poche-locale");
    const pocheAdversaire = document.getElementById("poche-adversaire");
    const paquetLocal = document.getElementById("paquet-local");
    const paquetAdversaire = document.getElementById("paquet-adversaire");
    const privLocale = document.getElementById("privileges-local");
    const privAdversaire = document.getElementById("privileges-adversaire");
    
    // 2. On vide tout avant de redessiner
    pocheLocale.innerHTML = ""; 
    pocheAdversaire.innerHTML = "";
    paquetLocal.innerHTML = "";
    paquetAdversaire.innerHTML = "";
    privLocale.innerHTML = "";
    privAdversaire.innerHTML = "";

    // 3. Fonctions outils pour dessiner les éléments
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

    function creerElementPrivilege() {
        const div = document.createElement("div");
        div.classList.add("privilege-visuel");
        div.style.backgroundImage = "url('apercus/privilege.png')";
        return div;
    }

    // 4. Déduction des rôles
    let monId = monRole; 
    let adversaireId = (monRole === "Player1") ? "Player2" : "Player1";

    if (monRole === "Spectateur") {
        monId = "Player1";
        adversaireId = "Player2";
        document.getElementById("titre-local").innerText = "Joueur 1";
        document.getElementById("titre-adversaire").innerText = "Joueur 2";
    }

    // 5. Remplissage de mon inventaire (en bas)
    if (joueurs[monId]) {
        joueurs[monId].privileges.forEach(() => {
            privLocale.appendChild(creerElementPrivilege());
        });

        joueurs[monId].poche.forEach(jeton => {
            pocheLocale.appendChild(creerElementJeton(jeton));
        });

        joueurs[monId].paquet.forEach(carte => {
            paquetLocal.appendChild(creerElementCarte(carte)); // Pas d'index envoyé = pas cliquable
        });
    }

    // 6. Remplissage de l'inventaire adverse (en haut à droite)
    if (joueurs[adversaireId]) {
        joueurs[adversaireId].privileges.forEach(() => {
            privAdversaire.appendChild(creerElementPrivilege());
        });

        joueurs[adversaireId].poche.forEach(jeton => {
            pocheAdversaire.appendChild(creerElementJeton(jeton));
        });

        joueurs[adversaireId].paquet.forEach(carte => {
            paquetAdversaire.appendChild(creerElementCarte(carte));
        });
    }
}



function creerElementCarte(carte, indexCarte) {
    const divCarte = document.createElement("div");
    divCarte.classList.add("carte-visible");

    // 1. Gérer la couleur de fond
    let couleurFond = carte.couleur.toLowerCase();
    if (couleurFond === "joker") couleurFond = "#888888"; // Gris pour les cartes neutres
    if (couleurFond === "white") couleurFond = "#e0e0e0"; // Gris très clair pour le blanc
    if (couleurFond === "pink") couleurFond = "#ffb6c1"; 
    divCarte.style.backgroundColor = couleurFond;

    // 2. Afficher les points (en haut à gauche)
    if (carte.points > 0) {
        const divPoints = document.createElement("div");
        divPoints.classList.add("carte-points");
        divPoints.innerText = carte.points;
        divCarte.appendChild(divPoints);
    }

    // 3. Afficher le coût (en bas à gauche)
    const divCout = document.createElement("div");
    divCout.classList.add("carte-cout");

    // On crée un petit point pour chaque jeton du coût
    carte.cout.forEach(jeton => {
        const point = document.createElement("div");
        point.classList.add("point-cout");
        
        // La couleur du point correspond au jeton demandé 
        // (remplacez par point.style.backgroundColor = "red" si vous voulez que tout soit strictement rouge)
        let couleurJeton = jeton.couleur.toLowerCase();
        if (couleurJeton === "white") couleurJeton = "white";
        
        point.style.backgroundColor = couleurJeton;
        divCout.appendChild(point);
    });

    if (indexCarte !== undefined) {
        divCarte.onclick = function() {
            socket.emit('demande_achat_carte', { 
                niveau: carte.niveau, 
                index: indexCarte 
            });
        };
    } else {
        // C'est une carte dans l'inventaire, on retire le curseur "cliquable"
        divCarte.style.cursor = "default";
        // Optionnel : on la réduit légèrement pour gagner de la place
        divCarte.style.transform = "scale(0.8)"; 
        divCarte.style.transformOrigin = "top left";
        divCarte.style.marginRight = "-15px"; // Les cartes se chevauchent un peu
        divCarte.style.marginBottom = "-20px";
    }

    divCarte.appendChild(divCout);
    return divCarte;
}



function afficherPrivileges(etatServeur) {
    const zonePlateau = document.getElementById("zone-privileges-plateau");
    zonePlateau.innerHTML = "";

    // 1. Affiche les privilèges restants sur le plateau
    etatServeur.privileges.forEach(() => {
        const div = document.createElement("div");
        div.classList.add("privilege-visuel");
        div.style.backgroundImage = "url('apercus/privilege.png')";
        zonePlateau.appendChild(div);
    });
}
