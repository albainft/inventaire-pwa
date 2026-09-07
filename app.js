if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js').catch(err => {
    console.log('Service worker not available');
  });
}

const GAS_URL = 'https://script.google.com/macros/s/AKfycbwzFoIr9qAusAPQ7ZtNGVRSUulicyaXaZua9oJRh7JBGKgGNn2JAxnFbARjOkby1j_T/exec';

let panier = [];
let cameraActive = false;
let html5QrcodeScanner = null;

document.querySelectorAll('.tab-button').forEach(button => {
  button.addEventListener('click', function() {
    const tabName = this.getAttribute('data-tab');
    document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    this.classList.add('active');
    document.getElementById(tabName).classList.add('active');
    if (tabName !== 'panier' && cameraActive) {
      arreterCamera();
    }
  });
});

document.getElementById('btnAjouter').addEventListener('click', function() {
  const type = document.getElementById('type').value.trim();
  const marque = document.getElementById('marque').value.trim();
  const couleur = document.getElementById('couleur').value.trim();
  const cat001 = document.getElementById('cat001').value.trim();
  const cat002 = document.getElementById('cat002').value.trim();
  const cat003 = document.getElementById('cat003').value.trim();
  const prixAchat = document.getElementById('prixAchat').value.trim();
  const prixVente = document.getElementById('prixVente').value.trim();
  const tva = document.getElementById('tva').checked;

  if (!type || !marque || !couleur || !prixAchat || !prixVente) {
    afficherMessageAjouter('Tous les champs obligatoires requis', 'error');
    return;
  }

  document.getElementById('loadingAjouter').classList.add('show');

  const donnees = {
    type: type,
    marque: marque,
    couleur: couleur,
    cat001: cat001,
    cat002: cat002,
    cat003: cat003,
    prixAchat: parseFloat(prixAchat),
    prixVente: parseFloat(prixVente),
    tva: tva
  };

  fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify({
      action: 'ajouterDonnees',
      donnees: donnees
    })
  })
  .then(response => response.json())
  .then(result => {
    document.getElementById('loadingAjouter').classList.remove('show');
    if (result.success) {
      afficherMessageAjouter('Article ajoute! ID: ' + result.id, 'success');
      reinitialiserFormulaire();
    } else {
      afficherMessageAjouter('Erreur: ' + result.message, 'error');
    }
  })
  .catch(error => {
    document.getElementById('loadingAjouter').classList.remove('show');
    afficherMessageAjouter('Erreur: ' + error, 'error');
  });
});

document.getElementById('btnNouveau').addEventListener('click', function() {
  reinitialiserFormulaire();
  document.getElementById('messageAjouter').className = 'message';
});

function reinitialiserFormulaire() {
  document.getElementById('type').value = '';
  document.getElementById('marque').value = '';
  document.getElementById('couleur').value = '';
  document.getElementById('cat001').value = '';
  document.getElementById('cat002').value = '';
  document.getElementById('cat003').value = '';
  document.getElementById('prixAchat').value = '';
  document.getElementById('prixVente').value = '';
  document.getElementById('tva').checked = false;
  document.getElementById('type').focus();
}

function afficherMessageAjouter(texte, type) {
  const messageDiv = document.getElementById('messageAjouter');
  messageDiv.textContent = texte;
  messageDiv.className = 'message ' + type;
}

let panierLocal = JSON.parse(localStorage.getItem('panier')) || [];
panier = panierLocal;

document.getElementById('scanInput').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    const id = this.value.trim();
    if (id) {
      ajouterArticleAuPanier(id);
      this.value = '';
    }
  }
});

document.getElementById('btnCamera').addEventListener('click', function() {
  demarrerCamera();
});

document.getElementById('btnStopCamera').addEventListener('click', function() {
  arreterCamera();
});

document.getElementById('reductionPourcent').addEventListener('change', function() {
  calculerTotalPanier();
});

document.getElementById('btnViderPanier').addEventListener('click', function() {
  panier = [];
  sauvegarderPanierLocal();
  afficherPanier();
});

document.getElementById('btnValiderPanier').addEventListener('click', function() {
  validerPanier();
});

function demarrerCamera() {
  const btnCamera = document.getElementById('btnCamera');
  const btnStopCamera = document.getElementById('btnStopCamera');

  html5QrcodeScanner = new Html5Qrcode('qr-reader');

  Html5Qrcode.getCameras().then(devices => {
    if (devices && devices.length) {
      const cameraId = devices[0].id;
      html5QrcodeScanner.start(
        cameraId,
        { fps: 10, qrbox: { width: 250, height: 250 } },
        onScanSuccess,
        onScanError
      ).then(() => {
        cameraActive = true;
        btnCamera.style.display = 'none';
        btnStopCamera.style.display = 'block';
        afficherMessagePanier('Camera activee', 'success');
      }).catch(err => {
        afficherMessagePanier('Erreur camera: ' + err, 'error');
      });
    }
  }).catch(err => {
    afficherMessagePanier('Acces camera refuse', 'error');
  });
}

function arreterCamera() {
  const btnCamera = document.getElementById('btnCamera');
  const btnStopCamera = document.getElementById('btnStopCamera');

  if (html5QrcodeScanner) {
    html5QrcodeScanner.stop().then(() => {
      cameraActive = false;
      btnCamera.style.display = 'block';
      btnStopCamera.style.display = 'none';
    });
  }
}

function onScanSuccess(decodedText) {
  ajouterArticleAuPanier(decodedText.trim());
}

function onScanError() {}

function ajouterArticleAuPanier(id) {
  fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify({
      action: 'rechercherArticleParId',
      id: id
    })
  })
  .then(response => response.json())
  .then(result => {
    if (result.success) {
      const article = result.data;
      const articleExistant = panier.find(a => a.id === id);
      if (articleExistant) {
        articleExistant.quantite++;
      } else {
        panier.push({
          id: article.id,
          type: article.type,
          marque: article.marque,
          couleur: article.couleur,
          prixVente: article.prixVente,
          quantite: 1
        });
      }
      sauvegarderPanierLocal();
      afficherPanier();
      afficherMessagePanier('Article ajoute', 'success');
      setTimeout(() => {
        document.getElementById('messagePanier').className = 'message';
      }, 2000);
    } else {
      afficherMessagePanier('Article non trouve', 'error');
    }
  })
  .catch(error => {
    afficherMessagePanier('Erreur: ' + error, 'error');
  });
}

function afficherPanier() {
  const panierList = document.getElementById('panierList');
  const panierEmpty = document.getElementById('panierEmpty');
  const panierSummary = document.getElementById('panierSummary');

  panierList.innerHTML = '';

  if (panier.length === 0) {
    panierEmpty.style.display = 'block';
    panierSummary.classList.remove('show');
    return;
  }

  panierEmpty.style.display = 'none';
  panierSummary.classList.add('show');

  panier.forEach((article, index) => {
    const div = document.createElement('div');
    div.className = 'panier-item';
    const sousTotal = (article.prixVente * article.quantite).toFixed(2);
    div.innerHTML = `
      <div class="panier-item-header">
        <div class="panier-item-info">
          <div class="panier-item-id">${article.id}</div>
          <div class="panier-item-details">${article.marque} - ${article.couleur}</div>
        </div>
        <button class="panier-item-remove" onclick="supprimerDuPanier(${index})">Supprimer</button>
      </div>
      <div class="panier-item-inputs">
        <div class="panier-item-input">
          <input type="number" value="${article.quantite}" min="1" onchange="modifierQuantite(${index}, this.value)">
        </div>
        <div class="panier-item-input">
          <input type="number" value="${article.prixVente}" step="0.01" min="0" onchange="modifierPrix(${index}, this.value)">
        </div>
      </div>
      <div class="panier-item-total">Sous-total: ${sousTotal} EUR</div>
    `;
    panierList.appendChild(div);
  });

  calculerTotalPanier();
}

function supprimerDuPanier(index) {
  panier.splice(index, 1);
  sauvegarderPanierLocal();
  afficherPanier();
}

function modifierQuantite(index, quantite) {
  panier[index].quantite = Math.max(1, parseInt(quantite) || 1);
  sauvegarderPanierLocal();
  afficherPanier();
}

function modifierPrix(index, prix) {
  panier[index].prixVente = Math.max(0, parseFloat(prix) || 0);
  sauvegarderPanierLocal();
  afficherPanier();
}

function calculerTotalPanier() {
  let sousTotal = 0;
  panier.forEach(article => {
    sousTotal += article.prixVente * article.quantite;
  });

  const reductionPourcent = parseFloat(document.getElementById('reductionPourcent').value) || 0;
  const montantReduction = (sousTotal * reductionPourcent) / 100;
  const total = sousTotal - montantReduction;

  document.getElementById('sousTotal').textContent = sousTotal.toFixed(2) + ' EUR';
  document.getElementById('montantReduction').textContent = montantReduction.toFixed(2) + ' EUR';
  document.getElementById('totalFinal').textContent = total.toFixed(2) + ' EUR';
}

function validerPanier() {
  if (panier.length === 0) {
    afficherMessagePanier('Panier vide', 'error');
    return;
  }

  document.getElementById('loadingPanier').classList.add('show');

  const articlesIds = panier.map(a => a.id);
  const montantReduction = parseFloat(document.getElementById('reductionPourcent').value) || 0;

  fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify({
      action: 'validerPanierBackend',
      articlesIds: articlesIds,
      montantReduction: montantReduction
    })
  })
  .then(response => response.json())
  .then(result => {
    document.getElementById('loadingPanier').classList.remove('show');
    if (result.success) {
      afficherMessagePanier(result.message, 'success');
      panier = [];
      sauvegarderPanierLocal();
      afficherPanier();
      document.getElementById('reductionPourcent').value = '0';
    } else {
      afficherMessagePanier(result.message, 'error');
    }
  })
  .catch(error => {
    document.getElementById('loadingPanier').classList.remove('show');
    afficherMessagePanier('Erreur: ' + error, 'error');
  });
}

function afficherMessagePanier(texte, type) {
  const messageDiv = document.getElementById('messagePanier');
  messageDiv.textContent = texte;
  messageDiv.className = 'message ' + type;
}

function sauvegarderPanierLocal() {
  localStorage.setItem('panier', JSON.stringify(panier));
}

document.addEventListener('DOMContentLoaded', function() {
  afficherPanier();
  document.getElementById('type').focus();
});
