// le premier qui se connecte sera la joueur 1

class Carte {
    constructor(niveau, points, cout, couleur){
        this.niveau = niveau;
        this.points = points;
        this.cout = cout;
        this.couleur = couleur;
    }
}

// owner : poche, player1, player2, plateau
class Jeton{
    constructor(couleur, owner){
        this.couleur = couleur;
        this.owner = owner;
    }
}


// le plateau est en 5x5
class Plateau {
    constructor() {
        // Initialisation d'une grille 5x5 vide
        this.grille = [
            [null, null, null, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null]
        ];
    }

    placerJeton(ligne, colonne, jeton) {
        // Permet de poser un objet Jeton à un endroit précis en verifiant la position libre ou non
        if (this.grille[ligne][colonne] === null) {
            this.grille[ligne][colonne] = jeton;
        }
    }
}

class Joueur {
    constructor(nom, paquet, poche){
        this.nom = nom;
        this.paquet = paquet;
        this.poche = poche;
    }
}


// variables globales

let jetonsSelectionnes = []; // Stockera les coordonnées des clics





function creerPlateau(){
    let plateau = [];

    // creer les 5 lignes
    for(let i = 0; i < 5; i++){
        plateau.push([]);
    }

    // remplir le plateau vide

    for(let i = 0; i < 5; i++){
        for(let j = 0; j < 5; j++){
            plateau[i][j] = null;
        }
    }

    // renvoyer le plateau vide
    return plateau;
}

function remplirPlateau(plateau, poche){
    // aide moi pour remplir cette fonction

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

        // 3. Vérifier si la case est vide ET s'il reste des jetons dans la poche
        if (plateau[ligne][colonne] === null && poche.length > 0) {
            
            // A. Tirer un index au hasard basé sur la taille actuelle de la poche
            let indexAleatoire = Math.floor(Math.random() * poche.length);
            
            // B. Récupérer ce jeton et le retirer de la poche (avec splice)
            let jetonPioche = poche.splice(indexAleatoire, 1)[0];
            
            // C. Mettre à jour son propriétaire
            jetonPioche.owner = "plateau";
            
            // D. Le placer sur la grille
            plateau[ligne][colonne] = jetonPioche;
        }
    }
    return plateau;
}


function afficherPlateau(plateau) {
    const conteneur = document.getElementById("plateauAffichage");
    conteneur.innerHTML = ""; // On vide la zone avant de la dessiner

    // On parcourt les 5 lignes et les 5 colonnes
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            // Création d'une case
            const caseDiv = document.createElement("div");
            caseDiv.classList.add("case"); // On lui donne le style CSS

            const jeton = plateau[i][j];
            
            // Si la case n'est pas vide, on affiche la couleur du jeton
            if (jeton !== null) {
                // On affiche la 1ère lettre de la couleur (ex: "B" pour Bleu)
                caseDiv.innerText = jeton.couleur.charAt(0); 
                
                // Bonus : On peut même changer la couleur du texte selon le jeton
                caseDiv.style.color = jeton.couleur.toLowerCase();

                caseDiv.onclick = function() {
                cliquerJeton(i, j, jeton, caseDiv);
    };
            }

            // On ajoute la case dans la grille HTML
            conteneur.appendChild(caseDiv);
        }
    }
}


function piocherJeton(PLayer, Poche){
    return null;
}

function creerPaquet(){
    const paquet = [];
    const coutA = [new Jeton("Blue", "Player1"), new Jeton("Blue", "Player1")];
    const coutB = [new Jeton("Blue", "Player1"), new Jeton("Green", "Player1")];
    // test de push de cartes
    paquet.push(new Carte(1,1,coutA));
    paquet.push(new Carte(2,4,coutB));
    return paquet;
}

function creerPocheJeton(){
    const pocheJeton = [];

    // 2 Rose
    for(i = 0; i < 2; i++){
        pocheJeton.push(new Jeton("Pink", "nobody"));    
    }

    //3 Gold
    for(i = 0; i < 3; i++){
        pocheJeton.push(new Jeton("Gold", "nobody"));    
    }

    //4 Bleu
    for(i = 0; i < 4; i++){
        pocheJeton.push(new Jeton("Blue", "nobody"));    
    }

    //4 Rouge
    for(i = 0; i < 4; i++){
        pocheJeton.push(new Jeton("Red", "nobody"));    
    }

    //4 Vert
    for(i = 0; i < 4; i++){
        pocheJeton.push(new Jeton("Green", "nobody"));    
    }

    //4 Blanc
    for(i = 0; i < 4; i++){
        pocheJeton.push(new Jeton("White", "nobody"));    
    }
    
    //4 Noir
    for(i = 0; i < 4; i++){
        pocheJeton.push(new Jeton("Black", "nobody"));    
    }
    return pocheJeton;
}




function afficherPaquetCarte(paquet){
    // L'ID correspond au HTML
    const conteneur = document.getElementById("paquet-affichage");
    
    // On vide le conteneur au cas où on clique plusieurs fois sur le bouton
    conteneur.innerHTML = ""; 

    paquet.forEach((carte, index) => {
        const paragraphe = document.createElement("p");
        
        // On transforme le tableau d'objets Jeton en une suite de mots (ex: "Bleu, Bleu")
        const texteCout = carte.cout.map(j => j.couleur).join(", ");
        
        paragraphe.innerHTML = `<strong>Carte ${index + 1}</strong> : Niveau ${carte.niveau} | Points : ${carte.points} | Coût : ${texteCout}`;
        
        // C'est ici que l'on insère l'élément dans le conteneur !
        conteneur.appendChild(paragraphe);
    });
}


function declencherAffichage() {
    // 1. Afficher les cartes (déjà fait)
    const paquetInit = creerPaquet();
    afficherPaquetCarte(paquetInit);

    // 2. Préparer et afficher le plateau
    let maPoche = creerPocheJeton();     // On crée le sac de jetons
    let monPlateauVide = creerPlateau(); // On crée la grille vide
    
    // On remplit la grille avec les jetons du sac
    let monPlateauRempli = remplirPlateau(monPlateauVide, maPoche); 
    
    // On dessine le résultat sur la page
    afficherPlateau(monPlateauRempli);
}


// renvoie un jeton par rapport à sa position et l'enleve du plateau
function pickJeton(plateau, x, y){
    const jetonPicked = plateau[x][y];
    plateau[x][y] = null;
    return jetonPicked;

}

function acheterCarte(carte, joueur){

    let besoin = {};
    carte.cout.forEach(
        jeton => {
            besoin[jeton.couleur] = (besoin[jeton.couleur] || 0) +1;
        }
    );


    let possessionsJoueur = {};
    joueur.poche.forEach(
        jeton => {
            possessionsJoueur[jeton.couleur] = (possessionsJoueur[jeton.couleur] || 0) +1;
        }
    );


    let achatPossible = true;
    for(const couleur in besoin){
        if(!possessionsJoueur[couleur] || possessionsJoueur[couleur] < besoin[couleur]){
            achatPossible = false;
            break;
        }
    }

    if (achatPossible){
        carte.owner = joueur.name;

        // retirer les jetons du joueur

        
    for (const couleur in besoin) {
        let quantiteARetirer = besoin[couleur];

        while (quantiteARetirer > 0) {
        const index = joueur.poche.findIndex(j => j.couleur === couleur);
        if (index !== -1) {
            joueur.poche.splice(index, 1);
            quantiteARetirer--;
            }
        }
    }
        // debug
        console.log("achat ok");
        return true;
    }
    else{
        // debug
        console.log("achat echec");
        return false;
    }

}



function cliquerJeton(ligne, colonne, jeton, elementHTML) {
    // Règle 1 : On ne peut pas prendre d'Or sur le plateau de base
    if (jeton.couleur === "Gold") {
        console.log("Impossible de prendre un jeton Or !");
        return;
    }

    // Vérifier si le jeton est déjà sélectionné (pour le désélectionner)
    const index = jetonsSelectionnes.findIndex(s => s.ligne === ligne && s.colonne === colonne);
    
    if (index !== -1) {
        // On le retire de la sélection et on enlève l'effet visuel
        jetonsSelectionnes.splice(index, 1);
        elementHTML.classList.remove("selectionne");
    } else {
        // Règle 2 : Maximum 3 jetons
        if (jetonsSelectionnes.length >= 3) {
            console.log("Vous ne pouvez sélectionner que 3 jetons maximum.");
            return;
        }

        // On simule l'ajout pour voir si c'est valide
        jetonsSelectionnes.push({ ligne, colonne, jeton, elementHTML });

        // Règle 3 : Alignement et contiguïté
        if (verifierAlignement(jetonsSelectionnes)) {
            elementHTML.classList.add("selectionne"); // C'est valide, on illumine la case
        } else {
            jetonsSelectionnes.pop(); // Ce n'est pas valide, on annule l'ajout
            console.log("Les jetons doivent être adjacents et alignés !");
        }
    }
}

// L'algorithme mathématique pour vérifier l'alignement
function verifierAlignement(selection) {
    if (selection.length <= 1) return true;

    // On trie les jetons sélectionnés (de haut en bas, puis de gauche à droite)
    const tri = [...selection].sort((a, b) => (a.ligne !== b.ligne) ? a.ligne - b.ligne : a.colonne - b.colonne);

    // Calcul de la direction (vecteur) entre le 1er et le 2ème jeton
    let deltaLigne = tri[1].ligne - tri[0].ligne;
    let deltaColonne = tri[1].colonne - tri[0].colonne;

    // Ils doivent être collés (la différence max de coordonnées doit être 1)
    if (Math.abs(deltaLigne) > 1 || Math.abs(deltaColonne) > 1) return false;

    // Si on a 3 jetons, la direction entre le 2ème et le 3ème doit être EXACTEMENT la même
    if (tri.length === 3) {
        let deltaLigne2 = tri[2].ligne - tri[1].ligne;
        let deltaColonne2 = tri[2].colonne - tri[1].colonne;
        if (deltaLigne !== deltaLigne2 || deltaColonne !== deltaColonne2) return false;
    }

    return true;
}



function validerPioche() {
    if (jetonsSelectionnes.length === 0) return;

    // On parcourt la sélection
    jetonsSelectionnes.forEach(choix => {
        // On utilise la méthode pickJeton que vous aviez préparée !
        let jetonRecupere = pickJeton(monPlateauRempli, choix.ligne, choix.colonne);
        
        // TODO : Ajouter 'jetonRecupere' dans la poche du joueur courant
        console.log(`Jeton ${jetonRecupere.couleur} récupéré !`);
    });

    // On vide la sélection et on redessine le plateau
    jetonsSelectionnes = [];
    afficherPlateau(monPlateauRempli);
}
