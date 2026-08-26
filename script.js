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



function creerPlateau(){
    plateau = [];

    // creer les 5 lignes
    for(i = 0; i < 5; i++){
        plateau.push([]);
    }

    // remplir le plateau vide

    for(i = 0; i < 5; i++){
        for(j = 0; j < 5; j++){
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

function piocherJeton(PLayer, Poche){}

function creerPaquet(){
    const paquet = [];
    const coutA = [new Jeton("Bleu", "Player1"), new Jeton("Bleu", "Player1")];
    const coutB = [new Jeton("Bleu", "Player1"), new Jeton("Vert", "Player1")];
    // test de push de cartes
    paquet.push(new Carte(1,1,coutA));
    paquet.push(new Carte(2,4,coutB));
    return paquet;
}

function creerPocheJeton(){
    const pocheJeton = [];

    // 2 Rose
    for(i = 0; i < 2; i++){
        pocheJeton.push(new Jeton("Rose", "nobody"));    
    }

    //3 Gold
    for(i = 0; i < 3; i++){
        pocheJeton.push(new Jeton("Gold", "nobody"));    
    }

    //4 Bleu
    for(i = 0; i < 4; i++){
        pocheJeton.push(new Jeton("Bleu", "nobody"));    
    }

    //4 Rouge
    for(i = 0; i < 4; i++){
        pocheJeton.push(new Jeton("Rouge", "nobody"));    
    }

    //4 Vert
    for(i = 0; i < 4; i++){
        pocheJeton.push(new Jeton("Vert", "nobody"));    
    }

    //4 Blanc
    for(i = 0; i < 4; i++){
        pocheJeton.push(new Jeton("Blanc", "nobody"));    
    }
    
    //4 Noir
    for(i = 0; i < 4; i++){
        pocheJeton.push(new Jeton("Noir", "nobody"));    
    }
    return pocheJeton;
}




function afficherPaquetCarte(paquet){
    // L'ID correspond au HTML
    const conteneur = document.getElementById("paquetAffichage");
    
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


// Fonction relais appelée par le bouton HTML
function declencherAffichage() {
    const paquetInit = creerPaquet();
    afficherPaquetCarte(paquetInit);
}
