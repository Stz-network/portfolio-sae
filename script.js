// ============================================================
//  script.js  —  Gestion des étudiants (base de données JSON)
//  Ce fichier lit etudiants.json et expose des fonctions CRUD
// ============================================================

let etudiants = [];

// ── Chargement initial ───────────────────────────────────────
async function chargerEtudiants() {
  const response = await fetch('etudiants.json');
  etudiants = await response.json();
  console.log(`${etudiants.length} étudiants chargés.`);
  afficherEtudiants(etudiants);
  initialiserRecherche();
}

// ── Afficher tous les étudiants dans le tableau HTML ─────────
function afficherEtudiants(liste) {
  const tbody = document.querySelector('#tableau-etudiants tbody');
  tbody.innerHTML = '';

  liste.forEach(e => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${e.id}</td>
      <td>${e.nom}</td>
      <td>${e.prenom}</td>
      <td>${e.adresse_principale}</td>
      <td>${e.adresse_secondaire || '—'}</td>
      <td>${e.date_debut_fin_principale}</td>
      <td>${e.date_debut_fin_secondaire || '—'}</td>
      <td>${e.groupe}</td>
      <td>
        <button onclick="modifierEtudiant(${e.id})">✏️ Modifier</button>
        <button onclick="supprimerEtudiant(${e.id})">🗑️ Supprimer</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ── Initialiser la recherche avec autocomplétion ─────────────
function initialiserRecherche() {
  const input = document.getElementById('recherche-input');
  const suggestions = document.getElementById('suggestions');

  if (!input || !suggestions) return;

  // Frappe dans le champ de recherche
  input.addEventListener('input', () => {
    const terme = input.value.trim();

    if (terme.length === 0) {
      fermerSuggestions();
      afficherEtudiants(etudiants);
      return;
    }

    const resultats = rechercherEtudiants(terme);
    afficherSuggestions(resultats, terme, suggestions, input);
    afficherEtudiants(resultats);
  });

  // Fermer les suggestions si clic en dehors
  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !suggestions.contains(e.target)) {
      fermerSuggestions();
    }
  });

  // Navigation clavier dans les suggestions
  input.addEventListener('keydown', (e) => {
    const items = suggestions.querySelectorAll('.suggestion-item');
    const actif = suggestions.querySelector('.suggestion-item.actif');
    let index = Array.from(items).indexOf(actif);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (index < items.length - 1) index++;
      else index = 0;
      items.forEach(i => i.classList.remove('actif'));
      items[index]?.classList.add('actif');
      items[index]?.scrollIntoView({ block: 'nearest' });

    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (index > 0) index--;
      else index = items.length - 1;
      items.forEach(i => i.classList.remove('actif'));
      items[index]?.classList.add('actif');
      items[index]?.scrollIntoView({ block: 'nearest' });

    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (actif) {
        actif.click();
      } else {
        fermerSuggestions();
      }

    } else if (e.key === 'Escape') {
      fermerSuggestions();
    }
  });
}

// ── Afficher la liste des suggestions ────────────────────────
function afficherSuggestions(resultats, terme, suggestions, input) {
  suggestions.innerHTML = '';

  if (resultats.length === 0) {
    suggestions.innerHTML = '<div class="suggestion-vide">Aucun résultat trouvé</div>';
    suggestions.style.display = 'block';
    return;
  }

  // Limiter à 8 suggestions maximum
  const limite = resultats.slice(0, 8);

  limite.forEach(e => {
    const nomComplet = `${e.nom} ${e.prenom}`.trim();
    const div = document.createElement('div');
    div.className = 'suggestion-item';

    // Mettre en gras la partie correspondant à la recherche
    div.innerHTML = surlignerTerme(nomComplet.toUpperCase(), terme.toUpperCase());
    div.setAttribute('data-id', e.id);

    div.addEventListener('mousedown', (ev) => {
      ev.preventDefault(); // empêche le blur sur l'input
      input.value = nomComplet;
      fermerSuggestions();
      afficherEtudiants([e]);
    });

    suggestions.appendChild(div);
  });

  // Afficher le nombre total si plus de 8
  if (resultats.length > 8) {
    const plus = document.createElement('div');
    plus.className = 'suggestion-plus';
    plus.textContent = `+ ${resultats.length - 8} autre(s) résultat(s)`;
    suggestions.appendChild(plus);
  }

  suggestions.style.display = 'block';
}

// ── Mettre en gras le terme recherché dans le texte ──────────
function surlignerTerme(texte, terme) {
  if (!terme) return texte;
  const index = texte.indexOf(terme);
  if (index === -1) return texte;
  return (
    texte.slice(0, index) +
    `<strong>${texte.slice(index, index + terme.length)}</strong>` +
    texte.slice(index + terme.length)
  );
}

// ── Fermer le panneau de suggestions ─────────────────────────
function fermerSuggestions() {
  const suggestions = document.getElementById('suggestions');
  if (suggestions) {
    suggestions.style.display = 'none';
    suggestions.innerHTML = '';
  }
}

// ── Rechercher par nom ou prénom (retourne un tableau) ────────
function rechercherEtudiants(terme) {
  const t = terme.toLowerCase();
  return etudiants.filter(e =>
    e.nom.toLowerCase().includes(t) ||
    e.prenom.toLowerCase().includes(t)
  );
}

// ── Filtrer par groupe ───────────────────────────────────────
function filtrerParGroupe(groupe) {
  if (!groupe) {
    afficherEtudiants(etudiants);
    return;
  }
  const resultats = etudiants.filter(e => e.groupe === parseInt(groupe));
  afficherEtudiants(resultats);
}

// ── Ajouter un étudiant ──────────────────────────────────────
function ajouterEtudiant(nouvelEtudiant) {
  const newId = etudiants.length > 0
    ? Math.max(...etudiants.map(e => e.id)) + 1
    : 1;

  const etudiant = { id: newId, ...nouvelEtudiant };
  etudiants.push(etudiant);
  afficherEtudiants(etudiants);
  sauvegarderJSON();
  console.log(`Étudiant ajouté :`, etudiant);
}

// ── Modifier un étudiant (par id) ────────────────────────────
function modifierEtudiant(id) {
  const etudiant = etudiants.find(e => e.id === id);
  if (!etudiant) return alert('Étudiant introuvable.');

  document.getElementById('form-nom').value               = etudiant.nom;
  document.getElementById('form-prenom').value            = etudiant.prenom;
  document.getElementById('form-adresse-principale').value = etudiant.adresse_principale;
  document.getElementById('form-adresse-secondaire').value = etudiant.adresse_secondaire;
  document.getElementById('form-date-principale').value   = etudiant.date_debut_fin_principale;
  document.getElementById('form-date-secondaire').value   = etudiant.date_debut_fin_secondaire;
  document.getElementById('form-groupe').value            = etudiant.groupe;

  document.getElementById('form-id').value = id;
  document.getElementById('form-titre').textContent = `Modifier l'étudiant #${id}`;
  document.getElementById('formulaire').style.display = 'block';
}

// ── Sauvegarder les modifications du formulaire ──────────────
function sauvegarderModification() {
  const id = parseInt(document.getElementById('form-id').value);
  const index = etudiants.findIndex(e => e.id === id);
  if (index === -1) return;

  etudiants[index] = {
    id,
    nom:                       document.getElementById('form-nom').value,
    prenom:                    document.getElementById('form-prenom').value,
    adresse_principale:        document.getElementById('form-adresse-principale').value,
    adresse_secondaire:        document.getElementById('form-adresse-secondaire').value,
    date_debut_fin_principale: document.getElementById('form-date-principale').value,
    date_debut_fin_secondaire: document.getElementById('form-date-secondaire').value,
    groupe:                    parseInt(document.getElementById('form-groupe').value)
  };

  afficherEtudiants(etudiants);
  sauvegarderJSON();
  fermerFormulaire();
}

// ── Supprimer un étudiant ────────────────────────────────────
function supprimerEtudiant(id) {
  if (!confirm(`Supprimer l'étudiant #${id} ?`)) return;
  etudiants = etudiants.filter(e => e.id !== id);
  afficherEtudiants(etudiants);
  sauvegarderJSON();
  console.log(`Étudiant #${id} supprimé.`);
}

// ── Fermer le formulaire ─────────────────────────────────────
function fermerFormulaire() {
  document.getElementById('formulaire').style.display = 'none';
  document.getElementById('form-id').value = '';
}

// ── Export JSON (téléchargement) ─────────────────────────────
function sauvegarderJSON() {
  const json = JSON.stringify(etudiants, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'etudiants.json';
  a.click();
  URL.revokeObjectURL(url);
}

// ── Démarrage ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', chargerEtudiants);
