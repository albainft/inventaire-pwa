// ID du Google Sheets (a remplir avec votre ID)
const SHEET_ID = '1g1803avEZ2aHa85WJAORtfF7NxMxwD7tfoKZORB75rg';

const CONFIG = {
  SHEET_DONNEES: 'donnees',
  SHEET_INVENTAIRE: 'Inventaire',
  SHEET_VENTES: 'Ventes',
  SHEET_PARAMETRES: 'Parametres',
  CELL_TAUX_TVA: 'B2'
};

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setWidth(420)
    .setHeight(850);
}

function ajouterDonnees(donnees) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheetInventaire = ss.getSheetByName(CONFIG.SHEET_INVENTAIRE);
    const sheetParametres = ss.getSheetByName(CONFIG.SHEET_PARAMETRES);

    // Recuperer taux TVA
    let tauxTVA = 0.20;
    try {
      const tauxCell = sheetParametres.getRange(CONFIG.CELL_TAUX_TVA).getValue();
      if (tauxCell) {
        if (typeof tauxCell === 'number') {
          tauxTVA = tauxCell > 1 ? tauxCell / 100 : tauxCell;
        } else {
          let tauxStr = tauxCell.toString().trim().replace('%', '').replace(',', '.');
          tauxTVA = parseFloat(tauxStr) / 100;
        }
      }
    } catch (e) {
      tauxTVA = 0.20;
    }

    // Validation
    if (!donnees.type || !donnees.marque || !donnees.couleur || 
        donnees.prixAchat === '' || donnees.prixVente === '') {
      return {
        success: false,
        message: 'Tous les champs obligatoires doivent etre remplis'
      };
    }

    const prixAchat = parseFloat(donnees.prixAchat);
    const prixVente = parseFloat(donnees.prixVente);

    if (isNaN(prixAchat) || isNaN(prixVente)) {
      return {
        success: false,
        message: 'Les prix doivent etre des nombres'
      };
    }

    // Trouver premiere ligne vide
    let newRow = 2;
    while (sheetInventaire.getRange(newRow, 1).getValue() !== '') {
      newRow++;
    }

    // Generer ID
    const idBase = (donnees.type.charAt(0) + donnees.marque.charAt(0) + donnees.couleur.charAt(0)).toUpperCase();
    const idNumber = genererNumeroSequentiel(idBase, sheetInventaire);
    const id = idBase + idNumber;

    // Calculer TVA
    let montantTVA = 0;
    if (donnees.tva === true || donnees.tva === 'true' || donnees.tva === 'oui') {
      const marge = prixVente - prixAchat;
      montantTVA = Math.round(marge * tauxTVA * 100) / 100;
    }

    // Date
    const dateEntree = new Date();

    // Inserer donnees
    const donneesPourInsert = [
      id,
      donnees.type,
      donnees.marque,
      donnees.couleur,
      donnees.cat001 || '',
      donnees.cat002 || '',
      donnees.cat003 || '',
      '',
      prixAchat,
      prixVente,
      donnees.tva === true || donnees.tva === 'true' || donnees.tva === 'oui' ? 'OUI' : 'NON',
      Math.round(tauxTVA * 100 * 100) / 100,
      Math.round(montantTVA * 100) / 100,
      dateEntree,
      '',
      '',
      ''
    ];

    sheetInventaire.getRange(newRow, 1, 1, donneesPourInsert.length).setValues([donneesPourInsert]);

    return {
      success: true,
      id: id,
      message: 'Article ajoute avec succes !'
    };

  } catch (error) {
    return {
      success: false,
      message: 'Erreur : ' + error.message
    };
  }
}

function genererNumeroSequentiel(idBase, sheet) {
  const valeurs = sheet.getRange('A:A').getValues();
  let maxNum = 0;

  for (let i = 0; i < valeurs.length; i++) {
    const cellValue = valeurs[i][0];
    if (cellValue && cellValue.toString().startsWith(idBase)) {
      const match = cellValue.toString().match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1]);
        if (num > maxNum) {
          maxNum = num;
        }
      }
    }
  }

  return String(maxNum + 1).padStart(3, '0');
}

function rechercherArticleParId(id) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_INVENTAIRE);
    const dataRange = sheet.getRange('A:Q');
    const values = dataRange.getValues();

    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const cellId = row[0];

      if (cellId === id || cellId.toString().trim() === id.toString().trim()) {
        return {
          success: true,
          data: {
            id: row[0],
            type: row[1],
            marque: row[2],
            couleur: row[3],
            prixVente: row[9]
          }
        };
      }
    }

    return {
      success: false,
      message: 'Article non trouve'
    };

  } catch (error) {
    return {
      success: false,
      message: 'Erreur : ' + error.message
    };
  }
}

function validerPanierBackend(articlesIds, montantReduction) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheetInventaire = ss.getSheetByName(CONFIG.SHEET_INVENTAIRE);
    
    // Creer sheet Ventes si n'existe pas
    let sheetVentes = null;
    try {
      sheetVentes = ss.getSheetByName(CONFIG.SHEET_VENTES);
    } catch (e) {
      sheetVentes = ss.insertSheet(CONFIG.SHEET_VENTES);
      sheetVentes.appendRow(['Date', 'Articles', 'Montant', 'Reduction', 'Total']);
    }

    const dataRange = sheetInventaire.getRange('A:Q');
    const values = dataRange.getValues();

    let compteur = 0;
    let montantTotal = 0;
    const dateAujourdhui = new Date();
    const articlesVendus = [];

    // Pour chaque article du panier
    articlesIds.forEach(id => {
      for (let i = 1; i < values.length; i++) {
        const row = values[i];
        const cellId = row[0];

        if (cellId === id || cellId.toString().trim() === id.toString().trim()) {
          const rowNumber = i + 1;

          // Colonne O (15) : Statut
          // Colonne P (16) : Date_vente
          const statutCell = sheetInventaire.getRange(rowNumber, 15);
          const dateVenteCell = sheetInventaire.getRange(rowNumber, 16);

          statutCell.setValue('vendu');
          dateVenteCell.setValue(dateAujourdhui);

          montantTotal += row[9];
          articlesVendus.push(row[0]);
          compteur++;

          break;
        }
      }
    });

    // Ajouter ligne vente
    const montantFinal = montantTotal - (montantReduction || 0);
    sheetVentes.appendRow([
      dateAujourdhui,
      articlesVendus.join(', '),
      montantTotal.toFixed(2),
      (montantReduction || 0).toFixed(2),
      montantFinal.toFixed(2)
    ]);

    return {
      success: true,
      message: compteur + ' article(s) vendu(s) - Total: ' + montantFinal.toFixed(2) + ' EUR'
    };

  } catch (error) {
    return {
      success: false,
      message: 'Erreur : ' + error.message
    };
  }
}
